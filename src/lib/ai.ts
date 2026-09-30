import { bookingStore } from './booking-store';
import { TimeSlot } from './types';

export interface SmartBookingRequest {
  business_slug: string;
  user_prompt: string; // e.g. "Find me a haircut slot next Tuesday afternoon"
}

export interface SmartBookingResponse {
  interpreted_intent: {
    service_name?: string;
    preferred_date?: string;
    time_window?: 'morning' | 'afternoon' | 'evening' | 'any';
    matched_service_id?: string;
  };
  available_slots: TimeSlot[];
}

export interface NoShowRiskRequest {
  client_id: string;
  business_id: string;
  booking_starts_at: string;
}

export interface NoShowRiskResponse {
  risk_score: number; // 0 to 100
  risk_level: 'Low' | 'Medium' | 'High';
  reasons: string[];
}

export interface FollowUpRequest {
  client_name: string;
  service_name: string;
  business_name: string;
  tone?: 'friendly' | 'professional' | 'casual';
}

/**
 * Parses natural language scheduling requests and retrieves authoritative availability
 */
export async function processSmartBooking(req: SmartBookingRequest): Promise<SmartBookingResponse> {
  const { business_slug, user_prompt } = req;
  const promptLower = user_prompt.toLowerCase();

  const business = await bookingStore.getBusinessBySlug(business_slug);
  if (!business) {
    throw new Error('Business not found');
  }

  const services = await bookingStore.getServicesByBusinessId(business.id);
  
  // 1. Identify requested service from prompt
  let matchedService = services.find((s) => promptLower.includes(s.name.toLowerCase()));
  if (!matchedService) {
    matchedService = services[0]; // Default to first active service
  }

  // 2. Identify requested date or offset
  const today = new Date();
  let targetDate = new Date(today);

  if (promptLower.includes('tomorrow')) {
    targetDate.setDate(today.getDate() + 1);
  } else if (promptLower.includes('next tuesday') || promptLower.includes('tuesday')) {
    const daysUntilTuesday = (2 - today.getDay() + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + daysUntilTuesday);
  } else if (promptLower.includes('next friday') || promptLower.includes('friday')) {
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + daysUntilFriday);
  } else {
    targetDate.setDate(today.getDate() + 1); // Default tomorrow
  }

  const targetDateStr = targetDate.toISOString().split('T')[0];

  // 3. Determine time window
  let timeWindow: 'morning' | 'afternoon' | 'evening' | 'any' = 'any';
  if (promptLower.includes('morning')) timeWindow = 'morning';
  if (promptLower.includes('afternoon')) timeWindow = 'afternoon';
  if (promptLower.includes('evening')) timeWindow = 'evening';

  // 4. Fetch authoritative slots using core availability engine
  const slots = await bookingStore.getAvailableSlots(business_slug, matchedService.id, targetDateStr);

  // Filter slots by time window if specified
  const filteredSlots = slots.filter((slot) => {
    const hour = new Date(slot.starts_at).getUTCHours();
    if (timeWindow === 'morning') return hour >= 6 && hour < 12;
    if (timeWindow === 'afternoon') return hour >= 12 && hour < 17;
    if (timeWindow === 'evening') return hour >= 17 && hour < 22;
    return true;
  });

  return {
    interpreted_intent: {
      service_name: matchedService.name,
      preferred_date: targetDateStr,
      time_window: timeWindow,
      matched_service_id: matchedService.id,
    },
    available_slots: filteredSlots.length > 0 ? filteredSlots : slots.slice(0, 5),
  };
}

/**
 * Generates heuristic AI No-Show Risk Score based on booking parameters
 */
export async function calculateNoShowRisk(req: NoShowRiskRequest): Promise<NoShowRiskResponse> {
  const { client_id, business_id, booking_starts_at } = req;
  const clients = await bookingStore.getClientsByBusinessId(business_id);
  const client = clients.find((c) => c.id === client_id);
  const bookings = await bookingStore.getBookingsByBusinessId(business_id);
  const clientBookings = bookings.filter((b) => b.client_id === client_id);

  let riskScore = 15; // Baseline risk score
  const reasons: string[] = [];

  // Lead time calculation (booking far in advance vs last minute)
  const nowMs = Date.now();
  const bookingMs = new Date(booking_starts_at).getTime();
  const leadTimeDays = (bookingMs - nowMs) / (1000 * 3600 * 24);

  if (leadTimeDays > 14) {
    riskScore += 25;
    reasons.push('High lead time (> 14 days) increases risk of forgotten appointments.');
  }

  // Previous no-show history
  const noShows = clientBookings.filter((b) => b.status === 'no_show').length;
  if (noShows > 0) {
    riskScore += noShows * 30;
    reasons.push(`Client has ${noShows} past no-show record(s).`);
  }

  // Cancellations history
  const cancellations = clientBookings.filter((b) => b.status === 'cancelled').length;
  if (cancellations > 1) {
    riskScore += 15;
    reasons.push(`Client has ${cancellations} previous cancellations.`);
  }

  // New client baseline
  if (!client || (client.total_bookings || 0) === 0) {
    riskScore += 10;
    reasons.push('First-time customer with no prior attendance history.');
  } else {
    reasons.push(`Established customer with ${client.total_bookings} prior bookings.`);
  }

  riskScore = Math.min(Math.max(riskScore, 5), 95);

  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (riskScore >= 60) riskLevel = 'High';
  else if (riskScore >= 35) riskLevel = 'Medium';

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    reasons,
  };
}

/**
 * Generates personalized AI follow-up post-appointment text
 */
export async function generateFollowUpMessage(req: FollowUpRequest): Promise<{ message: string }> {
  const { client_name, service_name, business_name, tone = 'friendly' } = req;

  if (tone === 'professional') {
    return {
      message: `Dear ${client_name}, thank you for visiting ${business_name} for your ${service_name}. We appreciate your trust in our services and look forward to assisting you again soon.`,
    };
  }

  if (tone === 'casual') {
    return {
      message: `Hey ${client_name}! Hope you enjoyed your ${service_name} at ${business_name} today! Let us know if you need anything else or want to book your next visit.`,
    };
  }

  return {
    message: `Hi ${client_name}! Thanks for stopping by ${business_name} today for your ${service_name}. We hope you had a great experience! Feel free to reply here if you have any questions or feedback.`,
  };
}

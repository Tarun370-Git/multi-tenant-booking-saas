import { 
  Business, 
  Service, 
  Provider, 
  BusinessHours, 
  ProviderHours, 
  BlockedPeriod, 
  Booking, 
  TimeSlot 
} from './types';
import { fromZonedTime } from 'date-fns-tz';

export interface CalculateSlotsParams {
  business: Business;
  service: Service;
  providers: Provider[];
  businessHours: BusinessHours[];
  providerHours?: ProviderHours[];
  blockedPeriods: BlockedPeriod[];
  existingBookings: Booking[];
  targetDateStr: string; // YYYY-MM-DD
  selectedProviderId?: string;
  slotIntervalMinutes?: number;
}

/**
 * Calculates available booking time slots for a given service and date
 * Enforces business/provider operating hours, blocked periods, existing bookings, and overlap prevention.
 */
export function calculateAvailableSlots(params: CalculateSlotsParams): TimeSlot[] {
  const {
    business,
    service,
    providers,
    businessHours,
    providerHours = [],
    blockedPeriods,
    existingBookings,
    targetDateStr,
    selectedProviderId,
    slotIntervalMinutes = 15,
  } = params;

  if (business.status !== 'active') {
    return [];
  }

  // Target date parsing
  const dateObj = new Date(`${targetDateStr}T00:00:00.000Z`);
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Sun, 6 = Sat

  // Target providers to check
  const activeProviders = providers.filter(
    (p) => p.active && (!selectedProviderId || p.id === selectedProviderId)
  );

  if (activeProviders.length === 0) {
    return [];
  }

  const availableSlots: TimeSlot[] = [];
  const seenStartTimes = new Set<string>();

  for (const provider of activeProviders) {
    // 1. Determine operating hours for provider or business
    const pHours = providerHours.find(
      (ph) => ph.provider_id === provider.id && ph.day_of_week === dayOfWeek
    );
    const bHours = businessHours.find((bh) => bh.day_of_week === dayOfWeek);

    const activeSchedule = pHours || bHours;
    if (!activeSchedule || !activeSchedule.enabled) {
      continue; // Closed on this day
    }

    // Schedule times are wall-clock values in the business timezone.
    const dayStartMs = fromZonedTime(`${targetDateStr}T${activeSchedule.start_time}`, business.timezone).getTime();
    const dayEndMs = fromZonedTime(`${targetDateStr}T${activeSchedule.end_time}`, business.timezone).getTime();
    const serviceDurationMs = service.duration_minutes * 60 * 1000;
    const intervalMs = slotIntervalMinutes * 60 * 1000;

    // Generate candidate start times
    for (let currentStartMs = dayStartMs; currentStartMs + serviceDurationMs <= dayEndMs; currentStartMs += intervalMs) {
      const candidateStartIso = new Date(currentStartMs).toISOString();
      const candidateEndIso = new Date(currentStartMs + serviceDurationMs).toISOString();

      // Check 1: Overlap with existing active bookings for this provider
      // Overlap rule: existing_start < requested_end AND existing_end > requested_start
      const hasBookingOverlap = existingBookings.some((b) => {
        if (b.provider_id !== provider.id) return false;
        if (b.status === 'cancelled') return false;

        const bStart = new Date(b.starts_at).getTime();
        const bEnd = new Date(b.ends_at).getTime();

        return bStart < (currentStartMs + serviceDurationMs) && bEnd > currentStartMs;
      });

      if (hasBookingOverlap) {
        continue;
      }

      // Check 2: Overlap with blocked periods (business-wide or provider-specific)
      const hasBlockedOverlap = blockedPeriods.some((bp) => {
        if (bp.provider_id && bp.provider_id !== provider.id) return false;

        const bpStart = new Date(bp.starts_at).getTime();
        const bpEnd = new Date(bp.ends_at).getTime();

        return bpStart < (currentStartMs + serviceDurationMs) && bpEnd > currentStartMs;
      });

      if (hasBlockedOverlap) {
        continue;
      }

      if (seenStartTimes.has(candidateStartIso)) {
        continue;
      }

      // Valid available slot found!
      seenStartTimes.add(candidateStartIso);
      availableSlots.push({
        starts_at: candidateStartIso,
        ends_at: candidateEndIso,
        provider_id: provider.id,
        available: true,
      });
    }
  }

  // Sort slots by start time
  return availableSlots.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}

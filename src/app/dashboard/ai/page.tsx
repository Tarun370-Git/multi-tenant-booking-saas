'use client';

import { useState } from 'react';
import { Sparkles, Search, AlertTriangle, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { TimeSlot } from '@/lib/types';
import { useDashboardTenant } from '../tenant-context';

export default function AISuitePage() {
  const { tenant } = useDashboardTenant();
  // Tool 1: AI Assistant
  const [prompt, setPrompt] = useState('Find me a haircut slot next Tuesday afternoon');
  const [aiSlots, setAiSlots] = useState<TimeSlot[]>([]);
  const [interpretedIntent, setInterpretedIntent] = useState<Record<string, unknown> | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Tool 2: AI Risk Predictor
  const [riskClient, setRiskClient] = useState('11111111-4444-1111-1111-111111111111');
  const [riskResult, setRiskResult] = useState<{ risk_score: number; risk_level: string; reasons: string[] } | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Tool 3: AI Follow-Up Generator
  const [followupClient, setFollowupClient] = useState('John Doe');
  const [followupService, setFollowupService] = useState('Classic Haircut');
  const [followupTone, setFollowupTone] = useState<'friendly' | 'professional' | 'casual'>('friendly');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [loadingFollowup, setLoadingFollowup] = useState(false);

  const handleRunSmartBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    try {
      setLoadingAi(true);
      const res = await fetch('/api/ai/smart-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_slug: tenant.slug,
          user_prompt: prompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInterpretedIntent(data.interpreted_intent);
        setAiSlots(data.available_slots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handlePredictRisk = async () => {
    try {
      setLoadingRisk(true);
      const res = await fetch('/api/ai/no-show-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: riskClient,
          business_id: tenant.id,
          booking_starts_at: new Date(Date.now() + 15 * 86400000).toISOString(),
        }),
      });

      if (res.ok) {
        setRiskResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRisk(false);
    }
  };

  const handleGenerateFollowUp = async () => {
    try {
      setLoadingFollowup(true);
      const res = await fetch('/api/ai/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: followupClient,
          service_name: followupService,
          business_name: tenant.name,
          tone: followupTone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedMsg(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFollowup(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 text-amber-500 mb-1">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-wider">Bonus Suite</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">AI Enhancements & Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">Smart Scheduling Assistant, No-Show Predictor, and Follow-Up Generator.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tool 1: AI Smart Scheduling Assistant */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" /> 21.1 AI Smart Scheduling Assistant
          </h2>
          <p className="text-xs text-slate-500">Converts natural language queries into authoritative availability lookups.</p>

          <form onSubmit={handleRunSmartBooking} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Find me a haircut slot next Tuesday afternoon"
                className="w-full pl-3 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                type="submit"
                disabled={loadingAi}
                className="absolute right-1 top-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs"
              >
                {loadingAi ? 'Searching...' : 'Ask AI'}
              </button>
            </div>
          </form>

          {interpretedIntent && (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-xs space-y-2">
              <span className="font-extrabold text-purple-900 block">Interpreted Scheduling Constraints:</span>
              <pre className="text-[11px] font-mono text-purple-800 bg-white/80 p-2 rounded border border-purple-200">
                {JSON.stringify(interpretedIntent, null, 2)}
              </pre>

              <div className="pt-2">
                <span className="font-bold text-purple-900 block mb-1">Authoritative Matching Slots:</span>
                <div className="flex flex-wrap gap-1.5">
                  {aiSlots.map((slot, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white text-purple-700 font-bold border border-purple-200 rounded-md shadow-2xs text-[11px]">
                      {new Date(slot.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tool 2: AI No-Show Predictor */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> 21.2 AI No-Show Predictor
          </h2>
          <p className="text-xs text-slate-500">Heuristic risk scoring based on customer lead time and past booking attendance.</p>

          <button
            onClick={handlePredictRisk}
            disabled={loadingRisk}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            {loadingRisk ? 'Calculating Risk...' : 'Calculate Sample Risk Score'}
          </button>

          {riskResult && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-amber-950">Calculated Risk Score:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                  riskResult.risk_level === 'High' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {riskResult.risk_score}/100 ({riskResult.risk_level} Risk)
                </span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-amber-900 font-medium">
                {riskResult.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tool 3: AI Follow-Up Generator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" /> 21.3 Automated AI Follow-up Message Generator
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={followupClient}
              onChange={(e) => setFollowupClient(e.target.value)}
              placeholder="Client Name"
              className="p-2.5 bg-slate-50 border rounded-xl text-xs"
            />
            <input
              type="text"
              value={followupService}
              onChange={(e) => setFollowupService(e.target.value)}
              placeholder="Service Name"
              className="p-2.5 bg-slate-50 border rounded-xl text-xs"
            />
            <select
              value={followupTone}
              onChange={(e) => setFollowupTone(e.target.value as 'friendly' | 'professional' | 'casual')}
              className="p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
            >
              <option value="friendly">Friendly Tone</option>
              <option value="professional">Professional Tone</option>
              <option value="casual">Casual Tone</option>
            </select>
          </div>

          <button
            onClick={handleGenerateFollowUp}
            disabled={loadingFollowup}
            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            {loadingFollowup ? 'Generating...' : 'Generate Follow-Up Text'}
          </button>

          {generatedMsg && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs font-medium text-blue-950">
              <span className="font-extrabold text-blue-900 block mb-1">Generated Message:</span>
              <p className="italic bg-white p-3 rounded-lg border border-blue-100">{generatedMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

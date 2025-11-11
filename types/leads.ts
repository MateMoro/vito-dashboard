// Lead status types matching the Supabase enum
export type LeadStatus = 'in_progress' | 'completed' | 'failed' | 'responded' | 'opt_out';

// Conversation stages matching the Supabase conversation_stage column
export type ConvoStage =
  | 'Initial Contact'
  | 'Rapport Building'
  | 'Qualification'
  | 'Call Proposed'
  | 'Call Booked'
  | 'Post-Call Follow-up'
  | 'Closed/Won'
  | 'Closed/Lost'
  | 'Ghosted';

// Main lead interface matching Supabase schema
export interface Lead {
  id: string;
  ig_username: string;
  full_name: string | null;
  email: string | null;
  status: LeadStatus;
  initial_contact_date: string | null;
  occupation: string | null;
  pain_point: string | null;
  age: number | null;
  goals: string | null;
  motivation: string | null;
  timeline: string | null;
  conversation_stage: ConvoStage | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// KPI data structure
export interface LeadKPIs {
  totalLeads: number;
  leadsWon: number;
  leadsLost: number;
  leadsInProgress: number;
  responseRate: number;
  optOutRate: number;
}

// Calls KPI structure (placeholder for now)
export interface CallsKPIs {
  callsProposed: number;
  callsBooked: number;
  callsCancelled: number;
  callShowUpRate: number;
  bookingRate: number;
}

// Time frame options
export type TimeFrame = '1D' | '1W' | '1M' | '6M' | '1Y' | 'ALL' | 'CUSTOM';

// Date range for custom time frame
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Trend data for mini charts
export interface TrendData {
  date: string;
  value: number;
}

import { Lead, LeadKPIs, CallsKPIs, TimeFrame, TrendData } from '@/types/leads';
import { subDays, subMonths, subYears, isAfter, parseISO } from 'date-fns';

/**
 * Calculate the date range based on the selected time frame
 */
export function getDateRangeFromTimeFrame(timeFrame: TimeFrame): Date | null {
  const now = new Date();

  switch (timeFrame) {
    case '1D':
      return subDays(now, 1);
    case '1W':
      return subDays(now, 7);
    case '1M':
      return subMonths(now, 1);
    case '6M':
      return subMonths(now, 6);
    case '1Y':
      return subYears(now, 1);
    case 'ALL':
      return null; // No filtering
    case 'CUSTOM':
      return null; // Handled separately
    default:
      return null;
  }
}

/**
 * Filter leads based on date range
 */
export function filterLeadsByDateRange(
  leads: Lead[],
  startDate: Date | null,
  endDate?: Date
): Lead[] {
  if (!startDate) {
    return leads;
  }

  return leads.filter((lead) => {
    const createdAt = parseISO(lead.created_at);
    const isAfterStart = isAfter(createdAt, startDate);
    const isBeforeEnd = endDate ? !isAfter(createdAt, endDate) : true;
    return isAfterStart && isBeforeEnd;
  });
}

/**
 * Calculate all lead KPIs from the filtered lead data
 */
export function calculateLeadKPIs(leads: Lead[]): LeadKPIs {
  const totalLeads = leads.length;

  const leadsWon = leads.filter((lead) => lead.conversation_stage === 'Closed/Won').length;
  const leadsLost = leads.filter((lead) => lead.conversation_stage === 'Closed/Lost').length;

  // Count leads as "in progress" if they have active conversation stages or in_progress status
  const activeStages = [
    'Initial Contact',
    'Rapport Building',
    'Qualification',
    'Call Proposed',
    'Call Booked',
    'Post-Call Follow-up'
  ];
  const leadsInProgress = leads.filter(
    (lead) => lead.status === 'in_progress' || activeStages.includes(lead.conversation_stage || '')
  ).length;

  // Placeholder calculations for response rate and opt-out rate
  // These can be calculated based on 'responded' and 'opt_out' status values
  const leadsResponded = leads.filter((lead) => lead.status === 'responded').length;
  const leadsOptOut = leads.filter((lead) => lead.status === 'opt_out').length;

  const responseRate = totalLeads > 0 ? (leadsResponded / totalLeads) * 100 : 0;
  const optOutRate = totalLeads > 0 ? (leadsOptOut / totalLeads) * 100 : 0;

  return {
    totalLeads,
    leadsWon,
    leadsLost,
    leadsInProgress,
    responseRate,
    optOutRate,
  };
}

/**
 * Calculate calls KPIs based on conversation_stage from lead data
 */
export function getCallsKPIs(leads: Lead[]): CallsKPIs {
  // Count leads by conversation stage
  const callsProposed = leads.filter(
    (lead) => lead.conversation_stage === 'Call Proposed'
  ).length;

  const callsBooked = leads.filter(
    (lead) => lead.conversation_stage === 'Call Booked'
  ).length;

  // Use 'Ghosted' as a proxy for cancelled calls
  const callsCancelled = leads.filter(
    (lead) => lead.conversation_stage === 'Ghosted'
  ).length;

  // Calculate show-up rate: leads in Post-Call Follow-up divided by total calls booked
  const callsCompleted = leads.filter(
    (lead) => lead.conversation_stage === 'Post-Call Follow-up' ||
              lead.conversation_stage === 'Closed/Won' ||
              lead.conversation_stage === 'Closed/Lost'
  ).length;

  const callShowUpRate = callsBooked > 0 ? (callsCompleted / callsBooked) * 100 : 0;

  // Calculate booking rate: percentage of proposed calls that got booked
  const bookingRate = callsProposed > 0 ? (callsBooked / callsProposed) * 100 : 0;

  return {
    callsProposed,
    callsBooked,
    callsCancelled,
    callShowUpRate,
    bookingRate,
  };
}

/**
 * Generate empty trend data for mini charts
 * Returns zeroed data points until real historical data is available
 */
export function generateEmptyTrendData(points: number = 7): TrendData[] {
  const data: TrendData[] = [];
  const now = new Date();

  for (let i = points - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const value = 0; // Zero values until real data is available

    data.push({
      date: date.toISOString().split('T')[0],
      value,
    });
  }

  return data;
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

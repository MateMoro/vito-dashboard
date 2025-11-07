'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import {
  calculateLeadKPIs,
  getCallsKPIs,
  getDateRangeFromTimeFrame,
  filterLeadsByDateRange,
  generateMockTrendData,
  formatPercentage,
  formatNumber,
} from '@/lib/kpiCalculations';
import type { Lead, TimeFrame, DateRange, LeadKPIs, CallsKPIs } from '@/types/leads';

export default function LeadDashboard() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('ALL');
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leads from Supabase
  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from('crm_leads').select('*');

        // Apply time frame filter
        if (timeFrame === 'CUSTOM' && customRange.from) {
          const fromISO = customRange.from.toISOString();
          query = query.gte('created_at', fromISO);

          if (customRange.to) {
            const toISO = customRange.to.toISOString();
            query = query.lte('created_at', toISO);
          }
        } else if (timeFrame !== 'ALL') {
          const startDate = getDateRangeFromTimeFrame(timeFrame);
          if (startDate) {
            query = query.gte('created_at', startDate.toISOString());
          }
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setLeads(data || []);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Failed to fetch leads. Please check your Supabase configuration.');
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, [timeFrame, customRange]);

  // Calculate KPIs
  const leadKPIs: LeadKPIs = calculateLeadKPIs(leads);
  const callsKPIs: CallsKPIs = getCallsKPIs(leads);

  // Time frame buttons
  const timeFrames: TimeFrame[] = ['1D', '1W', '1M', '6M', '1Y', 'ALL'];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2 tracking-tight">Lead Dashboard</h1>
          <p className="text-gray-400 text-lg">Instagram Lead Analytics</p>
        </div>

        {/* Time Frame Filters */}
        <div className="mb-8 flex flex-wrap gap-3 items-center">
          {timeFrames.map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeFrame(tf);
                setShowDatePicker(false);
              }}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                timeFrame === tf && timeFrame !== 'CUSTOM'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
          <button
            onClick={() => {
              setTimeFrame('CUSTOM');
              setShowDatePicker(!showDatePicker);
            }}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              timeFrame === 'CUSTOM'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Custom Date Picker */}
        {showDatePicker && (
          <div className="mb-8 p-6 bg-gray-800 rounded-xl inline-block">
            <DayPicker
              mode="range"
              selected={customRange}
              onSelect={(range) => {
                if (range) {
                  setCustomRange(range as DateRange);
                }
              }}
              className="text-white"
              styles={{
                caption: { color: 'white' },
                head_cell: { color: '#9CA3AF' },
                cell: { color: 'white' },
              }}
            />
          </div>
        )}

        {/* Loading / Error States */}
        {loading && (
          <div className="text-center py-12 text-gray-400 text-lg">
            Loading dashboard data...
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-xl p-6 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Lead KPIs Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <KPICard
                title="Total Leads"
                value={formatNumber(leadKPIs.totalLeads)}
                trend={generateMockTrendData()}
                color="blue"
              />
              <KPICard
                title="Leads Won"
                value={formatNumber(leadKPIs.leadsWon)}
                trend={generateMockTrendData()}
                color="green"
              />
              <KPICard
                title="Leads Lost"
                value={formatNumber(leadKPIs.leadsLost)}
                trend={generateMockTrendData()}
                color="red"
              />
              <KPICard
                title="In Progress"
                value={formatNumber(leadKPIs.leadsInProgress)}
                trend={generateMockTrendData()}
                color="yellow"
              />
              <KPICard
                title="Response Rate"
                value={formatPercentage(leadKPIs.responseRate)}
                trend={generateMockTrendData()}
                color="purple"
                subtitle="Placeholder"
              />
              <KPICard
                title="Opt-out Rate"
                value={formatPercentage(leadKPIs.optOutRate)}
                trend={generateMockTrendData()}
                color="orange"
                subtitle="Placeholder"
              />
            </div>

            {/* Calls KPIs Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-6 tracking-tight">Calls KPIs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Calls Proposed"
                  value={formatNumber(callsKPIs.callsProposed)}
                  trend={generateMockTrendData()}
                  color="cyan"
                  subtitle="Coming soon"
                />
                <KPICard
                  title="Calls Booked"
                  value={formatNumber(callsKPIs.callsBooked)}
                  trend={generateMockTrendData()}
                  color="teal"
                  subtitle="Coming soon"
                />
                <KPICard
                  title="Calls Cancelled"
                  value={formatNumber(callsKPIs.callsCancelled)}
                  trend={generateMockTrendData()}
                  color="pink"
                  subtitle="Coming soon"
                />
                <KPICard
                  title="Show-up Rate"
                  value={formatPercentage(callsKPIs.callShowUpRate)}
                  trend={generateMockTrendData()}
                  color="indigo"
                  subtitle="Coming soon"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  trend: Array<{ date: string; value: number }>;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'teal' | 'pink' | 'indigo';
  subtitle?: string;
}

function KPICard({ title, value, trend, color, subtitle }: KPICardProps) {
  const colorMap = {
    blue: 'from-blue-600/20 to-blue-900/20 border-blue-600/30',
    green: 'from-green-600/20 to-green-900/20 border-green-600/30',
    red: 'from-red-600/20 to-red-900/20 border-red-600/30',
    yellow: 'from-yellow-600/20 to-yellow-900/20 border-yellow-600/30',
    purple: 'from-purple-600/20 to-purple-900/20 border-purple-600/30',
    orange: 'from-orange-600/20 to-orange-900/20 border-orange-600/30',
    cyan: 'from-cyan-600/20 to-cyan-900/20 border-cyan-600/30',
    teal: 'from-teal-600/20 to-teal-900/20 border-teal-600/30',
    pink: 'from-pink-600/20 to-pink-900/20 border-pink-600/30',
    indigo: 'from-indigo-600/20 to-indigo-900/20 border-indigo-600/30',
  };

  const lineColorMap = {
    blue: '#3B82F6',
    green: '#10B981',
    red: '#EF4444',
    yellow: '#F59E0B',
    purple: '#A855F7',
    orange: '#F97316',
    cyan: '#06B6D4',
    teal: '#14B8A6',
    pink: '#EC4899',
    indigo: '#6366F1',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-6 hover:scale-[1.02] transition-transform duration-200`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">{title}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
      </div>
      <p className="text-5xl font-bold mb-6 tracking-tight">{value}</p>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColorMap[color]}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

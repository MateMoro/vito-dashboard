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
  generateEmptyTrendData,
  formatPercentage,
  formatNumber,
} from '@/lib/kpiCalculations';
import type { Lead, TimeFrame, DateRange, LeadKPIs, CallsKPIs } from '@/types/leads';

export default function LeadDashboard() {
  const [activeTab, setActiveTab] = useState<'kpis' | 'crm'>('kpis');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('ALL');
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRM filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [crmDateRange, setCrmDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [showCrmDatePicker, setShowCrmDatePicker] = useState(false);

  // Modal state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Handle modal actions
  const openModal = (lead: Lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLead(null);
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal]);

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

  // Filter CRM leads
  const filteredCrmLeads = leads.filter((lead) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesUsername = lead.ig_username.toLowerCase().includes(query);
      const matchesName = lead.full_name?.toLowerCase().includes(query) || false;
      if (!matchesUsername && !matchesName) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

    // Stage filter
    if (stageFilter !== 'all' && lead.conversation_stage !== stageFilter) return false;

    // Date filter
    if (crmDateRange.from && lead.initial_contact_date) {
      const leadDate = new Date(lead.initial_contact_date);
      if (leadDate < crmDateRange.from) return false;
      if (crmDateRange.to && leadDate > crmDateRange.to) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 tracking-tight">Dashboard Lead</h1>
          <p className="text-gray-400 text-lg">Analisi Lead Instagram</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
              activeTab === 'kpis'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Dashboard KPIs
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
              activeTab === 'crm'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Vista CRM
          </button>
        </div>

        {/* Time Frame Filters - Only show for KPIs tab */}
        {activeTab === 'kpis' && (
          <>
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
            Intervallo Personalizzato
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
          </>
        )}

        {/* CRM Filters - Only show for CRM tab */}
        {activeTab === 'crm' && (
          <div className="mb-8 space-y-4">
            {/* Search and Filters Row */}
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Cerca per nome o username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[250px] px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tutti gli Stati</option>
                <option value="in_progress">In Corso</option>
                <option value="completed">Completato</option>
                <option value="failed">Fallito</option>
                <option value="responded">Risposto</option>
                <option value="opt_out">Opt Out</option>
              </select>

              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tutte le Fasi</option>
                <option value="Initial Contact">Contatto Iniziale</option>
                <option value="Rapport Building">Costruzione Rapporto</option>
                <option value="Qualification">Qualificazione</option>
                <option value="Call Proposed">Chiamata Proposta</option>
                <option value="Call Booked">Chiamata Prenotata</option>
                <option value="Post-Call Follow-up">Follow-up Post-Chiamata</option>
                <option value="Closed/Won">Chiuso/Vinto</option>
                <option value="Closed/Lost">Chiuso/Perso</option>
                <option value="Ghosted">Ghosted</option>
              </select>

              {/* Date Range Toggle */}
              <button
                onClick={() => setShowCrmDatePicker(!showCrmDatePicker)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  showCrmDatePicker || crmDateRange.from
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Filtro Data
              </button>

              {/* Clear Filters */}
              {(searchQuery || statusFilter !== 'all' || stageFilter !== 'all' || crmDateRange.from) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setStageFilter('all');
                    setCrmDateRange({ from: undefined, to: undefined });
                    setShowCrmDatePicker(false);
                  }}
                  className="px-5 py-2.5 rounded-lg font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all duration-200"
                >
                  Cancella Filtri
                </button>
              )}
            </div>

            {/* CRM Date Picker */}
            {showCrmDatePicker && (
              <div className="p-6 bg-gray-800 rounded-xl inline-block">
                <DayPicker
                  mode="range"
                  selected={crmDateRange}
                  onSelect={(range) => {
                    if (range) {
                      setCrmDateRange(range as DateRange);
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
          </div>
        )}

        {/* Loading / Error States */}
        {loading && (
          <div className="text-center py-12 text-gray-400 text-lg">
            Caricamento dati dashboard...
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-xl p-6 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* KPIs Tab Content */}
        {!loading && !error && activeTab === 'kpis' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <KPICard
                title="Lead Totali"
                value={formatNumber(leadKPIs.totalLeads)}
                trend={generateEmptyTrendData()}
                color="blue"
              />
              <KPICard
                title="Lead Vinti"
                value={formatNumber(leadKPIs.leadsWon)}
                trend={generateEmptyTrendData()}
                color="green"
              />
              <KPICard
                title="Lead Persi"
                value={formatNumber(leadKPIs.leadsLost)}
                trend={generateEmptyTrendData()}
                color="red"
              />
              <KPICard
                title="In Corso"
                value={formatNumber(leadKPIs.leadsInProgress)}
                trend={generateEmptyTrendData()}
                color="yellow"
              />
              <KPICard
                title="Reply Rate"
                value={formatPercentage(leadKPIs.responseRate)}
                trend={generateEmptyTrendData()}
                color="purple"
              />
              <KPICard
                title="Opt-out Rate"
                value={formatPercentage(leadKPIs.optOutRate)}
                trend={generateEmptyTrendData()}
                color="orange"
              />
            </div>

            {/* Calls KPIs Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-6 tracking-tight">KPI Chiamate</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Chiamate Proposte"
                  value={formatNumber(callsKPIs.callsProposed)}
                  trend={generateEmptyTrendData()}
                  color="cyan"
                />
                <KPICard
                  title="Chiamate Prenotate"
                  value={formatNumber(callsKPIs.callsBooked)}
                  trend={generateEmptyTrendData()}
                  color="teal"
                />
                <KPICard
                  title="Chiamate Cancellate"
                  value={formatNumber(callsKPIs.callsCancelled)}
                  trend={generateEmptyTrendData()}
                  color="pink"
                />
                <KPICard
                  title="Booking Rate"
                  value={formatPercentage(callsKPIs.bookingRate)}
                  trend={generateEmptyTrendData()}
                  color="orange"
                />
              </div>
            </div>
          </>
        )}

        {/* CRM Tab Content */}
        {!loading && !error && activeTab === 'crm' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username IG</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome Completo</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stato</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Occupazione</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pain Point</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Età</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fase</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Obiettivi</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Motivazione</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredCrmLeads.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center text-gray-400">
                        Nessun lead trovato con i filtri selezionati.
                      </td>
                    </tr>
                  ) : (
                    filteredCrmLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => openModal(lead)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">
                          @{lead.ig_username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {lead.full_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {lead.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {lead.initial_contact_date
                            ? new Date(lead.initial_contact_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 max-w-[200px] truncate">
                          {lead.occupation || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 max-w-[250px] truncate" title={lead.pain_point || ''}>
                          {lead.pain_point || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {lead.age || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StageBadge stage={lead.conversation_stage} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 max-w-[200px] truncate" title={lead.goals || ''}>
                          {lead.goals || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 max-w-[200px] truncate" title={lead.motivation || ''}>
                          {lead.motivation || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 max-w-[150px] truncate">
                          {lead.timeline || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Results Count */}
            <div className="px-6 py-4 bg-gray-900/30 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Visualizzati <span className="font-medium text-white">{filteredCrmLeads.length}</span> di{' '}
                <span className="font-medium text-white">{leads.length}</span> leads
              </p>
            </div>
          </div>
        )}

        {/* Lead Detail Modal */}
        {showModal && selectedLead && (
          <LeadDetailModal lead={selectedLead} onClose={closeModal} />
        )}
      </div>
    </div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors = {
    completed: 'bg-green-600/20 text-green-400 border-green-600/30',
    in_progress: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    failed: 'bg-red-600/20 text-red-400 border-red-600/30',
    responded: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    opt_out: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };

  const statusLabels = {
    completed: 'Completato',
    in_progress: 'In Corso',
    failed: 'Fallito',
    responded: 'Risposto',
    opt_out: 'Opt Out',
  };

  const colorClass = statusColors[status as keyof typeof statusColors] || statusColors.in_progress;
  const label = statusLabels[status as keyof typeof statusLabels] || status;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}

// Stage Badge Component
interface StageBadgeProps {
  stage: string | null;
}

function StageBadge({ stage }: StageBadgeProps) {
  if (!stage) return <span className="text-gray-500 text-sm">-</span>;

  const stageColors = {
    'Initial Contact': 'bg-purple-600/20 text-purple-400 border-purple-600/30',
    'Rapport Building': 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30',
    'Qualification': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    'Call Proposed': 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30',
    'Call Booked': 'bg-teal-600/20 text-teal-400 border-teal-600/30',
    'Post-Call Follow-up': 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    'Closed/Won': 'bg-green-600/20 text-green-400 border-green-600/30',
    'Closed/Lost': 'bg-red-600/20 text-red-400 border-red-600/30',
    'Ghosted': 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };

  const stageLabels = {
    'Initial Contact': 'Contatto Iniziale',
    'Rapport Building': 'Costruzione Rapporto',
    'Qualification': 'Qualificazione',
    'Call Proposed': 'Chiamata Proposta',
    'Call Booked': 'Chiamata Prenotata',
    'Post-Call Follow-up': 'Follow-up Post-Chiamata',
    'Closed/Won': 'Chiuso/Vinto',
    'Closed/Lost': 'Chiuso/Perso',
    'Ghosted': 'Ghosted',
  };

  const colorClass = stageColors[stage as keyof typeof stageColors] || 'bg-gray-600/20 text-gray-400 border-gray-600/30';
  const label = stageLabels[stage as keyof typeof stageLabels] || stage;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${colorClass}`}>
      {label}
    </span>
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

// Lead Detail Modal Component
interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
}

function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-8 py-6 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-blue-400 mb-1">@{lead.ig_username}</h2>
            {lead.full_name && (
              <p className="text-xl text-gray-300">{lead.full_name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Status Row */}
          <div className="flex flex-wrap gap-4 items-center">
            <StatusBadge status={lead.status} />
            {lead.conversation_stage && <StageBadge stage={lead.conversation_stage} />}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField label="Email" value={lead.email} />
            <DetailField
              label="Data"
              value={lead.initial_contact_date ? new Date(lead.initial_contact_date).toLocaleDateString('it-IT') : null}
            />
            <DetailField label="Occupazione" value={lead.occupation} />
            <DetailField label="Età" value={lead.age?.toString()} />
          </div>

          {/* Full Text Fields */}
          <div className="space-y-6 pt-4 border-t border-gray-700">
            <DetailFieldFull
              label="Pain Point"
              value={lead.pain_point}
              highlight={true}
            />
            <DetailFieldFull label="Obiettivi" value={lead.goals} />
            <DetailFieldFull label="Motivazione" value={lead.motivation} />
            <DetailFieldFull label="Timeline" value={lead.timeline} />
            {lead.notes && <DetailFieldFull label="Note" value={lead.notes} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components for modal
interface DetailFieldProps {
  label: string;
  value: string | null | undefined;
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className="text-base text-gray-200">{value || '-'}</p>
    </div>
  );
}

interface DetailFieldFullProps {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}

function DetailFieldFull({ label, value, highlight = false }: DetailFieldFullProps) {
  if (!value) return null;

  return (
    <div className={highlight ? 'bg-purple-900/20 border border-purple-600/30 rounded-xl p-4' : ''}>
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">{label}</p>
      <p className="text-base text-gray-200 leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

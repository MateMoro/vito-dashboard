# 📊 Vito Dashboard - Instagram Leads Analytics

A modern, clean, dark-mode dashboard for monitoring Instagram leads with real-time analytics powered by Supabase.

![Dashboard Preview](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

- **Real-time KPI Tracking**: Monitor total leads, wins, losses, and progress
- **Time Frame Filters**: 1D, 1W, 1M, 6M, 1Y, ALL, or custom date ranges
- **Response & Opt-out Rates**: Track engagement metrics (placeholder for now)
- **Calls Analytics**: Track proposed, booked, cancelled calls and show-up rates
- **Mini Trend Charts**: Visual sparklines for each KPI
- **Dark Mode**: Modern, clean UI inspired by Superhuman and Linear
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account with a project set up
- The `crm_leads` table created in your Supabase database

### Installation

1. **Clone the repository** (if not already done):
```bash
git clone <your-repo-url>
cd vito-dashboard
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:

Create a `.env.local` file in the root directory:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Navigate to Settings → API
- Copy the Project URL and anon/public key

4. **Run the development server**:
```bash
npm run dev
```

5. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

### Required Table Schema

Make sure you have the `crm_leads` table in your Supabase database:

```sql
create table public.crm_leads (
  id uuid not null default gen_random_uuid (),
  ig_username text not null,
  full_name text null,
  email text null,
  status public.lead_status not null default 'in_progress'::lead_status,
  initial_contact_date timestamp with time zone null,
  occupation text null,
  pain_point text null,
  age integer null,
  goals text null,
  motivation text null,
  timeline text null,
  conversation_stage public.convo_stage null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint crm_leads_pkey primary key (id)
);
```

### Lead Status Enum

The `lead_status` enum should include these values:
- `in_progress`
- `completed`
- `failed`
- `responded`
- `opt_out`

Create it with:
```sql
create type public.lead_status as enum (
  'in_progress',
  'completed',
  'failed',
  'responded',
  'opt_out'
);
```

## 📊 KPI Calculations

### Lead KPIs
| KPI | Calculation |
|-----|-------------|
| **Total Leads** | `count(*)` |
| **Leads Won** | `status = 'completed'` |
| **Leads Lost** | `status = 'failed'` |
| **Leads In Progress** | `status = 'in_progress'` |
| **Response Rate** | `(status = 'responded' / total) * 100` (placeholder) |
| **Opt-out Rate** | `(status = 'opt_out' / total) * 100` (placeholder) |

### Calls KPIs (Coming Soon)
Currently showing hardcoded zeros. Future implementation will track:
- Calls Proposed
- Calls Booked
- Calls Cancelled
- Call Show-up Rate (%)

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Date Picker**: react-day-picker
- **Utilities**: date-fns

## 📁 Project Structure

```
vito-dashboard/
├── app/
│   ├── layout.tsx          # Root layout with dark mode
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles
├── components/
│   └── LeadDashboard.tsx   # Main dashboard component
├── lib/
│   ├── supabase.ts         # Supabase client setup
│   └── kpiCalculations.ts  # KPI calculation utilities
├── types/
│   └── leads.ts            # TypeScript type definitions
├── .env.local.example      # Environment variables template
└── README.md               # This file
```

## 🔧 Customization

### Adding Real Trend Data

Currently, trend charts show mock data. To implement real trends:

1. Modify `lib/kpiCalculations.ts`
2. Replace `generateMockTrendData()` with a function that:
   - Groups leads by day/week
   - Aggregates counts per period
   - Returns historical data

### Adding Calls Data

When you have a calls table:

1. Update `types/leads.ts` with calls interface
2. Modify `lib/kpiCalculations.ts` → `getCallsKPIs()` to fetch real data
3. Update `components/LeadDashboard.tsx` to use real calls data

## 🐛 Troubleshooting

### "Failed to fetch leads" error
- Check your `.env.local` file has correct Supabase credentials
- Verify your Supabase project is active
- Check the table name is `crm_leads` (not `leads`)
- Ensure Row Level Security (RLS) policies allow reads

### Date picker not showing
- Verify `react-day-picker` is installed: `npm install react-day-picker`
- Check browser console for errors

### Styles not loading
- Run `npm run dev` again to rebuild
- Clear browser cache
- Verify `tailwind.config.js` includes all paths

## 📝 TODO

- [ ] Implement real trend data calculations
- [ ] Add calls tracking table and real data
- [ ] Add lead detail view on card click
- [ ] Export data to CSV functionality
- [ ] Add filters by status/occupation
- [ ] Implement real response/opt-out rate tracking

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Built with ❤️ using Next.js and Supabase

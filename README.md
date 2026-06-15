# 🚨 Rescue Rider — Rescuing The Nation

> A real-time safety platform that connects people in danger with nearby verified delivery riders for fast emergency response.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%2B%20Auth-green?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

---

## 📌 Overview

Rescue Rider is a B.Tech final year project — a full-stack emergency response web application. Victims can request help with a single tap, and nearby verified delivery riders (Zomato, Swiggy, Blinkit, Zepto) are instantly notified in real-time to respond to the emergency.

**Tagline:** *Rescuing The Nation*

---

## ✨ Features

### 🧑‍💻 Victim Flow (No Account Required)
- One-tap **SAVE ME** button on the homepage
- Automatic GPS location capture
- Optional threat description, photo upload, and voice note
- Unique Emergency ID generated (e.g. `RR-ABC123-XY12`)
- Real-time status updates — see when a rider accepts
- Rate and review the rider after rescue

### 🏍️ Rider Flow
- Register with delivery company details (Zomato, Swiggy, Blinkit, Zepto, Other)
- Admin verification required before going live
- Available / Offline toggle
- Real-time emergency alert banner with Accept / Ignore
- **5-minute countdown timer** with urgency indicators
- Google Maps navigation to victim location
- Victim location timeline (last seen tracking)
- Mission milestones: Accepted → En Route → Arrived → In Progress → Completed
- **Inform Police** button — shares location via WhatsApp
- Hero Points, Rescue Streak, Total Rescues tracking
- Badge levels: Newcomer → Beginner Hero → Community Protector → Rescue Champion → Nation Saver

### 🛡️ Admin Panel
- Secure admin-only login
- Rider verification (Verify / Reject / Suspend / Reinstate)
- Live emergency monitoring with real-time updates
- Victim feedback & star ratings view
- Analytics dashboard (total riders, active emergencies, completion stats)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Deployment | Vercel |

---

## 📁 Project Structure

```
rescue-rider-app/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Homepage (SAVE ME button)
│   │   ├── save-me/                    # Emergency request flow
│   │   ├── rider/
│   │   │   ├── register/               # Rider registration
│   │   │   ├── login/                  # Rider login
│   │   │   └── dashboard/              # Rider dashboard
│   │   ├── admin/
│   │   │   ├── login/                  # Admin login
│   │   │   └── dashboard/              # Admin panel
│   │   └── api/
│   │       ├── emergencies/            # Emergency creation API
│   │       ├── assignments/[id]/       # Mission accept/complete API
│   │       └── riders/[id]/            # Rider management API
│   ├── components/ui/
│   │   ├── Logo.tsx
│   │   ├── Navbar.tsx
│   │   └── StatusBadge.tsx
│   ├── lib/
│   │   ├── supabase/                   # Supabase client/server/middleware
│   │   └── formatDate.ts               # Consistent date formatting
│   └── types/
│       └── database.ts                 # Full TypeScript DB types
├── supabase/
│   └── schema.sql                      # Complete DB schema + RLS policies
├── scripts/
│   └── setup.mjs                       # Auto-create admin + rider accounts
└── .env.local.example                  # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/nikhil-yanadi/Rescue_Rider.git
cd Rescue_Rider
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```
Fill in your Supabase credentials from **Supabase Dashboard → Settings → API**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set up the database
Run `supabase/schema.sql` in your **Supabase SQL Editor** — creates all tables, RLS policies, and indexes.

### 4. Enable Realtime
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### 5. Create sample accounts
```bash
node scripts/setup.mjs
```
This creates:
| Role | Email | Password |
|------|-------|----------|
| Rider | rider@rescuerider.com | Rider123 |
| Admin | admin@rescuerider.com | Admin123 |

### 6. Run the app
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `riders` | Rider profiles and verification status |
| `emergencies` | Emergency records with GPS coordinates |
| `emergency_media` | Photos and voice notes uploaded by victims |
| `emergency_assignments` | Links emergencies to notified/accepted riders |
| `reviews` | Victim feedback and star ratings |
| `hero_points` | Points ledger for rider rewards |
| `notifications` | In-app notifications for riders |
| `admin_users` | Admin account records |

Row Level Security (RLS) is enabled on all tables.

---

## 🔄 Emergency Flow

```
Victim taps SAVE ME
       ↓
GPS captured → Emergency created → Unique ID generated
       ↓
All verified + available riders notified via Supabase Realtime
       ↓
First rider to ACCEPT gets the mission
       ↓
Other riders see "Mission Already Accepted"
       ↓
Rider navigates to victim (Google Maps + countdown timer)
       ↓
Rider marks: Arrived → In Progress → Completed
       ↓
Victim rates the rider (1-5 stars + feedback)
       ↓
Hero Points awarded to rider
```

---

## 🌐 Deployment

Deployed on **Vercel** — connect your GitHub repo, set the two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and deploy.

After deployment, update Supabase:
**Authentication → URL Configuration → Site URL** → add your Vercel URL.

---

## 📸 Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with SAVE ME button |
| `/save-me` | Emergency request flow |
| `/rider/register` | Rider registration |
| `/rider/login` | Rider login |
| `/rider/dashboard` | Rider dashboard (protected) |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Admin panel (protected) |

---

## 👨‍💻 Author

Built as a final year B.Tech project.

**Nikhil Yanadi**
- GitHub: [@nikhil-yanadi](https://github.com/nikhil-yanadi)

---

## 📄 License

This project is for educational purposes.

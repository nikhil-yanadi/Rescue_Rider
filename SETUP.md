# Rescue Rider — Setup Guide

## Prerequisites
- Node.js 18+
- A Supabase account (free tier works)

---

## Step 1: Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **Anon Key** from Settings → API
3. Create `.env.local` from `.env.local.example` and fill in both values

---

## Step 2: Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Paste the contents of `supabase/schema.sql` and run it
3. This creates all tables, RLS policies, and indexes

---

## Step 3: Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**, name it `emergency-media`
3. Set it to **Public** bucket

---

## Step 4: Create Admin User

1. Go to **Authentication → Users** in Supabase
2. Click **Invite User** or create a user manually
3. Copy the generated `user_id` (UUID)
4. Run this SQL in the SQL editor:

```sql
INSERT INTO public.admin_users (user_id, email, full_name)
VALUES ('<paste-uuid-here>', 'admin@yourdomain.com', 'Your Name');
```

---

## Step 5: Enable Realtime

1. In Supabase dashboard, go to **Database → Replication**
2. Enable replication for these tables:
   - `emergency_assignments`
   - `emergencies`
   - `notifications`

---

## Step 6: Run the App

```bash
cd rescue-rider-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Homepage with SAVE ME button |
| `/save-me` | Emergency request flow |
| `/rider/register` | Rider registration |
| `/rider/login` | Rider login |
| `/rider/dashboard` | Rider dashboard (protected) |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Admin panel (protected) |

---

## How the Emergency Flow Works

1. Victim clicks **SAVE ME** → browser captures GPS
2. Victim optionally adds description, photo, voice note
3. Emergency record is created with a unique ID (`RR-XXXX-YYYY`)
4. All verified + available riders get an assignment record (Realtime push)
5. First rider to accept gets the mission; others see "Mission Taken"
6. Rider navigates to victim, marks **Arrived** → **Completed**
7. Hero Points awarded automatically

---

## Tech Stack

- **Next.js 14** App Router
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth, Postgres, Storage, Realtime)
- Deploy to **Vercel** — connect your GitHub repo and set env vars

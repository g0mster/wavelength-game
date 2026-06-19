# Deploy Wavelength: Person Edition

## Step 1 — Supabase (free, ~3 min)

1. Go to https://supabase.com and sign up / log in
2. Click **New Project** → name it `wavelength-game` → set a DB password → pick a region
3. Wait ~1 min for project to spin up
4. Go to **SQL Editor** → paste + run `supabase-schema.sql`
5. Then paste + run `supabase-rpc.sql`
6. Go to **Project Settings → API**:
   - Copy **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon / public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role / secret key** → this is your `SUPABASE_SERVICE_ROLE_KEY`

## Step 2 — Push to GitHub

1. Create a new repo on https://github.com (name it `wavelength-game`)
2. In this folder, run:
   ```
   git init
   git add .
   git commit -m "initial"
   git remote add origin https://github.com/YOUR_USERNAME/wavelength-game.git
   git push -u origin main
   ```

## Step 3 — Deploy on Vercel (free, ~2 min)

1. Go to https://vercel.com → **New Project** → Import your GitHub repo
2. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = (from step 1)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (from step 1)
   SUPABASE_SERVICE_ROLE_KEY     = (from step 1)
   ```
3. Click **Deploy**
4. Vercel will build and give you a URL like `wavelength-game.vercel.app`

## Done! Share the link with your friends.

---

## Scoring guide
| Distance from bullseye | Points |
|---|---|
| ≤ 8% | 🎯 4 pts (Bullseye!) |
| ≤ 16% | ✨ 3 pts (Close) |
| ≤ 25% | 👍 2 pts (Near) |
| > 25% | 0 pts |

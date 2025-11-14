# EcoBites - Sustainable Food Tracker

A full-stack Next.js application for tracking the sustainability and nutrition of food products using the OpenFoodFacts API.

## Features

- 🔍 Search for food products by name or barcode
- 📊 View detailed nutrition information with interactive charts
- 🌱 Check sustainability scores (Nutri-Score and Eco-Score)
- 📦 See packaging information and additives
- 📈 Track search history in Supabase database
- 📱 Mobile-first responsive design

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Validation**: Zod
- **API**: OpenFoodFacts

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd eco-bites
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:

   **Step 1: Create a Supabase Account and Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project" or "Sign in" if you already have an account
   - Click "New Project"
   - Fill in the project details:
     - **Name**: Choose a name (e.g., "eco-bites")
     - **Database Password**: Create a strong password (save it securely)
     - **Region**: Choose the closest region to you
   - Click "Create new project"
   - Wait 1-2 minutes for the project to be set up

   **Step 2: Get Your API Credentials**
   - Once your project is ready, go to **Settings** (gear icon in the left sidebar)
   - Click on **API** in the settings menu
   - You'll see two important values:
     - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
     - **anon/public key** (a long string starting with `eyJ...`)
   - Copy both of these values - you'll need them in the next step

   **Step 3: Run the Database Migration**
   - In your Supabase dashboard, go to **SQL Editor** (in the left sidebar)
   - Click **New query**
   - Open the file `supabase/migrations/001_initial_schema.sql` from this project
   - Copy the entire contents of that file
   - Paste it into the SQL Editor in Supabase
   - Click **Run** (or press Ctrl/Cmd + Enter)
   - You should see a success message confirming the tables were created
   - Verify by going to **Table Editor** - you should see `users` and `search_history` tables

4. Create environment variables:
   - In the root directory of your project, create a file named `.env.local`
   - Add your Supabase credentials (replace with your actual values):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTk2ODgwMCwiZXhwIjoxOTU3NTQ0ODAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
   - **Important**: 
     - Replace `https://xxxxxxxxxxxxx.supabase.co` with your actual Project URL
     - Replace the long `eyJ...` string with your actual anon/public key
     - Never commit `.env.local` to git (it's already in `.gitignore`)
     - The `.env.local` file should be in the same directory as `package.json`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Quick Reference: Environment Variables

Your `.env.local` file should look exactly like this (with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTk2ODgwMCwiZXhwIjoxOTU3NTQ0ODAwfQ.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Where to find these values:**
1. **Project URL**: Settings → API → Project URL
2. **Anon Key**: Settings → API → Project API keys → `anon` `public` key

**Note**: The app will work without Supabase (search and product viewing), but the search history feature requires Supabase to be configured.

## Project Structure

```
src/
  app/
    api/
      search/route.js          # Search API endpoint
      product/[id]/route.js    # Product details API endpoint
      history/route.js         # Search history API endpoint
    product/[id]/page.js       # Product details page
    page.js                    # Home page
    layout.js                  # Root layout
  components/
    SearchBar.jsx              # Search input component
    ProductCard.jsx            # Product preview card
    NutritionChart.jsx         # Nutrition visualization
    SustainabilityBadge.jsx    # Score badges
    LoadingSkeleton.jsx        # Loading state
    ErrorState.jsx             # Error display
  lib/
    openfoodfacts.js          # OpenFoodFacts API integration
    supabase.js               # Supabase client
    validators.js             # Zod validation schemas
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (TEXT, Unique)
- `created_at` (Timestamp)

### Search History Table
- `id` (UUID, Primary Key)
- `query` (TEXT)
- `product_id` (TEXT, Optional)
- `user_id` (UUID, Foreign Key to users)
- `created_at` (Timestamp)

## API Endpoints

### GET /api/search?query={query}
Search for products by name or barcode.

### GET /api/product/[id]
Get full product details by ID.

### GET /api/history?userId={userId}&limit={limit}
Fetch search history.

### POST /api/history
Save a search to history.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## License

MIT

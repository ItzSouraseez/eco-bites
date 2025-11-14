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

   **Step 3: Enable Authentication**
   - In your Supabase dashboard, go to **Authentication** (in the left sidebar)
   - Click on **Providers** in the Authentication section
   - Enable **Email** provider (it should be enabled by default)
   - Optionally configure email templates if needed
   - Authentication is now ready to use!

   **Step 4: Run the Database Migration**
   - In your Supabase dashboard, go to **SQL Editor** (in the left sidebar)
   - Click **New query**
   - Open the file `supabase/migrations/001_initial_schema.sql` from this project
   - Copy the entire contents of that file
   - Paste it into the SQL Editor in Supabase
   - Click **Run** (or press Ctrl/Cmd + Enter)
   - You should see a success message confirming the tables were created
   - Verify by going to **Table Editor** - you should see `search_history` table
   - Note: The `users` table is automatically managed by Supabase Auth

5. Set up OpenFoodFacts API (Optional but Recommended):

   **Getting an OpenFoodFacts API Key:**
   - Go to [OpenFoodFacts.org](https://world.openfoodfacts.org/)
   - Click "Sign in" or "Create account" (top right)
   - After logging in, go to your [user settings](https://world.openfoodfacts.org/cgi/user.pl)
   - Look for "API Key" or "Developer" section
   - Request an API key (it's free and helps with rate limits)
   - Copy your API key

   **Note**: The API works without a key, but having one:
   - Increases rate limits
   - Helps track usage
   - Provides better reliability

6. Create environment variables:
   - In the root directory of your project, create a file named `.env.local`
   - Add your credentials (replace with your actual values):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTk2ODgwMCwiZXhwIjoxOTU3NTQ0ODAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenFoodFacts API Key (Optional but recommended)
OPENFOODFACTS_API_KEY=your_api_key_here
```
   - **Important**: 
     - Replace `https://xxxxxxxxxxxxx.supabase.co` with your actual Supabase Project URL
     - Replace the long `eyJ...` string with your actual Supabase anon/public key
     - Replace `your_api_key_here` with your OpenFoodFacts API key (or leave it out if you don't have one)
     - Never commit `.env.local` to git (it's already in `.gitignore`)
     - The `.env.local` file should be in the same directory as `package.json`

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication

EcoBites includes user authentication powered by Supabase Auth:

- **Sign Up**: Create a new account at `/auth/signup`
- **Sign In**: Log in to your account at `/auth/signin`
- **User Menu**: Click on your profile icon in the top right to access your account
- **Search History**: When logged in, your search history is automatically saved and linked to your account

### Features:
- Email/password authentication
- Secure session management
- User-specific search history
- Automatic token management

### Quick Reference: Environment Variables

Your `.env.local` file should look exactly like this (with your actual values):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTk2ODgwMCwiZXhwIjoxOTU3NTQ0ODAwfQ.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# OpenFoodFacts API Key (Optional)
OPENFOODFACTS_API_KEY=your_api_key_here
```

**Where to find these values:**
1. **Project URL**: Settings → API → Project URL
2. **Anon Key**: Settings → API → Project API keys → `anon` `public` key

**Note**: 
- The app will work without Supabase (search and product viewing), but the search history feature requires Supabase to be configured.
- The app will work without an OpenFoodFacts API key, but having one improves rate limits and reliability.

## API Request Optimization

The app includes several optimizations to reduce API calls:

- **Caching**: Search results and product details are cached for 5 minutes
- **Request Deduplication**: Prevents multiple identical requests from running simultaneously
- **Debouncing**: Search input is debounced by 800ms to reduce rapid-fire requests
- **Error Handling**: Proper handling of rate limit errors (429 status)

These optimizations significantly reduce the number of API calls while maintaining a smooth user experience.

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

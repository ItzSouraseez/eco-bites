# EcoBites - Camera Food Scanner

A Next.js application that uses your camera to scan food products and get instant nutrition information powered by Google Gemini AI.

## Features

- 📸 **Camera/Image Search**: Upload or capture food product images
- 🤖 **AI-Powered Analysis**: Uses Google Gemini to detect food products and extract nutrition data
- 🔐 **Google Sign-In**: Firebase Authentication with Google
- 💾 **Personal Database**: Save your scans to Firebase Firestore
- 📊 **Nutrition Visualization**: Interactive charts and detailed nutrition facts
- 🌱 **Sustainability Scores**: Nutri-Score and Eco-Score ratings

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google Sign-In)
- **AI**: Google Gemini API
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase account
- A Google Cloud account (for Gemini API)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable **Google** sign-in provider
   - Add your domain to authorized domains
4. Create a **Firestore Database**:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)
5. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" section
   - Copy your Firebase configuration

### 3. Set up Google Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key or use an existing one
5. Copy your API key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API Key (server-side only)
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Set up Firestore Security Rules

Go to Firestore Database → Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own scans
    match /scans/{scanId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  app/
    api/
      analyze/
        route.js          # Gemini API endpoint
    page.js               # Main camera scanner page
    layout.js             # Root layout with AuthProvider
  components/
    CameraCapture.jsx     # Camera component
    ImageUpload.jsx        # Image upload component
    NutritionDisplay.jsx  # Nutrition charts and facts
    ScoreBadge.jsx        # Nutri/Eco score badges
    UserMenu.jsx          # User authentication menu
  contexts/
    AuthContext.jsx       # Firebase Auth context
  lib/
    firebase.js           # Firebase configuration
    gemini.js             # Gemini utilities (legacy)
```

## Database Schema

### Firestore Collection: `scans`

```javascript
{
  userId: string,           // Firebase Auth UID
  productName: string,       // Product name from Gemini
  brand: string,             // Brand name
  nutrition: {               // Nutrition data per 100g
    energy: number,
    fat: number,
    sugars: number,
    salt: number,
    protein: number,
    fiber: number,
    sodium: number
  },
  nutriScore: string,       // A, B, C, D, or E
  ecoScore: string,          // A, B, C, D, or E
  imageUrl: string,          // Base64 image preview
  timestamp: Timestamp      // Server timestamp
}
```

## Usage

1. **Sign In**: Click "Sign in with Google" to authenticate
2. **Upload/Capture**: Upload an image or use your camera to capture a food product
3. **Analyze**: Click "Analyze Nutrition" to get instant nutrition information
4. **View Results**: See detailed nutrition facts, scores, ingredients, and more
5. **Save**: Your scans are automatically saved to Firestore (if signed in)

## API Endpoints

### POST /api/analyze

Analyzes a food product image using Gemini AI.

**Request:**
- Method: POST
- Body: FormData with `image` field (image file)

**Response:**
```json
{
  "data": {
    "name": "Product Name",
    "brand": "Brand Name",
    "nutrition": { ... },
    "nutriScore": "A",
    "ecoScore": "B",
    ...
  }
}
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

1. Deploy to [Vercel](https://vercel.com) (recommended for Next.js)
2. Add environment variables in Vercel dashboard
3. Update Firebase authorized domains with your production URL
4. Update Firestore security rules if needed

## License

MIT

# Klypp.ai Android App

React Native / Expo app for Klypp.ai — AI carousel generator.

## Setup

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android (requires Android Studio + emulator OR physical device)
npx expo start --android
```

## Project Structure

```
app/
├── (auth)/
│   ├── login.tsx       Login screen
│   ├── signup.tsx      Signup screen
│   └── forgot.tsx      Password reset
└── (tabs)/
    ├── dashboard.tsx   Home — stats, recent carousels, platforms
    ├── generator.tsx   Create carousels — browse topics, generate, post
    ├── history.tsx     Carousel history
    └── settings.tsx    Account, plan, connected platforms

src/
├── services/api.ts     All API calls to klypp.ai backend
├── hooks/useAuth.ts    JWT auth with AsyncStorage
└── constants/theme.ts  Colors, fonts, spacing
```

## Backend
All data lives on the existing Klypp.ai Netlify backend at `https://klypp.ai`.
No new backend needed — the app calls the same functions as the website.

## Building for Play Store

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build APK (for testing)
eas build --platform android --profile preview

# Build AAB (for Play Store)
eas build --platform android --profile production
```

## Environment
- Backend: `https://klypp.ai/.netlify/functions`
- Android package: `ai.klypp.app`
- Min SDK: 24 (Android 7.0)

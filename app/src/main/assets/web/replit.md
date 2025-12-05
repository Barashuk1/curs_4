# Podcast Pro - TypeScript/React Web Application

## Overview
Podcast Pro is a full-featured podcast streaming web application built with **TypeScript** and **React**. It provides social podcast streaming with AI-powered descriptions via Gemini API.

## Technology Stack
- **Language**: TypeScript
- **UI Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: Lucide React
- **AI Integration**: Google Gemini API
- **Data Storage**: Browser LocalStorage

## Project Structure
```
/
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── index.html                # HTML entry point
├── src/
│   ├── index.tsx             # React entry point
│   ├── App.tsx               # Main App component with all pages
│   ├── types.ts              # TypeScript interfaces
│   ├── services/
│   │   ├── db.ts             # LocalStorage database service
│   │   └── geminiService.ts  # Gemini AI API integration
│   └── components/
│       └── Layout.tsx        # App layout with navigation
└── attached_assets/          # Original source files
```

## Features
1. **Authentication**: Login/Register with admin access (admin/admin)
2. **Podcast Browsing**: Search and filter podcasts, discover users
3. **Video Playback**: YouTube embeds and direct video URLs
4. **Social Features**: Likes, comments, saves, follows
5. **AI Description Generation**: Gemini API integration
6. **Notifications**: Real-time notification system
7. **User Profiles**: View profiles and follow users
8. **Admin Panel**: Content and user management
9. **Downloads**: Offline podcast saving (simulated)

## Build & Run Commands
```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key for AI description generation

## Architecture Decisions
- Single-page application with client-side routing via state
- LocalStorage for data persistence (no backend required)
- Tailwind CSS via CDN for quick styling
- All components in single App.tsx for simplicity

## User Preferences
- Dark theme with indigo/purple gradients
- Mobile-first responsive design
- Ukrainian language for user communication

## Recent Changes
- Dec 2024: Migrated from Kotlin/JS to TypeScript (Kotlin wrappers had compatibility issues)
- Full-featured podcast app with social interactions
- AI-powered description generation via Gemini

## Admin Access
- Email: `admin`
- Password: `admin`

## Notes
Originally planned for Kotlin/JS but switched to TypeScript due to kotlin-react-wrappers compatibility issues with CSS properties and types.

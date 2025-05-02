# Modern IPTV/OTT Platform

A modern IPTV/OTT (Over-The-Top) platform built with Next.js, TypeScript, and Tailwind CSS. This application provides a Netflix-like interface for streaming live TV channels, movies, and series.

## Features

- **Modern UI**: Netflix-style interface with smooth animations and transitions
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **High Performance**: Virtual scrolling, lazy loading, and code splitting for optimal performance
- **Xtream Codes Integration**: Support for IPTV service providers using Xtream Codes API
- **TMDB Integration**: Enhanced content details using The Movie Database API
- **Live TV**: Watch live TV channels with EPG (Electronic Program Guide) support
- **VOD Content**: Browse and watch movies and series with detailed information
- **User Preferences**: Theme switching, language selection, and playback settings
- **Parental Controls**: PIN protection for age-restricted content and categories
- **Favorites & History**: Track watched content and save favorites for quick access

## Tech Stack

- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (based on Radix UI)
- **State Management**: Zustand
- **Video Playback**: HLS.js
- **API Integration**: Axios, React Query
- **Form Handling**: React Hook Form, Zod
- **Animations**: Framer Motion

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication

The platform supports authentication with Xtream Codes panels. Users can log in with:
- Server URL/DNS
- Username
- Password

## License

This project is licensed under the MIT License.

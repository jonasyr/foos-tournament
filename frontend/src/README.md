# FoosMaster - Foosball Tournament Management System

A modern, mobile-first web application for managing foosball tournaments with dark mode support. Built with React, TypeScript, Tailwind CSS, and Motion (Framer Motion).

## Features

### 🎯 Core Functionality
- **Dashboard** - Overview of recent matches, leaderboards, and season information
- **Quick Match Creator** - Step-by-step wizard for creating singles or doubles matches
- **Division Management** - View standings, matches (Pending/Playing/Finished), and player stats
- **Player Profiles** - Detailed statistics with ELO progression charts and performance radar
- **Statistics Hub** - Global leaderboards, hot streaks, and partnership analytics
- **Match Simulator** - Real-time scoring interface with live classification preview

### 🎨 Design System

#### Color Palette
- **Primary**: Electric Blue (#3B82F6)
- **Secondary**: Emerald Green (#10B981)
- **Accent**: Amber (#F59E0B)
- **Neutrals**: Slate grays

#### Typography
- Geometric sans-serif fonts (Inter/Poppins style)
- System fonts for body text
- Clear hierarchy with h1-h4 headings

#### Spacing & Layout
- 8px base unit system
- Generous whitespace
- Responsive grid layouts (1-4 columns)

#### Components
- 8-12px border radius
- Soft shadows (10-20px blur)
- Glass morphism effects
- Smooth micro-interactions

### 📱 Responsive Design
- **Mobile**: Single column, bottom navigation, swipeable tabs, FAB
- **Tablet**: 2-column grid, side drawer navigation
- **Desktop**: 3-4 column grid, persistent sidebar, hover states

### 🌓 Dark Mode
- Full dark mode support with system preference detection
- Smooth transitions between themes
- Optimized contrast for accessibility (WCAG AA compliant)

### ✨ Micro-Interactions
- Hover effects with scale and brightness
- Ripple effects on button clicks
- Slide/fade page transitions (300ms)
- Pulse/glow on data updates
- Smooth skeleton loaders

## Component Library

The app includes a comprehensive component library showcasing:
- Color palette and team colors
- Button variants (default, secondary, outline, ghost, destructive)
- Badge variations with icons
- Card styles (basic, gradient, interactive, glass)
- Form elements (inputs, sliders, switches, progress bars)
- Icon library (sport and status icons)
- Avatars and skeleton loaders

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first styling
- **Motion (Framer Motion)** - Animations
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Shadcn/ui** - Component primitives
- **Sonner** - Toast notifications

## Project Structure

```
├── components/
│   ├── Dashboard.tsx
│   ├── QuickMatchCreator.tsx
│   ├── DivisionView.tsx
│   ├── PlayerProfile.tsx
│   ├── StatsHub.tsx
│   ├── MatchSimulator.tsx
│   ├── ComponentLibrary.tsx
│   ├── Navigation.tsx
│   ├── FAB.tsx
│   ├── MatchCard.tsx
│   ├── PlayerCard.tsx
│   └── ui/ (shadcn components)
├── lib/
│   └── mockData.ts
├── styles/
│   └── globals.css
└── App.tsx
```

## Key Features by Screen

### Dashboard
- Season hero section with trophy icon
- Filter chips (All/League/Quick)
- 3-column match card grid (responsive)
- Sidebar mini-leaderboard (top 5)
- Floating Action Button (FAB) for quick match creation

### Quick Match Creator
- Step 1: Mode selection (Singles/Doubles with visual cards)
- Step 2: Player selection with team color coding
- Step 3: Match settings (target score slider, best of 3 toggle)
- Progress indicator dots
- Back/Next navigation

### Division View
- Sticky header with division info and level badge
- Three tabs: Standings, Matches, Players
- Kanban-style match columns (Pending/Playing/Finished)
- Sortable player cards with position indicators

### Player Profile
- Hero section with avatar and ELO rating
- 4-stat grid: Win Rate (circular progress), Games Played, Current Streak (with fire emoji), Goal Differential
- ELO progression line chart with gradient fill
- Performance radar chart vs average
- Recent match history timeline

### Stats Hub
- Advanced filter bar (search, time range, match type)
- Hot streaks widget with animated fire icons
- Sortable global leaderboard
- Partnership chemistry matrix
- Medal icons for top 3 players

### Match Simulator
- Split layout: Score input (40%) | Classification preview (60%)
- Large increment/decrement buttons with ripple effects
- Quick win shortcuts
- Live standings preview with smooth animations
- Position change indicators (up/down arrows)
- Impact analysis panel

## Accessibility

- High contrast text (WCAG AA compliant)
- Focus indicators on all interactive elements
- Proper heading hierarchy
- Icon labels for screen readers
- Keyboard navigation support

## Mock Data

The application uses realistic mock data including:
- 8 players with ELO ratings, win/loss records
- 6 recent matches with timestamps and durations
- 2 divisions with rounds
- ELO history over 10 weeks
- Radar chart performance metrics
- Match history with results

## Future Enhancements

- Real-time match updates
- User authentication
- Tournament brackets
- Advanced statistics and analytics
- Push notifications
- Social features (comments, reactions)
- Photo uploads for players
- Match replays
- Achievement system

# Foosball Tournament System - Complete Setup Guide

This guide documents the exact steps needed to get the entire foosball tournament system running from scratch. This includes the Sinatra backend API and the React TypeScript frontend.

## Prerequisites

- Ruby 3.3.6+ with rbenv
- Node.js 18+ and npm
- SQLite development libraries
- Build tools (gcc, make)

## System Components

1. **Backend**: Sinatra (Ruby) REST API on port 4567
2. **Frontend**: React 18 + TypeScript + Vite on port 3000 (dev)
3. **Database**: SQLite with DataMapper ORM
4. **Architecture**: Full-stack SPA with API integration

---

## Part 1: Backend Setup

### Step 1: Install System Dependencies

```bash
# On Debian/Ubuntu
sudo apt-get install ruby ruby-dev sqlite3 libsqlite3-dev build-essential git

# On macOS
brew install ruby sqlite3
```

### Step 2: Configure Bundler

The project requires Bundler 2.7.2+ for Ruby 3.3 compatibility:

```bash
gem install bundler
gem list bundler  # Should show 2.7.2 or higher
```

**CRITICAL**: Old bundler versions (1.14.x) will fail with `undefined method 'untaint'` errors on Ruby 3.3+

### Step 3: Install Ruby Gems

From the project root:

```bash
bundle install
```

**Expected gems**:
- sinatra
- sinatra-contrib
- data_mapper
- dm-sqlite-adapter
- sqlite3
- json (~> 1.8.6) - Required for DataMapper compatibility
- rackup
- puma

**Common Issues**:

1. **json gem version conflict**: DataMapper requires json 1.8.6, but Ruby 3.3 defaults to json 2.7.2
   - Solution: Gemfile pins `json ~> 1.8.6` and Bundler manages this automatically

2. **Missing rackup/puma**: Sinatra 4+ requires these separately
   - Solution: Added to Gemfile

### Step 4: Configure Backend

Create `config.yaml` from the sample:

```bash
cp config.yaml.sample config.yaml
```

Edit `config.yaml`:

```yaml
db_uri: "sqlite:///home/user/foos-tournament/foos.db"  # Use absolute path!
api_keys:
  - "change-me-supersecret"  # Must match frontend VITE_API_KEY
bind_host: "0.0.0.0"  # Allow network access
bind_port: 4567
hooks:
  match_played: []
  match_cancelled: []
```

**CRITICAL**:
- `db_uri` MUST use absolute path with three slashes: `sqlite:///absolute/path/to/db`
- `api_keys` must match the frontend's `VITE_API_KEY` environment variable

### Step 5: Initialize Database

```bash
cd dm
ruby upgrade_model.rb
cd ..
```

This creates the database schema. Expected tables:
- seasons
- divisions
- players
- divisionplayers
- matches
- goal_events
- roundplayers

### Step 6: Populate Test Data

Run the provided test data script:

```bash
bundle exec ruby create_test_data.rb
```

This creates:
- 1 season ("Fall Championship 2025")
- 12 players with varied statistics
- 1 division ("Premier Division")
- 3 open matches
- 4 played matches with scores
- 2 quick matches

Verify data:

```bash
bundle exec ruby -e "
require './conf'
require './dm/data_model'
include DataModel
puts 'Players: ' + Player.count.to_s
puts 'Seasons: ' + Season.count.to_s
puts 'Divisions: ' + Division.count.to_s
"
```

### Step 7: Start Backend Server

```bash
bundle exec ruby web_router.rb
```

Expected output:
```
== Sinatra (v4.2.1) has taken the stage on 4567 for development with backup from Puma
Puma starting in single mode...
* Listening on http://0.0.0.0:4567
```

Verify backend is running:

```bash
curl http://localhost:4567/api/health
# Expected: {"ok":true,"season_count":1,"player_count":12,...}
```

**Backend is now running on port 4567**

---

## Part 2: Frontend Setup

### Step 1: Install Node Dependencies

```bash
cd frontend
npm install
```

Expected packages include:
- react, react-dom
- typescript
- vite
- axios (for API calls)
- radix-ui components
- tailwindcss
- framer-motion

### Step 2: Configure Environment Variables

The project includes two environment files:

**.env.development** (for local development):
```env
VITE_API_URL=
VITE_API_KEY=change-me-supersecret
```

**.env.production** (for production deployment):
```env
VITE_API_URL=http://192.168.178.165:4567
VITE_API_KEY=change-me-supersecret
```

**How it works**:
- In development: `VITE_API_URL` is empty, so Vite proxy forwards `/api/*` to `localhost:4567`
- In production: `VITE_API_URL` is the full backend URL (for deployment to different servers)
- `VITE_API_KEY` must match the backend's `config.yaml` api_keys

### Step 3: Verify Vite Configuration

The `vite.config.ts` includes proxy configuration for development:

```typescript
server: {
  port: 3000,
  open: true,
  proxy: {
    '/api': {
      target: 'http://localhost:4567',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

This allows the frontend (port 3000) to call `/api/*` which gets proxied to `http://localhost:4567/api/*`, avoiding CORS issues.

### Step 4: Start Frontend Dev Server

```bash
npm run dev
```

Expected output:
```
VITE v6.3.5  ready in 349 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Frontend is now running on port 3000**

---

## Part 3: Verification

### Verify Full Stack Integration

1. **Backend Health Check**:
   ```bash
   curl http://localhost:4567/api/health
   ```
   Should return: `{"ok":true,"season_count":1,"player_count":12,...}`

2. **Backend Stats API**:
   ```bash
   curl -H "X-API-KEY: change-me-supersecret" \
        http://localhost:4567/api/stats/leaderboard?scope=all
   ```
   Should return JSON array of 12 players with ELO scores

3. **Frontend Serving**:
   ```bash
   curl -s http://localhost:3000/ | grep "Foosball"
   ```
   Should return HTML with title "Foosball Tournament Management App"

4. **Frontend Proxy**:
   Open browser to `http://localhost:3000/`
   - Stats Hub page should display 12 players in leaderboard
   - Dashboard should show open matches
   - Top players sidebar should display real data
   - No console errors about failed API calls

### Expected User Interface

When you open `http://localhost:3000/` you should see:

1. **Navigation**: Dashboard / Stats Hub tabs
2. **Dashboard** tab:
   - Hero section: "Fall Championship 2025"
   - Filter chips: All Matches / League / Quick
   - Match cards showing open matches
   - Top Players sidebar with rankings
3. **Stats Hub** tab:
   - Global Leaderboard with all 12 players
   - Player avatars (initials)
   - Win rates, games played, ELO scores
   - Search and filter functionality

### Common Issues

1. **"Failed to load dashboard" error**:
   - Check backend is running on port 4567
   - Check `frontend/.env.development` has correct `VITE_API_KEY`
   - Check network tab for 403 Forbidden (API key mismatch)

2. **Empty leaderboard**:
   - Verify test data was created: `curl http://localhost:4567/api/health`
   - Check backend logs for errors
   - Verify database file exists: `ls -lh foos.db`

3. **CORS errors**:
   - Verify Vite proxy is configured in `vite.config.ts`
   - Restart frontend dev server

---

## Part 4: Development Workflow

### Running Both Servers

**Terminal 1 - Backend**:
```bash
cd /home/user/foos-tournament
bundle exec ruby web_router.rb
```

**Terminal 2 - Frontend**:
```bash
cd /home/user/foos-tournament/frontend
npm run dev
```

### Making API Changes

When modifying backend endpoints:
1. Update Ruby route in `web_router.rb`
2. Update TypeScript types in `frontend/src/lib/types.ts`
3. Update API client in `frontend/src/lib/api.ts`
4. Update React components to use new data

### Building for Production

```bash
cd frontend
npm run build
```

This creates `frontend/dist/` which can be served by Sinatra:

```ruby
# In web_router.rb
set :public_folder, File.join(File.dirname(__FILE__), 'frontend/dist')

get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end
```

---

## Architecture Overview

### API Layer (`frontend/src/lib/api.ts`)

Axios client with:
- Automatic API key injection via request interceptor
- Error handling via response interceptor
- Organized by domain: `statsApi`, `matchApi`, `playerApi`, `seasonApi`
- TypeScript types for all requests/responses

### Type Safety (`frontend/src/lib/types.ts`)

All backend responses have TypeScript interfaces:
- `LeaderboardEntry`, `PlayerStats`, `H2HStats`
- `OpenMatch`, `Match`, `Division`, `Season`
- `QuickMatchPayload`, `MatchResultPayload`

### Component Integration

**StatsHub.tsx**:
- Fetches: `statsApi.leaderboard(scope, limit)`
- Displays: Global leaderboard with search/filter
- Loading states, error handling

**Dashboard.tsx**:
- Fetches: `playerApi.getAllPlayers()`, `statsApi.leaderboard()`, `matchApi.getOpenMatches()`
- Displays: Open matches, top players sidebar
- Parallel data loading with `Promise.all()`

**MatchSimulator.tsx**:
- Submits: `matchApi.setResult(payload)`
- Handles: Match scoring and result submission

---

## Troubleshooting

### Backend Won't Start

1. **json gem conflict**:
   ```
   Error: Unable to activate dm-serializer-1.2.2, because json-2.7.2 conflicts with json (~> 1.6)
   ```
   Solution: Delete `Gemfile.lock` and run `bundle install` again

2. **Bundler untaint error**:
   ```
   Error: undefined method 'untaint' for an instance of String
   ```
   Solution: Update bundler: `gem install bundler` (requires 2.7.2+)

3. **Missing rackup/puma**:
   ```
   Error: Sinatra could not start, the required gems weren't found!
   ```
   Solution: Add to Gemfile: `gem 'rackup'` and `gem 'puma'`

### Frontend Won't Start

1. **Module not found: axios**:
   ```
   Error: Cannot find module 'axios'
   ```
   Solution: `cd frontend && npm install axios`

2. **Port 3000 in use**:
   ```
   Error: Port 3000 is already in use
   ```
   Solution: Change port in `vite.config.ts` or kill existing process

### API Integration Issues

1. **403 Forbidden on stats API**:
   - Verify `VITE_API_KEY` in `.env.development` matches `config.yaml` api_keys
   - Check browser console for "X-API-KEY" header

2. **Network error / ECONNREFUSED**:
   - Verify backend is running: `curl http://localhost:4567/api/health`
   - Check Vite proxy config in `vite.config.ts`

3. **Empty data despite backend having records**:
   - Check browser Network tab for actual API responses
   - Verify data transformation in `Dashboard.tsx` `transformMatch()` function

---

## Quick Start Summary

For someone who just cloned the repository:

```bash
# Backend
cd /path/to/foos-tournament
gem install bundler  # Ensure 2.7.2+
bundle install
cp config.yaml.sample config.yaml
# Edit config.yaml with absolute path for db_uri
cd dm && ruby upgrade_model.rb && cd ..
bundle exec ruby create_test_data.rb
bundle exec ruby web_router.rb &

# Frontend
cd frontend
npm install
# Verify .env.development exists with VITE_API_KEY
npm run dev &

# Verify
curl http://localhost:4567/api/health
open http://localhost:3000/
```

System should be fully operational with:
- Backend API on http://localhost:4567
- Frontend UI on http://localhost:3000
- 12 players in database with test data
- Real-time stats and match tracking

---

## Production Deployment Notes

For deployment to Raspberry Pi or production server:

1. **Update API URLs**:
   - Edit `frontend/.env.production` with actual backend URL
   - Build frontend: `npm run build`

2. **Serve frontend from Sinatra**:
   - Copy `frontend/dist/*` to `public/` directory
   - Configure Sinatra to serve static files

3. **Run as daemon**:
   - Use systemd service or screen/tmux
   - Example: `bundle exec puma -C config/puma.rb -d`

4. **Security**:
   - Change API keys in `config.yaml`
   - Use HTTPS in production
   - Consider enabling additional Rack::Protection features

---

## File Reference

**Backend**:
- `web_router.rb` - Main Sinatra application
- `conf.rb` - Configuration loader
- `config.yaml` - Runtime configuration (database, API keys, hooks)
- `dm/data_model.rb` - DataMapper ORM models
- `create_test_data.rb` - Test data generation script
- `Gemfile` - Ruby dependencies

**Frontend**:
- `frontend/src/App.tsx` - Root React component
- `frontend/src/components/Dashboard.tsx` - Main dashboard view
- `frontend/src/components/StatsHub.tsx` - Statistics and leaderboard
- `frontend/src/lib/api.ts` - API client layer
- `frontend/src/lib/types.ts` - TypeScript type definitions
- `frontend/.env.development` - Development environment config
- `frontend/vite.config.ts` - Vite build and dev server config
- `frontend/package.json` - Node dependencies

**Database**:
- `foos.db` - SQLite database file (created by upgrade_model.rb)

---

## Support

For issues with:
- **DataMapper/Ruby compatibility**: See AGENTS.md section 6 (Known Issues)
- **React/API integration**: See REACT_API_MIGRATION_PLAN.md
- **General development**: See README.md

Created: November 2025

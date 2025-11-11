# React-Sinatra API Integration Migration Plan

**Project:** Foosball Tournament Management
**Objective:** Connect React frontend (mock data) to Sinatra backend API
**Started:** 2025-11-11
**Status:** 🔵 PLANNING PHASE

---

## 📋 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [API Endpoints Mapping](#api-endpoints-mapping)
3. [Migration Phases](#migration-phases)
4. [Phase 1: Foundation Setup](#phase-1-foundation-setup)
5. [Phase 2: Core Data Integration](#phase-2-core-data-integration)
6. [Phase 3: Interactive Features](#phase-3-interactive-features)
7. [Phase 4: Testing & Production](#phase-4-testing--production)
8. [Progress Tracking](#progress-tracking)

---

## Current State Analysis

### ✅ Backend (Sinatra - Ruby)
- **Location:** `/foos-tournament/` (root directory)
- **Main File:** `web_router.rb`
- **Port:** 4567 (configured in `conf.rb`)
- **Status:** ✅ Fully functional with JSON API endpoints
- **Database:** SQLite (`foos.db`)
- **API Authentication:** API keys from `config.yaml` (via X-API-KEY header)

**Key Backend Files:**
- `web_router.rb` - Main Sinatra app with all routes
- `stats.rb` - Statistics calculation module
- `match_repository.rb` - Match data access layer
- `player_repository.rb` - Player data access layer
- `season_repository.rb` - Season/division data access
- `config.yaml.sample` - Configuration template (actual config.yaml NOT in repo)

### ⚠️ Frontend (React + TypeScript)
- **Location:** `/foos-tournament/frontend/`
- **Framework:** React 18 + TypeScript + Vite
- **Port:** 3000 (development)
- **Status:** ⚠️ UI complete but using mock data
- **Styling:** Tailwind CSS + Radix UI components

**Current Mock Data Files:**
- `src/lib/mockData.ts` - Mock players, matches, divisions
- `src/lib/statsCalculator.ts` - Client-side stats (will be replaced by API)

**Components Using Mock Data:**
- `App.tsx` - Root component managing match state
- `Dashboard.tsx` - Main dashboard with match cards
- `StatsHub.tsx` - Leaderboard and statistics
- `DivisionView.tsx` - Division/season view
- `PlayerProfile.tsx` - Player detail pages
- `QuickMatchCreator.tsx` - Match creation dialog

---

## API Endpoints Mapping

### 1. Players API
| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/api/v1/players` | GET | ❌ | Get all players | ⏳ Not integrated |
| `/api/v1/players/:id` | GET | ❌ | Get single player | ⏳ Not integrated |

**Response Format:**
```json
{
  "1": {
    "name": "Alex Johnson",
    "nick": "AJ",
    "elo": 1850
  }
}
```

### 2. Seasons & Divisions API
| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/api/v1/seasons` | GET | ❌ | Get all seasons | ⏳ Not integrated |
| `/api/v1/seasons/current` | GET | ❌ | Get current season | ⏳ Not integrated |
| `/api/v1/seasons/:id` | GET | ❌ | Get specific season | ⏳ Not integrated |
| `/api/v1/divisions/:id` | GET | ❌ | Get division details | ⏳ Not integrated |
| `/api/v1/divisions/:id/classification` | GET | ❌ | Get division standings | ⏳ Not integrated |

**Season Response Format:**
```json
{
  "id": 1,
  "title": "Fall Championship 2025",
  "start": "2025-09-01",
  "end": "2025-12-15",
  "divisions": [...]
}
```

### 3. Matches API
| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/api/get_open_matches` | GET | ❌ | Get all open matches | ⏳ Not integrated |
| `/api/v1/matches/:id` | GET | ❌ | Get match details | ⏳ Not integrated |
| `/api/create_quick_match` | POST | ✅ | Create quick match | ⏳ Not integrated |
| `/api/set_result` | POST | ✅ | Submit match result | ⏳ Not integrated |

**Open Matches Response Format:**
```json
[
  {
    "division_id": 1,
    "name": "Premier League",
    "matches": [
      {
        "id": 42,
        "division_id": 1,
        "round": 3,
        "player_ids": [1, 2, 3, 4],
        "players": ["Alex", "Jordan", "Sam", "Casey"],
        "mode": "doubles",
        "quick_match": true,
        "teams": {
          "yellow": {"ids": [1, 2], "names": ["Alex", "Jordan"]},
          "black": {"ids": [3, 4], "names": ["Sam", "Casey"]}
        },
        "target_score": 10,
        "submatches": [...]
      }
    ]
  }
]
```

**Create Quick Match Payload:**
```json
{
  "division_id": 1,
  "player_ids": [1, 2, 3, 4],
  "mode": "singles|doubles",
  "win_condition": "score_limit|best_of|time_limit",
  "target_score": 10
}
```

### 4. Stats API (Protected)
| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/api/stats/leaderboard` | GET | ✅ | Global leaderboard | ⏳ Not integrated |
| `/api/stats/players/:id` | GET | ✅ | Player detailed stats | ⏳ Not integrated |
| `/api/stats/h2h` | GET | ✅ | Head-to-head stats | ⏳ Not integrated |
| `/api/stats/partnerships/:id` | GET | ✅ | Player partnerships | ⏳ Not integrated |

**Query Parameters:**
- `scope`: `all`, `league`, `quick` (filter by match type)
- `limit`: number of results (default 50)
- `season`: season name/id

**Leaderboard Response Format:**
```json
[
  {
    "player_id": 1,
    "name": "Alex Johnson",
    "games": 60,
    "wins": 42,
    "win_rate": 0.70,
    "elo": 1850
  }
]
```

**Player Detail Response Format:**
```json
{
  "player_id": 1,
  "name": "Alex Johnson",
  "games": 60,
  "wins": 42,
  "losses": 18,
  "win_rate": 0.70,
  "elo": 1850,
  "goals_for": 520,
  "goals_against": 380,
  "goal_diff": 140,
  "avg_for": 8.67,
  "avg_against": 6.33,
  "current_streak": 5,
  "longest_win_streak": 12,
  "longest_lose_streak": 4,
  "windows": {
    "7": {"games": 10, "wins": 8, "win_rate": 0.80},
    "30": {"games": 25, "wins": 18, "win_rate": 0.72}
  }
}
```

---

## Migration Phases

### Phase 1: Foundation Setup ✅ COMPLETE
**Goal:** Set up infrastructure for API calls (no UI changes yet)

**Tasks:**
- [x] ✅ Analyze current codebase structure
- [x] ✅ Document all API endpoints
- [x] ✅ Install axios dependency
- [x] ✅ Create environment variable files (.env.development, .env.production)
- [x] ✅ Configure Vite proxy for API calls
- [x] ✅ Create TypeScript type definitions (types.ts)
- [x] ✅ Create API service layer (api.ts)
- [x] ✅ Create config.yaml for backend

**Completed:** 2025-11-11
**Actual Time:** 1.5 hours
**Risk Level:** 🟢 Low

**Notes:**
- Created comprehensive API service layer with axios
- All TypeScript types defined for API responses
- Vite proxy configured for seamless development
- Environment variables set up for dev and production
- Backend configuration created (config.yaml)
- **Next:** Backend needs gems installed (`bundle install`) before testing

---

### Phase 2: Core Data Integration ⏳ NOT STARTED
**Goal:** Connect read-only data (players, seasons, leaderboard)

**Tasks:**
- [ ] Modify `StatsHub.tsx` to use Stats API
  - Replace mockData import with statsApi.leaderboard()
  - Add loading states (spinners)
  - Add error handling
  - Implement scope filter (all/league/quick)

- [ ] Modify `Dashboard.tsx` to use real data
  - Load open matches from API
  - Load top players from Stats API
  - Transform backend match format to frontend format
  - Add loading states

- [ ] Update `App.tsx`
  - Remove mock data state management
  - Remove unnecessary props drilling

- [ ] Test all read operations
  - Verify API calls in Network tab
  - Verify data displays correctly
  - Test loading states
  - Test error states

**Estimated Time:** 2-3 hours
**Risk Level:** 🟡 Medium

---

### Phase 3: Interactive Features ⏳ NOT STARTED
**Goal:** Enable match creation and result submission

**Tasks:**
- [ ] Update `QuickMatchCreator.tsx`
  - Replace mock player list with API call
  - Implement API call to create_quick_match
  - Handle success/error responses
  - Add proper loading states during creation

- [ ] Update `MatchSimulator.tsx`
  - Implement API call to set_result
  - Handle match result submission
  - Add real-time score updates
  - Implement goal timeline tracking

- [ ] Update `DivisionView.tsx`
  - Load division data from API
  - Load division matches from API
  - Implement match filtering

- [ ] Update `PlayerProfile.tsx`
  - Load player stats from API
  - Load H2H stats from API
  - Load partnerships from API
  - Implement time window filters

- [ ] Test all write operations
  - Create singles match
  - Create doubles match
  - Submit match results
  - Verify database updates

**Estimated Time:** 3-4 hours
**Risk Level:** 🟡 Medium

---

### Phase 4: Testing & Production ⏳ NOT STARTED
**Goal:** Production build, deployment, comprehensive testing

**Tasks:**
- [ ] Development testing
  - Test all pages with real API
  - Test all filters and search
  - Test match creation flow
  - Test match result submission
  - Test dark mode
  - Test mobile responsive design

- [ ] Production build
  - Run `npm run build`
  - Verify build size (<5MB)
  - Test production build locally

- [ ] Backend integration
  - Update web_router.rb to serve React app
  - Add SPA routing support
  - Test all API routes still work

- [ ] Raspberry Pi deployment
  - Copy build files to Pi
  - Test on Pi (192.168.178.165:4567)
  - Verify performance is acceptable

- [ ] Final acceptance testing
  - Test all acceptance criteria
  - Performance testing
  - Cross-browser testing
  - Mobile device testing

**Estimated Time:** 2-3 hours
**Risk Level:** 🟢 Low

---

## Progress Tracking

### Overall Progress: 25% Complete

| Phase | Status | Progress | Completed | Total | Notes |
|-------|--------|----------|-----------|-------|-------|
| Phase 1 | ✅ COMPLETE | ██████████ 100% | 8 | 8 | Foundation ready |
| Phase 2 | ⚪ NOT STARTED | ░░░░░░░░░░ 0% | 0 | 4 | Core data integration |
| Phase 3 | ⚪ NOT STARTED | ░░░░░░░░░░ 0% | 0 | 5 | Interactive features |
| Phase 4 | ⚪ NOT STARTED | ░░░░░░░░░░ 0% | 0 | 4 | Testing & deployment |

### Current Task
**[Phase 1] ✅ COMPLETE - Ready for Phase 2**
- [x] Analysis complete
- [x] Documentation complete
- [x] Dependencies installed (axios)
- [x] API service layer created
- [x] TypeScript types defined
- [x] Environment variables configured
- [x] Vite proxy configured
- [x] Backend config.yaml created

---

## Key Technical Decisions

### 1. API Client: Axios vs Fetch
**Decision:** Use Axios
**Reasoning:**
- Built-in request/response interceptors (for API key injection)
- Better error handling
- TypeScript support
- Request cancellation support
- Automatic JSON transformation

### 2. State Management: Props vs Context vs Redux
**Decision:** Component-level state with props
**Reasoning:**
- App is simple enough (no deep nesting)
- Each page fetches its own data independently
- No need for global state management complexity
- Easy to migrate to Context/Redux later if needed

### 3. Environment Variables
**Decision:** Use Vite's built-in .env support
**Reasoning:**
- VITE_API_URL: Empty for dev (uses proxy), full URL for prod
- VITE_API_KEY: For authenticated endpoints
- Type-safe access via `import.meta.env`

### 4. Development Proxy vs Direct Calls
**Decision:** Use Vite proxy for development
**Reasoning:**
- Avoids CORS issues
- Simulates production URL structure
- Seamless transition to production

### 5. TypeScript Strictness
**Decision:** Maintain existing type safety level
**Reasoning:**
- Don't introduce breaking changes
- Add proper types for API responses
- Use `any` sparingly, document when necessary

---

## Risk Assessment & Mitigation

### Risk 1: API Authentication Issues 🟡 MEDIUM
**Description:** API key authentication may fail or config.yaml may not exist
**Impact:** Cannot access protected endpoints (stats, match creation)
**Mitigation:**
- Check for config.yaml existence first
- Provide clear error messages if API key is missing
- Document API key setup in README
- Add fallback to sample config if needed

### Risk 2: Data Format Mismatch 🟡 MEDIUM
**Description:** Backend API format may not match frontend expectations
**Impact:** TypeScript errors, data not displaying correctly
**Mitigation:**
- Create transformation functions (backend → frontend format)
- Add runtime type validation where critical
- Test with real API responses early
- Document format differences

### Risk 3: Backend Not Running 🔴 HIGH
**Description:** Sinatra backend may not be running on port 4567
**Impact:** All API calls fail, app unusable
**Mitigation:**
- Add API health check on app startup
- Display clear error message if backend unreachable
- Provide instructions to start backend
- Consider mock fallback for development

### Risk 4: Performance on Raspberry Pi 🟡 MEDIUM
**Description:** React app may be slow on Pi hardware
**Impact:** Poor user experience, laggy UI
**Mitigation:**
- Optimize bundle size (code splitting)
- Minimize re-renders (React.memo where needed)
- Use production build (not dev mode)
- Test on Pi early in Phase 4

### Risk 5: Mobile Responsiveness Issues 🟢 LOW
**Description:** UI may break on mobile devices
**Impact:** Unusable on phones/tablets
**Mitigation:**
- UI already designed with mobile-first approach
- Test on multiple screen sizes
- Use existing responsive utilities (Tailwind)
- Test early and often

---

## Dependencies to Install

```json
{
  "dependencies": {
    "axios": "^1.6.0"  // NEW: API client
  }
}
```

**Note:** All other dependencies already exist in package.json

---

## Files to Create

### New Files
1. `frontend/src/lib/types.ts` - TypeScript type definitions
2. `frontend/src/lib/api.ts` - API service layer
3. `frontend/.env.development` - Dev environment variables
4. `frontend/.env.production` - Production environment variables

### Files to Modify
1. `frontend/vite.config.ts` - Add proxy configuration
2. `frontend/src/App.tsx` - Remove mock data state
3. `frontend/src/components/Dashboard.tsx` - Use real API
4. `frontend/src/components/StatsHub.tsx` - Use real API
5. `frontend/src/components/QuickMatchCreator.tsx` - Use real API
6. `frontend/src/components/MatchSimulator.tsx` - Use real API
7. `frontend/src/components/DivisionView.tsx` - Use real API
8. `frontend/src/components/PlayerProfile.tsx` - Use real API
9. `web_router.rb` - Add React SPA serving (END OF FILE)

### Files to Eventually Remove (after testing)
1. `frontend/src/lib/mockData.ts` - No longer needed
2. `frontend/src/lib/statsCalculator.ts` - Replaced by backend Stats API

---

## Testing Checklist

### Development Testing
- [ ] Backend starts successfully on port 4567
- [ ] Frontend starts successfully on port 3000
- [ ] API calls visible in Network tab
- [ ] API calls succeed (200 status)
- [ ] Data displays correctly in UI
- [ ] Loading spinners show while fetching
- [ ] Error messages display on API failure
- [ ] Dark mode works
- [ ] All navigation works

### API Integration Testing
- [ ] Leaderboard loads real player data
- [ ] Dashboard loads real matches
- [ ] Can filter by scope (all/league/quick)
- [ ] Can search players
- [ ] Can create singles quick match
- [ ] Can create doubles quick match
- [ ] Can submit match results
- [ ] Match results persist in database
- [ ] Stats update after match completion

### Production Build Testing
- [ ] `npm run build` succeeds with no errors
- [ ] Build output is reasonable size (<5MB)
- [ ] Production build runs locally
- [ ] All API calls work in production build
- [ ] No console errors in production

### Raspberry Pi Testing
- [ ] Files deploy successfully to Pi
- [ ] App accessible at 192.168.178.165:4567
- [ ] API calls work on Pi
- [ ] Performance is acceptable
- [ ] No 404 errors for assets
- [ ] Page refresh works (SPA routing)

### Mobile Testing
- [ ] Responsive on phone (375px width)
- [ ] Responsive on tablet (768px width)
- [ ] Touch interactions work
- [ ] Scrolling works smoothly
- [ ] Modals display correctly

### Cross-Browser Testing
- [ ] Works in Chrome/Edge
- [ ] Works in Firefox
- [ ] Works in Safari (if available)

---

## Next Steps

### Immediate (Phase 1)
1. ✅ Create this migration plan document
2. ⏳ Install axios: `cd frontend && npm install axios`
3. ⏳ Create environment variable files
4. ⏳ Update vite.config.ts with proxy
5. ⏳ Create types.ts with all TypeScript interfaces
6. ⏳ Create api.ts with API service layer
7. ⏳ Test basic API call (health check)

### After Phase 1 Complete
- Start Phase 2: Update StatsHub.tsx
- Update this document with progress
- Take screenshots of before/after
- Document any issues encountered

---

## Notes & Observations

### Discovered During Analysis
- ✅ Backend has comprehensive Stats API (already implemented)
- ✅ UI components are well-structured and modular
- ✅ TypeScript is already set up correctly
- ⚠️ No config.yaml in repo (need to create from sample)
- ⚠️ API authentication via X-API-KEY header (need to configure)
- ℹ️ Backend uses SQLite database (foos.db)
- ℹ️ Mock data structure differs slightly from API format (will need transformers)

### Questions/Decisions
- ❓ Should we keep mockData.ts as fallback? → NO, remove after testing
- ❓ Should we add React Query for caching? → NO, keep simple for now
- ❓ Should we add loading skeletons? → YES, but use simple spinners first
- ❓ Should we implement optimistic updates? → NO, server-driven updates only

---

**Last Updated:** 2025-11-11 23:52 UTC
**Updated By:** Claude (Assistant)
**Next Review:** After Phase 2 completion

---

## ✅ Phase 1 Complete Summary

### What Was Completed
1. **Dependencies Installed**
   - ✅ axios@^1.6.0 added to package.json
   - ✅ All existing dependencies confirmed working

2. **Environment Configuration**
   - ✅ `.env.development` - Dev environment with proxy
   - ✅ `.env.production` - Production with full API URL
   - ✅ `config.yaml` - Backend API key configuration

3. **Vite Configuration**
   - ✅ Proxy configured to forward `/api/*` to `localhost:4567`
   - ✅ No CORS issues in development

4. **TypeScript Infrastructure**
   - ✅ `types.ts` - 150+ lines of type definitions
   - ✅ All API request/response interfaces defined
   - ✅ Full type safety for API layer

5. **API Service Layer**
   - ✅ `api.ts` - 400+ lines of API client code
   - ✅ Axios instance with interceptors
   - ✅ Automatic API key injection for protected endpoints
   - ✅ Organized by domain (stats, season, player, match)
   - ✅ Error handling and transformation utilities

### Files Created
- ✅ `/frontend/src/lib/types.ts` (new)
- ✅ `/frontend/src/lib/api.ts` (new)
- ✅ `/frontend/.env.development` (new)
- ✅ `/frontend/.env.production` (new)
- ✅ `/config.yaml` (new)

### Files Modified
- ✅ `/frontend/vite.config.ts` (proxy added)
- ✅ `/frontend/package.json` (axios added)

### Ready for Phase 2
The infrastructure is now complete. Phase 2 can begin by modifying React components to use the API service layer instead of mock data.

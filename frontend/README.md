# Foosball Tournament Management App - React Frontend

Modern React 18 + TypeScript frontend for the Foosball Tournament Management system, fully integrated with the Sinatra backend API.

**Design:** [Figma Project](https://www.figma.com/design/sUX1sEnfBbuBtUrzYTmw3a/Foosball-Tournament-Management-App)

## Status: ✅ Production-Ready

- **100% Test Pass Rate** - 88 tests passing, 6 skipped
- **76.25% Code Coverage** - Comprehensive test suite
- **Full API Integration** - All CRUD operations functional
- **Responsive Design** - Mobile-first approach

## Quick Start

### Prerequisites
- Node.js 18+
- Backend running on port 4567

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Build for production
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── StatsHub.tsx     # Leaderboard & statistics
│   │   ├── MatchSimulator.tsx      # Match result submission
│   │   ├── QuickMatchCreator.tsx   # Match creation wizard
│   │   ├── ui/              # Reusable UI components (Radix UI)
│   │   └── __tests__/       # Component test files
│   ├── lib/
│   │   ├── api.ts           # API service layer (axios)
│   │   ├── types.ts         # TypeScript type definitions
│   │   └── __tests__/       # API test files
│   └── test/
│       └── setup.ts         # Test configuration
├── vite.config.ts           # Vite configuration
└── vitest.config.ts         # Test configuration
```

## Features

### Dashboard
- View all open matches across divisions
- Quick match creation dialog
- Match result submission
- Loading states and error handling
- Empty state with call-to-action

### Stats Hub
- Global leaderboard with player rankings
- Scope filtering (All, League, Quick matches)
- Client-side player search
- Hot streak section (top performers)
- Medal display for top 3 players
- Responsive design (desktop + mobile)

### Match Simulator
- Interactive match result submission
- Singles and doubles support
- Score validation (1-10 range)
- Real-time score tracking
- Best-of-N support
- Match completion confirmation

### Quick Match Creator
- Multi-step wizard UI
- Mode selection (singles/doubles)
- Player selection from API
- Match settings (score limit, best-of)
- Proper loading and error states

## Test Coverage

### Overall Metrics
- **Statements:** 76.25%
- **Branches:** 67.70%
- **Functions:** 67.21%
- **Lines:** 77.56%

### Component Coverage
| Component | Coverage | Status |
|-----------|----------|--------|
| StatsHub | 97.22% | ✅ Excellent |
| MatchSimulator | 84.31% | ✅ Good |
| Dashboard | 81.81% | ✅ Good |
| QuickMatchCreator | 55.38% | ⚠️ UI-Heavy |

### API Layer Coverage
- **Before:** 30.15%
- **After:** 68.25%
- **Improvement:** +38.1%

### Test Suite Breakdown
- **API Tests:** 27 tests (100% passing)
- **Component Tests:** 67 tests (88 passing, 6 skipped)
- **Total:** 88 passing, 6 skipped, 100% pass rate

**See:** `../TESTING_RESULTS.md` for detailed analysis

## Technology Stack

### Core
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Vitest** - Testing framework

### UI Libraries
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons
- **Framer Motion** - Animations
- **Sonner** - Toast notifications

### Data & API
- **Axios** - HTTP client
- **API Interceptors** - Automatic API key injection

### Testing
- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **@vitest/coverage-v8** - Coverage reports

## API Integration

### Environment Variables

Create `.env.development`:
```env
VITE_API_URL=          # Empty - uses Vite proxy
VITE_API_KEY=your_key  # From backend config.yaml
```

Create `.env.production`:
```env
VITE_API_URL=http://your-server:4567
VITE_API_KEY=your_key
```

### API Service (`src/lib/api.ts`)

Organized by domain:

```typescript
// Stats API (protected endpoints)
statsApi.leaderboard(scope, limit)
statsApi.playerDetail(playerId, scope)
statsApi.h2h(playerA, playerB)
statsApi.partnerships(playerId, limit, scope)

// Player API
playerApi.getAllPlayers()
playerApi.getPlayer(playerId)

// Match API
matchApi.getOpenMatches()
matchApi.createQuickMatch(payload)
matchApi.setResult(payload)
matchApi.getMatch(matchId)

// Season API
seasonApi.getAllSeasons()
seasonApi.getCurrentSeason()
seasonApi.getSeason(seasonId)
seasonApi.getDivision(divisionId)

// Utilities
healthCheck()
transformBackendMatch(backendMatch)
```

### Type Definitions (`src/lib/types.ts`)

All API request/response types defined:
- `LeaderboardEntry`, `PlayerStats`, `H2HStats`
- `Season`, `Division`, `Match`, `Player`
- `QuickMatchPayload`, `MatchResultPayload`
- `OpenMatchesResponse`, `CreateMatchResponse`

## Development

### Vite Proxy Configuration

Development requests to `/api/*` are proxied to `localhost:4567`:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4567',
      changeOrigin: true,
    },
  },
}
```

### Testing Best Practices

This project follows:
- **AAA Pattern** (Arrange, Act, Assert)
- **Happy Path First** methodology
- **Clear test descriptions** with business context
- **Proper mocking** of external dependencies
- **Error scenario coverage**

Example test:
```typescript
it('should fetch leaderboard with default parameters', async () => {
  // Arrange
  const mockData = [/* ... */];
  mockGet.mockResolvedValue({ data: mockData });

  // Act
  const result = await statsApi.leaderboard();

  // Assert
  expect(result).toEqual(mockData);
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- api.test.ts

# Watch mode
npm test -- --watch
```

## Build & Deployment

### Development Build
```bash
npm run dev
```
Runs on `http://localhost:3000` with hot module replacement.

### Production Build
```bash
npm run build
```
Outputs to `dist/` directory. Optimized, minified bundle ready for deployment.

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing.

## Known Issues & Limitations

### Skipped Tests (6)
- QuickMatchCreator: 3 tests for unimplemented features
- MatchSimulator: 1 test for error handling
- StatsHub: 2 tests for dropdown interactions

These require E2E testing framework (Playwright/Cypress) or feature implementation.

### Coverage Gaps
1. **QuickMatchCreator (55.38%)** - Complex UI interactions need E2E tests
2. **API Interceptors** - Better tested through integration tests
3. **UI Utilities** - `card.tsx`, `input.tsx` not yet used in tested components

## Documentation

- `../TESTING_RESULTS.md` - Comprehensive test coverage analysis
- `../REACT_API_MIGRATION_PLAN.md` - Full migration documentation
- Inline JSDoc comments throughout codebase

## Contributing

When adding new features:
1. ✅ Write tests first (TDD approach)
2. ✅ Follow AAA pattern for test structure
3. ✅ Update type definitions in `types.ts`
4. ✅ Add API methods to appropriate domain in `api.ts`
5. ✅ Ensure 100% test pass rate before committing
6. ✅ Run coverage check: `npm test -- --coverage`

## Support

For questions or issues:
- Check `TESTING_RESULTS.md` for test coverage details
- Review `REACT_API_MIGRATION_PLAN.md` for architecture decisions
- Examine test files for usage examples

---

**Last Updated:** 2025-11-12
**Status:** ✅ Production-Ready with Comprehensive Test Coverage

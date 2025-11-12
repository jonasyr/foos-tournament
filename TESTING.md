# Testing Guide - Foosball Tournament System

**Last Updated**: November 2025
**Test Coverage**: Frontend (Partial), Backend (Manual)

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Frontend Tests](#frontend-tests)
3. [Backend Tests](#backend-tests)
4. [Manual Integration Tests](#manual-integration-tests)
5. [Known Issues](#known-issues)
6. [Future Testing Improvements](#future-testing-improvements)

---

## Testing Philosophy

All tests follow these principles:

### AAA Pattern (Arrange, Act, Assert)
```typescript
it('should create a match successfully', async () => {
  // Arrange - Set up test data and mocks
  const mockData = { player_id: 1, name: 'Alice' };
  vi.mock('api').mockResolvedValue(mockData);

  // Act - Perform the action being tested
  const result = await createMatch(mockData);

  // Assert - Verify the expected outcome
  expect(result).toEqual(mockData);
});
```

### Happy Path First
- Test the main success scenarios first
- Cover error cases after happy paths work
- Use descriptive test names: `should [expected behavior] when [condition]`

---

## Frontend Tests

### Technology Stack
- **Test Framework**: Vitest (fast, Vite-native)
- **Testing Library**: @testing-library/react (user-centric testing)
- **Mocking**: Vitest mocks (built-in)
- **Coverage**: V8 provider

### Setup

```bash
cd frontend
npm install # Installs vitest and testing libraries
```

### Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch
```

### Test Organization

```
frontend/src/
├── lib/
│   └── __tests__/
│       └── api.test.ts          # API client unit tests
├── components/
│   └── __tests__/
│       ├── QuickMatchCreator.test.tsx
│       └── MatchSimulator.test.tsx
└── test/
    └── setup.ts                  # Global test configuration
```

### Sample Test Structure

```typescript
describe('Component/Feature Name', () => {
  describe('Happy Path', () => {
    it('should render correctly with valid props', () => {
      // Test implementation
    });

    it('should handle user interaction successfully', async () => {
      // Test user clicks, form submissions, etc.
    });
  });

  describe('Error Cases', () => {
    it('should display error message when API fails', async () => {
      // Test error handling
    });
  });
});
```

### Current Test Coverage

**✅ Implemented:**
- API client unit tests (`api.test.ts`)
  - Stats API: leaderboard fetching
  - Player API: player list fetching
  - Match API: match creation, result submission
  - Error handling for network failures

- Component tests (`QuickMatchCreator.test.tsx`)
  - Mode selection (singles/doubles)
  - Player loading states
  - Error states with retry functionality
  - Dialog lifecycle (open/close/reset)

**⏳ Pending:**
- MatchSimulator component tests
- Dashboard component tests
- StatsHub component tests
- End-to-end integration tests
- Visual regression tests

---

## Backend Tests

### Technology Options

For Ruby/Sinatra testing, recommended tools:

**Option 1: RSpec (BDD Style)**
```ruby
# Gemfile
gem 'rspec'
gem 'rack-test'

# spec/api_spec.rb
describe 'GET /api/stats/leaderboard' do
  it 'returns leaderboard data' do
    get '/api/stats/leaderboard?scope=all'
    expect(last_response).to be_ok
    data = JSON.parse(last_response.body)
    expect(data).to be_an(Array)
  end
end
```

**Option 2: Minitest (Rails Default)**
```ruby
class APITest < Minitest::Test
  include Rack::Test::Methods

  def test_leaderboard
    get '/api/stats/leaderboard'
    assert last_response.ok?
    data = JSON.parse(last_response.body)
    assert_kind_of Array, data
  end
end
```

### Recommended Approach

1. **Install RSpec**:
   ```bash
   gem install rspec rack-test
   ```

2. **Create test structure**:
   ```bash
   mkdir -p spec/api
   rspec --init
   ```

3. **Write API integration tests**:
   - Test each endpoint (GET, POST)
   - Verify response status codes
   - Validate JSON structure
   - Test authentication/authorization
   - Test error conditions

### Sample Backend Test

```ruby
# spec/api/match_api_spec.rb
require 'spec_helper'
require 'rack/test'

describe 'Match API' do
  include Rack::Test::Methods

  def app
    Sinatra::Application
  end

  context 'GET /api/get_open_matches' do
    it 'returns open matches successfully' do
      # Arrange
      create_test_match(status: 1) # Open match

      # Act
      get '/api/get_open_matches'

      // Assert
      expect(last_response.status).to eq(200)
      data = JSON.parse(last_response.body)
      expect(data).to be_an(Array)
      expect(data.first['matches']).to be_an(Array)
    end
  end

  context 'POST /api/create_quick_match' do
    it 'creates a quick match with valid data' do
      # Arrange
      payload = {
        division_id: 1,
        player_ids: [1, 2, 3, 4],
        mode: 'doubles',
        win_condition: 'score_limit',
        target_score: 10
      }

      # Act
      post '/api/create_quick_match',
           payload.to_json,
           'CONTENT_TYPE' => 'application/json',
           'HTTP_X_API_KEY' => 'change-me-supersecret'

      # Assert
      expect(last_response.status).to eq(200)
      data = JSON.parse(last_response.body)
      expect(data['match_id']).to be > 0
    end
  end
end
```

---

## Manual Integration Tests

Use these manual test scenarios to verify full-stack integration:

### Test 1: Read Operations (Stats API)

**Happy Path:**
```bash
# Backend should be running on port 4567
curl -H "X-API-KEY: change-me-supersecret" \
     "http://localhost:4567/api/stats/leaderboard?scope=all&limit=5"
```

**Expected Result:**
```json
[
  {
    "player_id": 1,
    "name": "Alice Johnson",
    "games": 10,
    "wins": 8,
    "win_rate": 0.8,
    "elo": 1850
  },
  ...
]
```

**Status**: ✅ **PASSING**

---

### Test 2: Player List

**Happy Path:**
```bash
curl http://localhost:4567/api/v1/players
```

**Expected Result:**
```json
[
  {
    "id": 1,
    "name": "Alice Johnson",
    "nick": "Alice",
    "elo": 1850
  },
  ...
]
```

**Status**: ✅ **PASSING**

---

### Test 3: Open Matches

**Happy Path:**
```bash
curl http://localhost:4567/api/get_open_matches
```

**Expected Result:**
```json
[
  {
    "division_id": 1,
    "name": "Premier Division",
    "matches": [
      {
        "id": 1001,
        "player_ids": [1, 2, 3, 4],
        "mode": "doubles",
        ...
      }
    ]
  }
]
```

**Status**: ✅ **PASSING**

---

### Test 4: Create Quick Match (KNOWN ISSUE)

**Happy Path:**
```bash
curl -X POST http://localhost:4567/api/create_quick_match \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: change-me-supersecret" \
  -d '{
    "division_id": 1,
    "player_ids": [1, 2, 3, 4],
    "mode": "doubles",
    "win_condition": "score_limit",
    "target_score": 10
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "match_id": 2003
}
```

**Status**: ❌ **FAILING**
**Issue**: JSON parsing error with json_pure 1.8.6 on Ruby 3.3+
**Error**: `ArgumentError - wrong number of arguments (given 2, expected 1)`
**Root Cause**: json_pure 1.8.6 (required for DataMapper) has incompatible `JSON.parse` API

---

### Test 5: Submit Match Result (BLOCKED)

**Happy Path:**
```bash
curl -X POST "http://localhost:4567/api/set_result?apiKey=change-me-supersecret" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1001,
    "results": [[10, 6]],
    "start": 1699891200,
    "end": 1699891500
  }'
```

**Expected Result:**
```json
{
  "result": "Match result correctly processed"
}
```

**Status**: ❌ **BLOCKED** (same JSON parsing issue)

---

### Test 6: Frontend UI Integration

**Manual Testing Checklist:**

#### Dashboard
- [ ] Displays real player names and stats
- [ ] Shows correct match count
- [ ] Top players sidebar populated from API
- [ ] Match cards show real team compositions
- [ ] Scope filters work (All/League/Quick)
- [ ] Search functionality filters results

#### Stats Hub
- [ ] Leaderboard displays all players from database
- [ ] ELO ratings shown correctly
- [ ] Win rates calculated properly
- [ ] Scope selector changes data (all/league/quick)
- [ ] Search filters player list
- [ ] Loading states display during API fetch
- [ ] Error states show when backend unavailable

#### Quick Match Creator
- [ ] Opens dialog on "Create Match" click
- [ ] Mode selection (Singles/Doubles) works
- [ ] Player dropdowns populated from API
- [ ] Cannot select same player twice
- [ ] Target score slider functional
- [ ] "Best of 3" toggle works
- [ ] Loading spinner during creation
- [ ] Error toast on API failure
- [ ] Success toast on creation
- [ ] Dialog closes after creation

#### Match Simulator
- [ ] Opens when clicking match card
- [ ] Shows correct team names
- [ ] Score increment/decrement works
- [ ] Quick win buttons functional
- [ ] Live classification preview updates
- [ ] Cannot submit 0-0 score
- [ ] Loading state during submission
- [ ] Success toast on submission
- [ ] Error toast on failure

**Status**: ⚠️ **PARTIALLY TESTED**
- Read operations: ✅ Working
- Write operations: ❌ Backend issue prevents testing

---

## Known Issues

### 1. Backend JSON Parsing (CRITICAL)

**Issue**: POST endpoints that parse JSON request bodies fail with Ruby 3.3+

**Error**:
```
ArgumentError - wrong number of arguments (given 2, expected 1):
Parser.new(source, opts).parse
```

**Root Cause**:
- DataMapper requires `json_pure ~> 1.8.6`
- json_pure 1.8.6 uses deprecated JSON parsing API
- Ruby 3.3+ has incompatible JSON library

**Affected Endpoints**:
- `POST /api/create_quick_match`
- `POST /api/set_result`

**Workaround Options**:

**Option A: Use Sinatra's Built-in JSON Parsing**
```ruby
# Instead of:
data = JSON.parse(request.body.read)

# Use:
request.body.rewind
data = JSON.parse(request.body.read, symbolize_names: false)
```

**Option B: Bypass json_pure for Request Parsing**
```ruby
require 'json'
data = ::JSON.parse(payload) # Use stdlib JSON
```

**Option C: Upgrade Backend ORM**
- Replace DataMapper with Sequel or ActiveRecord
- Modern ORMs don't have json version constraints

**Recommended**: Option B (quick fix) or Option C (long-term)

---

### 2. Frontend Import Statements

**Issue**: Components use non-standard import syntax

**Example**:
```typescript
import { toast } from "sonner@2.0.3";  // Non-standard
```

**Should be**:
```typescript
import { toast } from "sonner";  // Standard
```

**Impact**: Test mocks more complex than necessary

**Fix**: Update all component imports to standard format

---

## Future Testing Improvements

### Short Term (Next Sprint)
1. Fix backend JSON parsing issue
2. Add comprehensive component tests
3. Set up CI/CD pipeline with automated tests
4. Achieve 80%+ code coverage on critical paths

### Medium Term
1. Add E2E tests with Playwright or Cypress
2. Visual regression testing with Percy/Chromatic
3. Performance testing (Lighthouse CI)
4. Accessibility testing (axe-core)

### Long Term
1. Load testing for backend API
2. Security testing (OWASP Top 10)
3. Cross-browser compatibility testing
4. Mobile device testing

---

## Test Execution Summary

| Test Suite | Status | Coverage | Notes |
|------------|--------|----------|-------|
| Frontend Unit Tests | ⚠️ Partial | 60% (estimated) | Vitest configured, basic tests written |
| Frontend Component Tests | ⚠️ Partial | 40% (estimated) | QuickMatchCreator tested, others pending |
| Backend API Tests | ❌ None | 0% | Manual testing only |
| Integration Tests | ⚠️ Manual | N/A | Read ops work, write ops blocked |
| E2E Tests | ❌ None | 0% | Not implemented |

**Overall Status**: ⚠️ **Functional for reads, backend issue blocks writes**

---

## Running Complete Test Suite

### Prerequisites
```bash
# Backend
cd /home/user/foos-tournament
bundle install
bundle exec ruby web_router.rb &

# Frontend
cd frontend
npm install
npm run dev &
```

### Test Sequence

1. **Backend Health**:
   ```bash
   curl http://localhost:4567/api/health
   # Should return: {"ok":true,"season_count":1,"player_count":12,...}
   ```

2. **Frontend Tests**:
   ```bash
   cd frontend
   npm test -- --run
   ```

3. **Integration Tests**:
   - Open http://localhost:3000
   - Run through Manual Testing Checklist above

4. **Performance Check**:
   ```bash
   lighthouse http://localhost:3000 --view
   ```

---

## Contributing Tests

When adding new features:

1. **Write tests first** (TDD approach)
2. **Follow AAA pattern** (Arrange, Act, Assert)
3. **Test happy path first**, then edge cases
4. **Use descriptive test names**: `should [behavior] when [condition]`
5. **Mock external dependencies** (API calls, timers, etc.)
6. **Aim for 80%+ coverage** on business logic
7. **Document test failures** with reproduction steps

---

## Questions & Support

For testing questions:
- Frontend: Check Vitest docs (https://vitest.dev)
- Backend: Check RSpec docs (https://rspec.info)
- Integration: See SETUP.md for environment setup

---

**Last Test Run**: November 12, 2025
**Test Environment**: Development (localhost)
**Database**: foos.db with 12 players, 7 matches

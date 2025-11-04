# AGENTS.MD: AI Collaboration Guide for foos-tournament

**Last Updated:** November 2025  
**Hardware:** Raspberry Pi 4 Model B Rev 1.1 (shared with Foos client)  
**OS:** Debian GNU/Linux 13 (trixie)  
**Ruby:** 3.3.8  
**Branch:** feature/stats

This document provides essential context for AI models interacting with this project. It includes critical local system configurations, database setup, and deployment details.

## 1. Project Overview & Purpose

* **Primary Goal:** Sinatra web application and CLI utilities for foosball tournament management (seasons, divisions, match scheduling, result tracking, player statistics)
* **Business Domain:** Recreational sports tournament management for foosball leagues within an organization
* **Current Deployment:** Runs on same Raspberry Pi 4 as Foos client application, accessible at http://192.168.178.165:4567 (or http://foosball-pi:4567)

## 2. Core Technologies & Stack

* **Languages:** Ruby (targeting MRI 2.4+ for compatibility), ERB templates for views, JavaScript (jQuery) for browser-side behavior, CSS (Bootstrap-based styling).
* **Frameworks & Runtimes:** Sinatra (web routing), Tilt/ERB for server-side rendering, DataMapper ORM for persistence, Bootstrap 3 & jQuery on the front-end.
* **Databases:** SQLite (default, configurable via `config.yaml`).
* **Key Libraries/Dependencies:** `sinatra`, `sinatra-contrib` (config extension), `data_mapper`, `dm-migrations`, `dm-sqlite-adapter`, `sqlite3`, `json` (pinned 1.8.6 for DataMapper serializer support).
* **Platforms:** Developed/tested for POSIX-like systems (scripts assume Ruby CLI tools, SQLite, DataMapper). Web app should run where Ruby + Sinatra supported.
* **Package Manager:** Bundler via `Gemfile`/`Gemfile.lock`; DataMapper handles DB migrations with Ruby scripts.

## 3. Architectural Patterns

* **Overall Architecture:** Monolithic Sinatra application serving HTML pages and AJAX endpoints backed by a DataMapper ORM layer and domain entities. Supplemented by CLI scripts for tournament operations and migration utilities.
* **Directory Structure Philosophy:**
  * `/bin`: CLI scripts for season creation, result parsing, match management.
  * `/dm`: DataMapper models and migration helpers (`data_model.rb`, `upgrade_model.rb`).
  * `/public`: Static assets served by Sinatra (Bootstrap CSS/JS, custom `foos.js`, fonts).
  * `/views`: ERB templates corresponding to web routes (division, history, season summaries, etc.).
  * Root-level `*_repository.rb`, `*_assigner.rb`, `*_processor.rb`, etc.: Domain logic (entities, repositories, match scheduling, stats, hooks).
  * `/config.yaml.sample`: Example runtime configuration for DB URI, API keys, hooks.
* **Module Organization:** Domain objects implemented as plain Ruby classes (`Season`, `Division`, `Match`, `Player`, `Stats`), repository classes handle persistence via DataMapper models residing in `dm/data_model.rb`. Sinatra routes in `web_router.rb` orchestrate repositories and render ERB views. CLI scripts extend `$LOAD_PATH` and reuse the same repositories and entities.

## 4. Coding Conventions & Style Guide

* **Formatting:** Predominantly two-space indentation with trailing parentheses omitted unless required. Uses explicit `return` in many methods, consistent with legacy Ruby style.
* **Naming Conventions:**
  * Variables & method names: snake_case (`assign_matches`, `get_current_classification`).
  * Classes/modules: PascalCase (`SeasonRepository`, `HookManager`).
  * Constants: UPPER_CASE with underscores (`DB_URI`, `CONFIG_PATH`).
  * Files: snake_case per domain concept (`season_repository.rb`, `result_processor.rb`).
* **API Design:**
  * **Style:** Procedural/OO mix. Domain entities expose accessor methods; repositories provide CRUD-like operations. Web routes stay thin, delegating to repositories and returning ERB templates or JSON data.
  * **Abstraction:** DataMapper models hidden behind repositories mapping to plain Ruby entities. Separation between persistence (`dm/data_model.rb`) and domain logic encourages isolated testing/mocking.
  * **Extensibility:** Extend behavior by adding new repositories/entities or augmenting existing ones; DataMapper models can be expanded with new properties followed by migration scripts. Hooks support additional integrations via HTTP endpoints or shell commands.
  * **Trade-offs:** Prioritizes maintainability and clarity over cutting-edge Ruby idioms. Legacy compatibility (Fixnum/Bignum aliasing, pinned gem versions) favors stability. Performance is secondary to simplicity.
* **Common Patterns & Idioms:**
  * Minimal metaprogramming; relies on standard Ruby classes and DataMapper DSL.
  * Memory managed by Ruby GC; no manual resource management.
  * Uses collections (`Array`, `Hash`) and enumerables for business logic (e.g., match assignment algorithm).
  * Compile-time polymorphism not applicable; runtime duck typing with explicit repository interfaces.
  * Limited concurrency usage; operations executed synchronously in web requests or CLI scripts.
* **Error Handling:**
  * Uses exceptions sparingly (e.g., `raise` in `MatchAssigner` for invalid state).
  * Web routes expect repositories to raise on errors; no centralized rescue beyond Sinatra defaults.
  * Hooks log to stdout upon failure; TODO comments indicate plans for better error handling.

## 5. Key Files & Entrypoints

* **Main Entrypoint:** `web_router.rb` (Sinatra app). CLI tools under `/bin` (e.g., `create_season.rb`, `generate_round.rb`).
* **Configuration:** `config.yaml` (user-provided, based on `config.yaml.sample`); `conf.rb` loads settings and sets DataMapper DB URI.
* **CI/CD Pipeline:** No CI configuration present (no `.github/workflows` or similar). Local processes rely on manual commands.

## 6. Development & Testing Workflow

* **Local Development Environment:**
  1. Install Ruby (>= 2.4 recommended) and SQLite development libraries.
  2. Run `bundle install` to install gems.
  3. Copy `config.yaml.sample` to `config.yaml` and update `db_uri`, optional `api_keys`, and hook definitions.
  4. Initialize/upgrade the database:
     ```bash
     cd dm
     ruby upgrade_model.rb
     ```
  5. Seed a season:
     ```bash
     cd ../bin
     ruby create_season.rb "Season Title" --active
     ```
  6. Launch the web app from repository root:
     ```bash
     ruby web_router.rb
     ```
* **Task Configuration:** No Nimble or .nims tasks; Ruby scripts invoked directly. CLI utilities in `/bin` cover tournament operations (match generation, parsing result files, listing matches, etc.).
* **Testing:** No automated test suite is included. Validate changes manually by running CLI commands and exercising web routes locally. Recommend adding tests if contributing significant logic.
* **CI/CD Process:** Manual; when adding automation, ensure compatibility with Bundler, SQLite setup, and DataMapper migrations.

## 7. Critical Local Configuration & Deployment Notes

**IMPORTANT: These are real-world deployment settings and fixes required on the actual Raspberry Pi system.**

### System Configuration
* **Raspberry Pi 4 Model B Rev 1.1** running Debian GNU/Linux 13 (trixie)
* **Ruby:** 3.3.8 (aarch64-linux-gnu)
* **Database:** SQLite 3.x at `/home/pi/foos-project/foos-tournament/tournament.db`
* **Web Server:** Sinatra with Puma, bound to 0.0.0.0:4567 (accessible on LAN)
* **Network:** Static/DHCP at 192.168.178.165, hostname `foosball-pi`

### Required System Packages
```bash
sudo apt-get install ruby ruby-dev sqlite3 libsqlite3-dev \
  build-essential git bundler
```

### Installation & Setup
```bash
cd /home/pi/foos-project/foos-tournament
bundle install
cp config.yaml.sample config.yaml
# Edit config.yaml with actual paths and keys
```

### Database Configuration (config.yaml)
**CRITICAL:** The `db_uri` must use absolute path to work correctly with DataMapper:
```yaml
db_uri: "sqlite:///home/pi/foos-project/foos-tournament/tournament.db"
# NOT: "sqlite://./tournament.db" or "sqlite://tournament.db"
api_keys:
  - "change-me-supersecret"  # Must match foos/config.py league_apikey
bind_host: "0.0.0.0"  # Allow LAN access
bind_port: 4567
```

### Database Schema
Key tables (see `dm/data_model.rb` for full schema):
* **seasons**: id, title, start_time, end_time
* **divisions**: id, name, level, scoring, total_rounds, current_round, season_id
* **players**: id, name, nick
* **divisionplayers**: player_id, division_id, total_matches, assign_deviation
* **matches**: id, round, pl1, pl2, pl3, pl4, score1a, score1b, score2a, score2b, score3a, score3b, status, time, duration, division_id
* **goal_events**: id, match_id, team, player_id, timestamp, yellow_score, black_score (for stats tracking)
* **roundplayers**: player_id, division_id, round, matches

### Database Initialization
```bash
cd /home/pi/foos-project/foos-tournament/dm
ruby upgrade_model.rb  # Creates/upgrades schema
cd ../bin
ruby create_season.rb "Season 2025" --active  # Create season
```

### Creating Test Data
```bash
# Add players
sqlite3 tournament.db "INSERT INTO players (id, name, nick) VALUES 
  (1, 'Alice', 'alice'), (2, 'Bob', 'bob'), 
  (3, 'Carol', 'carol'), (4, 'Dave', 'dave');"

# Create division
sqlite3 tournament.db "INSERT INTO divisions 
  (id, name, level, season_id, total_rounds, current_round, scoring) 
  VALUES (1, 'Test Division', 1, 1, 1, 1, 0);"

# Add players to division
sqlite3 tournament.db "INSERT INTO divisionplayers 
  (player_id, division_id, total_matches, assign_deviation) 
  VALUES (1,1,0,0), (2,1,0,0), (3,1,0,0), (4,1,0,0);"

# Create matches
sqlite3 tournament.db "INSERT INTO matches 
  (id, round, pl1, pl2, pl3, pl4, status, division_id) 
  VALUES (1001, 1, 1, 2, 3, 4, 1, 1);"  # status=1: open
```

### Known Issues & Fixes Applied

#### 1. Rack::Protection Host Authorization
* **Issue:** Sinatra's Rack::Protection::HostAuthorization blocked API calls from localhost/LAN
* **Error:** "attack prevented by Rack::Protection::HostAuthorization" with 403 Forbidden responses
* **Fix:** Disabled specific protections in `web_router.rb`:
```ruby
# Must come AFTER all requires to override config_file settings
set :protection, except: [:host_authorization, :json_csrf, :remote_token]
set :bind, '0.0.0.0'
```
* **Security Note:** This is acceptable for LAN-only deployment but not for public networks

#### 2. API Key Authentication
* **Issue:** Original code checked singular `Conf.settings.api_key` but config uses `api_keys` array
* **Fix:** Updated `web_router.rb` line 404:
```ruby
# Before: if params['apiKey'] != Conf.settings.api_key
# After:
before '/api/set_*' do
  halt 403 unless params['apiKey'] && API_KEYS.include?(params['apiKey'])
end
```

#### 3. Match Result Format Mismatch
* **Current Limitation:** `result_processor.rb` expects 3 submatches (best-of-3 format):
```ruby
# get_submatches() expects @scores[0][0], @scores[1][0], @scores[2][0]
```
* **Foos Sends:** Single submatch (best-of-10 format):
```json
{"id": 1001, "results": [[4, 10]], "start": 1762209376, "end": 1762209451}
```
* **Workaround:** Matches must be manually imported or result processor needs updating to handle single-game format

#### 4. Missing results/ Directory
* **Issue:** API tried to write to `results/result_TIMESTAMP_MATCHID.json` but directory didn't exist
* **Fix:** Created directory:
```bash
mkdir -p /home/pi/foos-project/foos-tournament/results
```

#### 5. Division Players Not Associated
* **Issue:** Division page crashed with `NoMethodError: undefined method '[]' for nil` when analyzing matches
* **Cause:** Players not added to `divisionplayers` table, so `get_player_ids()` returned empty array
* **Fix:** Must associate players with divisions via `divisionplayers` table (see Creating Test Data above)

#### 6. Database Migration Complications (Ruby 3.3 + Old Gems)

* **Issue:** `ruby dm/upgrade_model.rb` fails with compatibility errors:
  * `uninitialized constant JSON::Fragment` (json_pure 1.8.6 incompatible with Ruby 3.3)
  * `undefined method 'untaint'` (Bundler 1.14.5 uses removed method)
  * `uninitialized constant Fixnum` (DataObjects 0.10.17 uses deprecated constant)
* **Root Cause:** Legacy gems (DataMapper, json_pure 1.8.6) not compatible with Ruby 3.3+
* **Workaround:** Use direct SQLite ALTER TABLE commands instead of DataMapper auto_upgrade:

```bash
cd /home/pi/foos-project/foos-tournament
sqlite3 tournament.db "ALTER TABLE matches ADD COLUMN quick_match BOOLEAN DEFAULT 0;"
sqlite3 tournament.db "ALTER TABLE matches ADD COLUMN mode VARCHAR(50) DEFAULT 'standard';"
# Verify: sqlite3 tournament.db "PRAGMA table_info(matches);"
```

* **Long-term Solution:** Upgrade to modern ORM (Sequel, ActiveRecord) or update DataMapper fork for Ruby 3.x compatibility

#### 7. Quick Match Creation - Runtime Caching Issue

* **Issue:** Newly created quick matches don't appear in "Pending Matches" until server restart
* **Cause:** Division entities load their `@matches` array once during initialization from `DivisionRepository#get()`. When a new match is added via API, the in-memory Division object is stale until next request creates a new Division instance
* **Behavior:** Match IS saved to database correctly but doesn't appear in current page view
* **Workaround:** Browser must refresh/reload the division view (AJAX calls `GET /ajax/division/:id` which creates fresh Division instance from DB)
* **Expected Behavior:** After successful `POST /api/create_quick_match`, JavaScript reloads division view via `load_division_subsection(divisionId)` which triggers fresh data fetch
* **Note:** This is not a bug per se—stateless HTTP means each request gets fresh data from DB. The "problem" only occurs if expecting live updates without page refresh

### Running the Application

```bash
# Start web server (foreground)
cd /home/pi/foos-project/foos-tournament
ruby web_router.rb

# Access web UI
# From local machine: http://192.168.178.165:4567/
# From Pi: http://localhost:4567/ or http://foosball-pi:4567/

# Background with Puma (production)
# TODO: Add systemd service or daemon script
```

### Integration with Foos Client
* **API Endpoints Used by Foos:**
  * `GET /api/get_open_matches` - Returns matches with status=1 (open) for display in League menu
  * `POST /api/set_result?apiKey=KEY` - Receives completed match results from Foos client
* **Match Format in league.json (Foos side):**
```json
{
  "id": 1001,
  "division": "Test Division",
  "players": ["Alice", "Bob", "Carol", "Dave"],
  "submatches": [[["Alice", "Bob"], ["Carol", "Dave"]]]
}
```
* **Data Flow:**
  1. Create match in foos-tournament database (with status=1)
  2. Match appears in `GET /api/get_open_matches` response
  3. Foos `league_sync.py` writes to `foos/league/league.json`
  4. User selects match in Foos League menu
  5. After match completes, Foos writes result to `league/results/result_MATCHID.json`
  6. Foos `league_sync.py` POSTs result to `/api/set_result`
  7. Result processed and match marked as played (status=2) in database
  8. Match visible in web UI under "Finished Matches"

### Web UI Access
* Browse to http://192.168.178.165:4567/ or http://foosball-pi:4567/
* Click season name (e.g., "Season 2025")
* Click division tab (e.g., "Test Division")
* View:
  * **Summary tab:** Recent matches and division standings
  * **Division tab:** Full classification, rivals, open/finished matches
  * **History:** Classification evolution after each match

## 8. Specific Instructions for AI Collaboration

* **Contribution Guidelines:**
  * Follow existing coding patterns: two-space indentation, explicit `require` paths, repositories mediating DataMapper access
  * Repositories (e.g., `SeasonRepository`, `MatchRepository`) handle all database access; domain entities (`Season`, `Match`, `Player`) remain plain Ruby objects
  * New features integrate via `config.yaml` when configuration needed
  * Web routes in `web_router.rb` stay thin—delegate to repositories and domain logic
  * **Database changes require:**
    1. Edit `dm/data_model.rb` DataMapper models
    2. Run `ruby dm/upgrade_model.rb` to apply schema changes
    3. Test with fresh database creation and upgrades
* **API Development:**
  * API routes use JSON responses via `json_api()` helper (pretty-printed JSON)
  * Authentication via `api_keys` array in `config.yaml`
  * Use `before` filters for API key checks (see line 403-405 in `web_router.rb`)
  * CORS/host protection settings must allow LAN access (see section 7 fixes above)
* **Match Data Model:**
  * Matches have 4 players: pl1, pl2, pl3, pl4 (player IDs)
  * Scores stored as: score1a/score1b (submatch 1), score2a/score2b (submatch 2), score3a/score3b (submatch 3)
  * Status: 0=pending, 1=cancelled, 2=played/finished
  * Quick match fields: `quick_match` (Boolean), `mode` (String), `win_condition` (String), `target_score` (Integer)
  * `match.quick_match?` returns true for ad-hoc matches; `get_submatches()` adapts (1 vs 3 games)
* **Division Analysis:**
  * Division classification computed via `division.rb` `analyse()` method
  * Requires all players in `divisionplayers` table to initialize `one2one` hash
  * Crashes if players not associated with division (see section 7 issue #5)
* **Security:** Avoid hardcoding secrets; rely on `config.yaml`. Validate user input. Be cautious with hook execution to prevent command injection
* **Dependencies:** Add Ruby gems via `Gemfile` and run `bundle install`. Update `Gemfile.lock`. For database schema changes, edit `dm/data_model.rb` and provide migration via `dm/upgrade_model.rb`
* **Commit Messages:** Sentence-style summaries (e.g., "Fix API key check to use array lookup")

## 9. Quick Match Feature Implementation Notes

**Implemented:** November 2025

### Overview
Extended the tournament system to support spontaneous "Quick Matches" that can be created ad-hoc via the web UI without pre-planning through CLI season setup, while maintaining full statistics compatibility.

### Database Schema Changes
Added four new columns to `matches` table:
- `quick_match` (BOOLEAN, default: false) - Marks match as quick/spontaneous
- `mode` (VARCHAR(50), default: 'standard') - Match mode (reserved for future: singles/doubles)
- `win_condition` (VARCHAR(50), default: 'score_limit') - Victory condition (reserved for future variants)
- `target_score` (INTEGER, default: 10) - Target score for match completion

### Key Files Modified
- `dm/data_model.rb`: DataMapper model extended with new properties
- `match.rb`: Entity extended with attributes, getters/setters, smart defaults
- `match_repository.rb`: Added `create_quick_match()` helper, updated mapping methods
- `web_router.rb`: New `/api/create_quick_match` endpoint with validation
- `views/division.erb`: Quick match creation form with 4-player selection
- `public/js/foos.js`: AJAX submission logic with client-side validation

### Important Implementation Details
1. **Round field must be set to 0 (not NULL)** for quick matches to appear immediately in pending matches list. NULL values cause runtime display issues due to division caching.
2. **Migration challenges:** Ruby 3.3 compatibility issues with old DataMapper/Bundler versions (Fixnum constant removed, `untaint` method removed). Solution: Direct SQLite `ALTER TABLE` commands instead of `dm/upgrade_model.rb`.
3. **Match flexibility (Step 3 complete):** `match.rb` now supports both single-game (Quick Match) and best-of-3 (League) via `quick_match?` method:
   - `get_submatches()` returns 1 or 3 submatches depending on mode
   - `calculate_victories()` adapts logic accordingly
   - `set_scores()` validates 1-3 score pairs robustly
4. **Statistics integration:** Quick matches automatically excluded from league stats via early return in `division.rb#analyse_match()`; separate tracking possible via `quick_match` flag.

### Migration SQL (for reference)
```sql
ALTER TABLE matches ADD COLUMN quick_match BOOLEAN DEFAULT 0;
ALTER TABLE matches ADD COLUMN mode VARCHAR(50) DEFAULT 'standard';
ALTER TABLE matches ADD COLUMN win_condition VARCHAR(50) DEFAULT 'score_limit';
ALTER TABLE matches ADD COLUMN target_score INTEGER DEFAULT 10;
```

### API Integration (Step 3 Complete)
**Enhanced endpoints for Foos client:**
- **`/api/get_open_matches`:** Returns matches with `mode`, `quick_match`, `target_score`, and `teams` structure (`:yellow`/`:black` with IDs and names). League matches include `submatches` array; quick matches omit it.
- **`/api/get_quick_match/:id`:** Dedicated endpoint for immediate retrieval after creation.
- **Result handling:** `result_processor.rb` accepts 1-3 score pairs; timestamps optional.

**Foos client requirements:**
1. Check `quick_match` flag in match payload
2. For quick matches: play single game (Yellow team vs Black team)
3. For league matches: play best-of-3 with rotation
4. Use `target_score` for victory condition (default: 10)

### Future Work (Steps 5-8)
- **Step 5:** Enhanced player validation and duplicate prevention in UI
- **Step 6:** Separate quick match statistics in division views and reports
- **Step 7:** Hook manager integration for quick match events
- **Step 8:** Persistent UI preferences for frequent player pairings


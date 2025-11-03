# AGENTS.md: AI Collaboration Guide

This document provides essential context for AI models interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 1. Project Overview & Purpose

* **Primary Goal:** Web interface and supporting CLI utilities to organize foosball tournaments, including season/division management, match scheduling, result tracking, and statistics.
* **Business Domain:** Recreational sports tournament management (foosball leagues within an organization).

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

## 7. Specific Instructions for AI Collaboration

* **Contribution Guidelines:** No formal `CONTRIBUTING.md`. Follow existing coding patterns: two-space indentation, explicit `require` paths, repositories mediating DataMapper access, and reuse domain entities. Ensure new features integrate with `conf.rb` settings if configuration needed.
* **Security:** Avoid hardcoding secrets or API keys; rely on `config.yaml`. Validate and sanitize any user input routed through Sinatra endpoints. Be cautious when modifying hook execution to prevent command injection.
* **Dependencies:** Add Ruby dependencies via `Gemfile` and run `bundle install`. Update `Gemfile.lock` accordingly. For database schema changes, edit `dm/data_model.rb` and provide migration path via `dm/upgrade_model.rb` (DataMapper auto-upgrade) or additional scripts.
* **Commit Messages:** Existing history uses sentence-style summaries without strict Conventional Commit rules. Keep commit messages clear and descriptive of the changes introduced.


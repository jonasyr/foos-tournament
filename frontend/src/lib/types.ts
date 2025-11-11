// TypeScript Type Definitions for Foosball Tournament API
// This file contains all interfaces and types for API requests and responses

// ============================================================================
// Player Types
// ============================================================================

export interface Player {
  id: string;
  name: string;
  nick?: string;
  avatar?: string;
  elo: number;
}

// Backend API returns players as a dictionary keyed by player ID
export interface PlayersResponse {
  [playerId: string]: {
    name: string;
    nick?: string;
  };
}

// ============================================================================
// Match Types
// ============================================================================

export interface Match {
  id: string;
  division_id: number;
  round: number;
  timestamp: string;
  yellowTeam: Player[];
  blackTeam: Player[];
  yellowScore: number;
  blackScore: number;
  duration: string;
  isQuickMatch: boolean;
  mode?: string;
  target_score?: number;
  win_condition?: string;
  played?: boolean;
}

// ============================================================================
// Stats API Response Types
// ============================================================================

export interface LeaderboardEntry {
  player_id: number;
  name: string;
  games: number;
  wins: number;
  win_rate: number;
  elo: number;
}

export interface PlayerStats {
  player_id: number;
  name: string;
  games: number;
  wins: number;
  losses: number;
  win_rate: number;
  elo: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  avg_for: number;
  avg_against: number;
  current_streak: number;
  longest_win_streak: number;
  longest_lose_streak: number;
  windows?: {
    [days: number]: {
      games: number;
      wins: number;
      win_rate: number;
    };
  };
}

export interface H2HStats {
  a_id: number;
  b_id: number;
  games: number;
  wins_a: number;
  wins_b: number;
  goal_diff_a: number;
}

export interface Partnership {
  partner_id: number;
  partner_name: string;
  games: number;
  wins: number;
  win_rate: number;
}

// ============================================================================
// Division & Season API Response Types
// ============================================================================

export interface Division {
  id: number;
  title: string;
  level: number;
  total_rounds: number;
  current_round: number;
}

export interface Season {
  id: number;
  title: string;
  start: string;
  end: string;
  divisions: Division[];
}

// ============================================================================
// Open Matches API Response
// ============================================================================

export interface OpenMatchesResponse {
  division_id: number;
  name: string;
  matches: OpenMatch[];
}

export interface OpenMatch {
  id: number;
  division_id: number;
  round: number;
  player_ids: (number | null)[];
  players: (string | null)[];
  mode: string;
  quick_match: boolean;
  teams: {
    yellow: {
      ids: number[];
      names: string[];
    };
    black: {
      ids: number[];
      names: string[];
    };
  };
  target_score?: number;
  submatches?: any[];
}

// ============================================================================
// API Request Payloads
// ============================================================================

// Quick Match Creation Payload
export interface QuickMatchPayload {
  division_id: number;
  player_ids: (number | null)[];
  mode: 'singles' | 'doubles';
  win_condition: string;
  target_score: number;
}

// Match Result Submission Payload
export interface MatchResultPayload {
  id: number;
  results: number[][];
  start?: number;
  end?: number;
}

// ============================================================================
// Match Scope Type (for filtering)
// ============================================================================

export type MatchScope = 'all' | 'league' | 'quick';

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface CreateMatchResponse {
  result: string;
  match: any;
}

export interface SetResultResponse {
  result: string;
}

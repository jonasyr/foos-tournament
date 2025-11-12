// API Service Layer for Foosball Tournament Backend
// This file provides a clean interface to interact with the Sinatra backend API

import axios, { AxiosInstance } from 'axios';
import type {
  LeaderboardEntry,
  PlayerStats,
  H2HStats,
  Partnership,
  Season,
  Division,
  OpenMatchesResponse,
  QuickMatchPayload,
  MatchResultPayload,
  Match,
  Player,
  MatchScope,
  PlayersResponse,
  CreateMatchResponse,
  SetResultResponse,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// ============================================================================
// Request Interceptor - Add API Key for Protected Endpoints
// ============================================================================

apiClient.interceptors.request.use((config) => {
  // List of protected endpoints that require API key authentication
  const protectedEndpoints = [
    '/api/stats',
    '/api/create_quick_match',
    '/api/set_result',
    '/api/matches',
  ];

  // Check if this request is to a protected endpoint
  const isProtected = protectedEndpoints.some((endpoint) =>
    config.url?.startsWith(endpoint)
  );

  // Add API key header if needed
  if (isProtected && API_KEY) {
    config.headers['X-API-KEY'] = API_KEY;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// ============================================================================
// Response Interceptor - Handle Common Errors
// ============================================================================

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', error.response?.status, error.response?.data);

    // Enhance error message for common cases
    if (error.response?.status === 401) {
      error.message = 'Authentication failed. Please check your API key.';
    } else if (error.response?.status === 403) {
      error.message = 'Access forbidden. Invalid API key.';
    } else if (error.response?.status === 404) {
      error.message = 'Resource not found.';
    } else if (error.response?.status === 500) {
      error.message = 'Server error. Please try again later.';
    } else if (error.code === 'ECONNREFUSED') {
      error.message = 'Cannot connect to backend server. Make sure it\'s running on port 4567.';
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Stats API (Protected - requires API key)
// ============================================================================

export const statsApi = {
  /**
   * Get global leaderboard with player rankings
   * @param scope - Filter by match type: 'all', 'league', or 'quick'
   * @param limit - Maximum number of players to return (default: 50)
   */
  async leaderboard(
    scope: MatchScope = 'all',
    limit = 50
  ): Promise<LeaderboardEntry[]> {
    const response = await apiClient.get<LeaderboardEntry[]>(
      `/api/stats/leaderboard`,
      {
        params: { scope, limit },
      }
    );
    return response.data;
  },

  /**
   * Get detailed statistics for a specific player
   * @param playerId - The player's ID
   * @param scope - Filter by match type: 'all', 'league', or 'quick'
   */
  async playerDetail(
    playerId: number,
    scope: MatchScope = 'all'
  ): Promise<PlayerStats> {
    const response = await apiClient.get<PlayerStats>(
      `/api/stats/players/${playerId}`,
      {
        params: { scope },
      }
    );
    return response.data;
  },

  /**
   * Get head-to-head statistics between two players
   * @param playerA - First player's ID
   * @param playerB - Second player's ID
   */
  async h2h(playerA: number, playerB: number): Promise<H2HStats> {
    const response = await apiClient.get<H2HStats>(`/api/stats/h2h`, {
      params: { a: playerA, b: playerB },
    });
    return response.data;
  },

  /**
   * Get partnership statistics for a player
   * @param playerId - The player's ID
   * @param limit - Maximum number of partnerships to return (default: 10)
   * @param scope - Filter by match type: 'all', 'league', or 'quick'
   */
  async partnerships(
    playerId: number,
    limit = 10,
    scope: MatchScope = 'all'
  ): Promise<Partnership[]> {
    const response = await apiClient.get<Partnership[]>(
      `/api/stats/partnerships/${playerId}`,
      {
        params: { limit, scope },
      }
    );
    return response.data;
  },
};

// ============================================================================
// Season & Division API (Public - no auth required)
// ============================================================================

export const seasonApi = {
  /**
   * Get all seasons
   */
  async getAllSeasons(): Promise<Season[]> {
    const response = await apiClient.get<Season[]>(`/api/v1/seasons`);
    return response.data;
  },

  /**
   * Get the current/most recent season
   */
  async getCurrentSeason(): Promise<Season> {
    const response = await apiClient.get<Season>(`/api/v1/seasons/current`);
    return response.data;
  },

  /**
   * Get a specific season by ID
   * @param seasonId - The season's ID
   */
  async getSeason(seasonId: number): Promise<Season> {
    const response = await apiClient.get<Season>(`/api/v1/seasons/${seasonId}`);
    return response.data;
  },

  /**
   * Get a specific division by ID
   * @param divisionId - The division's ID
   */
  async getDivision(divisionId: number): Promise<Division> {
    const response = await apiClient.get<Division>(
      `/api/v1/divisions/${divisionId}`
    );
    return response.data;
  },
};

// ============================================================================
// Player API (Public - no auth required)
// ============================================================================

export const playerApi = {
  /**
   * Get all players
   * @returns Dictionary of players keyed by player ID
   */
  async getAllPlayers(): Promise<PlayersResponse> {
    const response = await apiClient.get<PlayersResponse>(
      `/api/v1/players`
    );
    return response.data;
  },

  /**
   * Get a specific player by ID
   * @param playerId - The player's ID
   */
  async getPlayer(playerId: number): Promise<Player> {
    const response = await apiClient.get<any>(`/api/v1/players/${playerId}`);

    // Transform backend format to frontend format
    return {
      id: String(playerId),
      name: response.data.name,
      nick: response.data.nick,
      elo: 1500, // Default ELO (backend doesn't return this in player endpoint)
    };
  },
};

// ============================================================================
// Match API
// ============================================================================

export const matchApi = {
  /**
   * Get all open (unplayed) matches across all divisions
   */
  async getOpenMatches(): Promise<OpenMatchesResponse[]> {
    const response = await apiClient.get<OpenMatchesResponse[]>(
      `/api/get_open_matches`
    );
    return response.data;
  },

  /**
   * Create a new quick match
   * @param payload - Match creation details
   */
  async createQuickMatch(
    payload: QuickMatchPayload
  ): Promise<CreateMatchResponse> {
    const response = await apiClient.post<CreateMatchResponse>(
      `/api/create_quick_match`,
      payload
    );
    return response.data;
  },

  /**
   * Submit match results
   * @param payload - Match results with scores
   */
  async setResult(
    payload: MatchResultPayload
  ): Promise<SetResultResponse> {
    const response = await apiClient.post<SetResultResponse>(
      `/api/set_result`,
      payload,
      {
        params: { apiKey: API_KEY },
      }
    );
    return response.data;
  },

  /**
   * Get details for a specific match
   * @param matchId - The match's ID
   */
  async getMatch(matchId: number): Promise<any> {
    const response = await apiClient.get(`/api/v1/matches/${matchId}`);
    return response.data;
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform backend match format to frontend Match interface
 * This handles the differences between how the backend and frontend represent matches
 */
export function transformBackendMatch(backendMatch: any): Match {
  return {
    id: String(backendMatch.id),
    division_id: backendMatch.division_id,
    round: backendMatch.round || 0,
    timestamp: backendMatch.time || new Date().toISOString(),
    yellowTeam: [], // Will be populated from player data
    blackTeam: [], // Will be populated from player data
    yellowScore: backendMatch.scores?.[0]?.[0] || 0,
    blackScore: backendMatch.scores?.[0]?.[1] || 0,
    duration: backendMatch.duration
      ? `${Math.floor(backendMatch.duration / 60)}m ${backendMatch.duration % 60}s`
      : '0m 0s',
    isQuickMatch: backendMatch.quick_match || false,
    mode: backendMatch.mode,
    target_score: backendMatch.target_score,
    win_condition: backendMatch.win_condition,
    played: backendMatch.played || false,
  };
}

/**
 * Health check to verify backend connectivity
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await apiClient.get('/api/health');
    return response.data.ok === true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

// ============================================================================
// Default Export - Organized API Object
// ============================================================================

export default {
  stats: statsApi,
  season: seasonApi,
  player: playerApi,
  match: matchApi,
  healthCheck,
  transformBackendMatch,
};

import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import type { LeaderboardEntry, Player, QuickMatchPayload } from '../types';

// Variables for mock functions - var hoists before the mock callback
var mockGet: any;
var mockPost: any;

// Mock axios with default implementation
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => {
        // Initialize mocks on first call if not already initialized
        mockGet ??= vi.fn();
        mockPost ??= vi.fn();

        return {
          get: mockGet,
          post: mockPost,
          interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
          },
        };
      }),
    },
  };
});

const mockedAxios = axios as any;

// Import after mocking
import { statsApi, playerApi, matchApi, seasonApi, transformBackendMatch, healthCheck } from '../api';

describe('API Client Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('statsApi', () => {
    describe('leaderboard - Happy Path', () => {
      it('should fetch leaderboard with default parameters', async () => {
        // Arrange
        const mockData: LeaderboardEntry[] = [
          {
            player_id: 1,
            name: 'Alice Johnson',
            games: 10,
            wins: 8,
            win_rate: 0.8,
            elo: 1850,
          },
          {
            player_id: 2,
            name: 'Bob Smith',
            games: 8,
            wins: 5,
            win_rate: 0.625,
            elo: 1720,
          },
        ];
        mockGet.mockResolvedValue({ data: mockData });

        // Act
        const result = await statsApi.leaderboard();

        // Assert
        expect(result).toEqual(mockData);
        expect(result).toHaveLength(2);
        expect(result[0].player_id).toBe(1);
        expect(result[0].win_rate).toBe(0.8);
      });

      it('should fetch leaderboard with custom scope and limit', async () => {
        // Arrange
        const mockData: LeaderboardEntry[] = [
          { player_id: 1, name: 'Alice', games: 5, wins: 5, win_rate: 1.0, elo: 2000 },
        ];
        mockGet.mockResolvedValue({ data: mockData });

        // Act
        const result = await statsApi.leaderboard('quick', 10);

        // Assert
        expect(result).toEqual(mockData);
        expect(mockGet).toHaveBeenCalledWith(
          '/api/stats/leaderboard',
          expect.objectContaining({
            params: { scope: 'quick', limit: 10 },
          })
        );
      });
    });
  });

  describe('playerApi', () => {
    describe('getAllPlayers - Happy Path', () => {
      it('should fetch all players successfully', async () => {
        // Arrange
        const mockPlayers: Player[] = [
          { id: 1, name: 'Alice Johnson', nick: 'Alice', elo: 1850 },
          { id: 2, name: 'Bob Smith', nick: 'Bob', elo: 1720 },
        ];
        mockGet.mockResolvedValue({ data: mockPlayers });

        // Act
        const result = await playerApi.getAllPlayers();

        // Assert
        expect(result).toEqual(mockPlayers);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Alice Johnson');
      });

      it('should return empty array when no players exist', async () => {
        // Arrange
        mockGet.mockResolvedValue({ data: [] });

        // Act
        const result = await playerApi.getAllPlayers();

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('matchApi', () => {
    describe('getOpenMatches - Happy Path', () => {
      it('should fetch open matches successfully', async () => {
        // Arrange
        const mockMatches = [
          {
            division_id: 1,
            name: 'Premier League',
            matches: [
              {
                id: 42,
                division_id: 1,
                round: 3,
                player_ids: [1, 2, 3, 4],
                players: ['Alice', 'Bob', 'Carol', 'Dave'],
                mode: 'doubles',
                quick_match: true,
                teams: {
                  yellow: { ids: [1, 2], names: ['Alice', 'Bob'] },
                  black: { ids: [3, 4], names: ['Carol', 'Dave'] },
                },
                target_score: 10,
                submatches: [],
                win_condition: 'score_limit',
                played: false,
              },
            ],
          },
        ];
        mockGet.mockResolvedValue({ data: mockMatches });

        // Act
        const result = await matchApi.getOpenMatches();

        // Assert
        expect(result).toEqual(mockMatches);
        expect(result).toHaveLength(1);
        expect(result[0].matches).toHaveLength(1);
        expect(mockGet).toHaveBeenCalledWith('/api/get_open_matches');
      });

      it('should return empty array when no open matches', async () => {
        // Arrange
        mockGet.mockResolvedValue({ data: [] });

        // Act
        const result = await matchApi.getOpenMatches();

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe('createQuickMatch - Happy Path', () => {
      it('should create a quick match successfully', async () => {
        // Arrange
        const payload: QuickMatchPayload = {
          division_id: 1,
          player_ids: [1, 2, 3, 4],
          mode: 'doubles',
          win_condition: 'score_limit',
          target_score: 10,
        };
        const mockResponse = { success: true, match_id: 42 };
        mockPost.mockResolvedValue({ data: mockResponse });

        // Act
        const result = await matchApi.createQuickMatch(payload);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockPost).toHaveBeenCalledWith(
          '/api/create_quick_match',
          payload
        );
      });
    });

    describe('setResult - Happy Path', () => {
      it('should submit match results successfully', async () => {
        // Arrange
        const payload = {
          id: 42,
          results: [[10, 6]],
          start: 1699891200,
          end: 1699891500,
        };
        const mockResponse = { result: 'Match result correctly processed' };
        mockPost.mockResolvedValue({ data: mockResponse });

        // Act
        const result = await matchApi.setResult(payload);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockPost).toHaveBeenCalledWith(
          '/api/set_result',
          payload,
          expect.objectContaining({
            params: expect.objectContaining({
              apiKey: expect.any(String),
            }),
          })
        );
      });
    });
  });

  describe('seasonApi', () => {
    describe('getAllSeasons - Happy Path', () => {
      it('should fetch all seasons successfully', async () => {
        // Arrange
        const mockSeasons = [
          { id: 1, name: 'Season 1', start_date: '2024-01-01', end_date: '2024-06-30' },
          { id: 2, name: 'Season 2', start_date: '2024-07-01', end_date: '2024-12-31' },
        ];
        mockGet.mockResolvedValue({ data: mockSeasons });

        // Act
        const result = await seasonApi.getAllSeasons();

        // Assert
        expect(result).toEqual(mockSeasons);
        expect(result).toHaveLength(2);
        expect(mockGet).toHaveBeenCalledWith('/api/v1/seasons');
      });
    });

    describe('getCurrentSeason - Happy Path', () => {
      it('should fetch current season successfully', async () => {
        // Arrange
        const mockSeason = { id: 2, name: 'Current Season', start_date: '2024-07-01', end_date: '2024-12-31' };
        mockGet.mockResolvedValue({ data: mockSeason });

        // Act
        const result = await seasonApi.getCurrentSeason();

        // Assert
        expect(result).toEqual(mockSeason);
        expect(mockGet).toHaveBeenCalledWith('/api/v1/seasons/current');
      });
    });

    describe('getSeason - Happy Path', () => {
      it('should fetch specific season by ID', async () => {
        // Arrange
        const mockSeason = { id: 1, name: 'Season 1', start_date: '2024-01-01', end_date: '2024-06-30' };
        mockGet.mockResolvedValue({ data: mockSeason });

        // Act
        const result = await seasonApi.getSeason(1);

        // Assert
        expect(result).toEqual(mockSeason);
        expect(mockGet).toHaveBeenCalledWith('/api/v1/seasons/1');
      });
    });

    describe('getDivision - Happy Path', () => {
      it('should fetch specific division by ID', async () => {
        // Arrange
        const mockDivision = { id: 1, name: 'Premier League', season_id: 2 };
        mockGet.mockResolvedValue({ data: mockDivision });

        // Act
        const result = await seasonApi.getDivision(1);

        // Assert
        expect(result).toEqual(mockDivision);
        expect(mockGet).toHaveBeenCalledWith('/api/v1/divisions/1');
      });
    });
  });

  describe('statsApi - Additional Methods', () => {
    describe('playerDetail - Happy Path', () => {
      it('should fetch player detailed stats', async () => {
        // Arrange
        const mockStats = {
          player_id: 1,
          name: 'Alice Johnson',
          games: 60,
          wins: 42,
          losses: 18,
          win_rate: 0.7,
          elo: 1850,
          avg_goals_for: 8.5,
          avg_goals_against: 6.2,
        };
        mockGet.mockResolvedValue({ data: mockStats });

        // Act
        const result = await statsApi.playerDetail(1, 'all');

        // Assert
        expect(result).toEqual(mockStats);
        expect(mockGet).toHaveBeenCalledWith(
          '/api/stats/players/1',
          expect.objectContaining({
            params: { scope: 'all' },
          })
        );
      });

      it('should fetch player stats with quick scope', async () => {
        // Arrange
        const mockStats = {
          player_id: 1,
          name: 'Alice Johnson',
          games: 30,
          wins: 20,
          win_rate: 0.67,
          elo: 1850,
        };
        mockGet.mockResolvedValue({ data: mockStats });

        // Act
        const result = await statsApi.playerDetail(1, 'quick');

        // Assert
        expect(result).toEqual(mockStats);
        expect(mockGet).toHaveBeenCalledWith(
          '/api/stats/players/1',
          expect.objectContaining({
            params: { scope: 'quick' },
          })
        );
      });
    });

    describe('h2h - Happy Path', () => {
      it('should fetch head-to-head statistics', async () => {
        // Arrange
        const mockH2H = {
          player_a: { id: 1, name: 'Alice Johnson', wins: 5 },
          player_b: { id: 2, name: 'Bob Smith', wins: 3 },
          total_matches: 8,
        };
        mockGet.mockResolvedValue({ data: mockH2H });

        // Act
        const result = await statsApi.h2h(1, 2);

        // Assert
        expect(result).toEqual(mockH2H);
        expect(mockGet).toHaveBeenCalledWith(
          '/api/stats/h2h',
          expect.objectContaining({
            params: { a: 1, b: 2 },
          })
        );
      });
    });

    describe('partnerships - Happy Path', () => {
      it('should fetch partnership statistics', async () => {
        // Arrange
        const mockPartnerships = [
          { partner_id: 2, partner_name: 'Bob Smith', games: 15, wins: 12, win_rate: 0.8 },
          { partner_id: 3, partner_name: 'Carol Davis', games: 10, wins: 6, win_rate: 0.6 },
        ];
        mockGet.mockResolvedValue({ data: mockPartnerships });

        // Act
        const result = await statsApi.partnerships(1, 10, 'all');

        // Assert
        expect(result).toEqual(mockPartnerships);
        expect(result).toHaveLength(2);
        expect(mockGet).toHaveBeenCalledWith(
          '/api/stats/partnerships/1',
          expect.objectContaining({
            params: { limit: 10, scope: 'all' },
          })
        );
      });

      it('should use default parameters', async () => {
        // Arrange
        const mockPartnerships = [];
        mockGet.mockResolvedValue({ data: mockPartnerships });

        // Act
        const result = await statsApi.partnerships(1);

        // Assert
        expect(result).toEqual(mockPartnerships);
        expect(mockGet).toHaveBeenCalledWith(
          '/api/stats/partnerships/1',
          expect.objectContaining({
            params: { limit: 10, scope: 'all' },
          })
        );
      });
    });
  });

  describe('playerApi - Additional Methods', () => {
    describe('getPlayer - Happy Path', () => {
      it('should fetch specific player by ID', async () => {
        // Arrange
        const mockBackendPlayer = {
          name: 'Alice Johnson',
          nick: 'Alice',
        };
        mockGet.mockResolvedValue({ data: mockBackendPlayer });

        // Act
        const result = await playerApi.getPlayer(1);

        // Assert
        expect(result).toEqual({
          id: '1',
          name: 'Alice Johnson',
          nick: 'Alice',
          elo: 1500,
        });
        expect(mockGet).toHaveBeenCalledWith('/api/v1/players/1');
      });
    });
  });

  describe('matchApi - Additional Methods', () => {
    describe('getMatch - Happy Path', () => {
      it('should fetch specific match by ID', async () => {
        // Arrange
        const mockMatch = {
          id: 42,
          division_id: 1,
          round: 3,
          players: [1, 2, 3, 4],
          scores: [[10, 6]],
          played: true,
        };
        mockGet.mockResolvedValue({ data: mockMatch });

        // Act
        const result = await matchApi.getMatch(42);

        // Assert
        expect(result).toEqual(mockMatch);
        expect(mockGet).toHaveBeenCalledWith('/api/v1/matches/42');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockGet.mockRejectedValue(networkError);

      // Act & Assert
      await expect(statsApi.leaderboard()).rejects.toThrow('Network Error');
    });

    it('should handle API errors with proper error messages', async () => {
      // Arrange
      const apiError = {
        response: {
          status: 404,
          data: { error: 'Resource not found' },
        },
      };
      mockGet.mockRejectedValue(apiError);

      // Act & Assert
      await expect(playerApi.getAllPlayers()).rejects.toEqual(apiError);
    });
  });

  describe('Helper Functions', () => {
    describe('transformBackendMatch', () => {
      it('should transform backend match format to frontend format', () => {
        // Arrange
        const backendMatch = {
          id: 42,
          division_id: 1,
          round: 3,
          time: '2024-01-15T10:30:00Z',
          scores: [[10, 6]],
          duration: 305, // 5 minutes 5 seconds
          quick_match: true,
          mode: 'doubles',
          target_score: 10,
          win_condition: 'score_limit',
          played: true,
        };

        // Act
        const result = transformBackendMatch(backendMatch);

        // Assert
        expect(result).toEqual({
          id: '42',
          division_id: 1,
          round: 3,
          timestamp: '2024-01-15T10:30:00Z',
          yellowTeam: [],
          blackTeam: [],
          yellowScore: 10,
          blackScore: 6,
          duration: '5m 5s',
          isQuickMatch: true,
          mode: 'doubles',
          target_score: 10,
          win_condition: 'score_limit',
          played: true,
        });
      });

      it('should handle match without optional fields', () => {
        // Arrange
        const backendMatch = {
          id: 50,
          division_id: 2,
          mode: 'singles',
        };

        // Act
        const result = transformBackendMatch(backendMatch);

        // Assert
        expect(result.id).toBe('50');
        expect(result.division_id).toBe(2);
        expect(result.round).toBe(0);
        expect(result.yellowScore).toBe(0);
        expect(result.blackScore).toBe(0);
        expect(result.duration).toBe('0m 0s');
        expect(result.isQuickMatch).toBe(false);
        expect(result.played).toBe(false);
      });

      it('should handle match with multiple scores', () => {
        // Arrange
        const backendMatch = {
          id: 60,
          division_id: 1,
          scores: [[10, 8], [9, 10], [10, 7]],
        };

        // Act
        const result = transformBackendMatch(backendMatch);

        // Assert
        expect(result.yellowScore).toBe(10); // First submatch score
        expect(result.blackScore).toBe(8);
      });
    });

    describe('healthCheck', () => {
      it('should return true when backend is healthy', async () => {
        // Arrange
        mockGet.mockResolvedValue({ data: { ok: true } });

        // Act
        const result = await healthCheck();

        // Assert
        expect(result).toBe(true);
        expect(mockGet).toHaveBeenCalledWith('/api/health');
      });

      it('should return false when backend is unhealthy', async () => {
        // Arrange
        mockGet.mockResolvedValue({ data: { ok: false } });

        // Act
        const result = await healthCheck();

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when health check fails', async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockGet.mockRejectedValue(new Error('Network error'));

        // Act
        const result = await healthCheck();

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Health check failed:', expect.any(Error));

        // Cleanup
        consoleErrorSpy.mockRestore();
      });
    });
  });
});

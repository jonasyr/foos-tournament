import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { statsApi, playerApi, matchApi, seasonApi } from '../api';
import type { LeaderboardEntry, Player, QuickMatchPayload } from '../types';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

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
        mockedAxios.create.mockReturnValue({
          get: vi.fn().mockResolvedValue({ data: mockData }),
          post: vi.fn(),
          interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
          },
        });

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
        const mockGet = vi.fn().mockResolvedValue({ data: mockData });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
          post: vi.fn(),
          interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
          },
        });

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
        mockedAxios.create.mockReturnValue({
          get: vi.fn().mockResolvedValue({ data: mockPlayers }),
          post: vi.fn(),
          interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
          },
        });

        // Act
        const result = await playerApi.getAllPlayers();

        // Assert
        expect(result).toEqual(mockPlayers);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Alice Johnson');
      });

      it('should return empty array when no players exist', async () => {
        // Arrange
        mockedAxios.create.mockReturnValue({
          get: vi.fn().mockResolvedValue({ data: [] }),
          post: vi.fn(),
          interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
          },
        });

        // Act
        const result = await playerApi.getAllPlayers();

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('matchApi', () => {
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
        const mockPost = vi.fn().mockResolvedValue({ data: mockResponse });
        mockedAxios.create.mockReturnValue({
          get: vi.fn(),
          post: mockPost,
          interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
          },
        });

        // Act
        const result = await matchApi.createQuickMatch(payload);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockPost).toHaveBeenCalledWith(
          '/api/create_quick_match',
          payload,
          expect.any(Object)
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
        const mockPost = vi.fn().mockResolvedValue({ data: mockResponse });
        mockedAxios.create.mockReturnValue({
          get: vi.fn(),
          post: mockPost,
          interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
          },
        });

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

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockRejectedValue(networkError),
        post: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });

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
      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockRejectedValue(apiError),
        post: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });

      // Act & Assert
      await expect(playerApi.getAllPlayers()).rejects.toEqual(apiError);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsHub } from '../StatsHub';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api');
const mockedApi = api as any;

describe('StatsHub Component', () => {
  const mockLeaderboard = [
    {
      player_id: 1,
      name: 'Alice Johnson',
      games: 60,
      wins: 42,
      win_rate: 0.7,
      elo: 1850,
    },
    {
      player_id: 2,
      name: 'Bob Smith',
      games: 55,
      wins: 33,
      win_rate: 0.6,
      elo: 1720,
    },
    {
      player_id: 3,
      name: 'Carol Davis',
      games: 50,
      wins: 25,
      win_rate: 0.5,
      elo: 1680,
    },
    {
      player_id: 4,
      name: 'Dave Wilson',
      games: 45,
      wins: 18,
      win_rate: 0.4,
      elo: 1550,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.statsApi = {
      leaderboard: vi.fn().mockResolvedValue(mockLeaderboard),
    };
  });

  describe('Initial Load - Happy Path', () => {
    it('should render loading state initially', () => {
      // Arrange
      mockedApi.statsApi.leaderboard = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLeaderboard), 100))
      );

      // Act
      render(<StatsHub />);

      // Assert
      expect(screen.getByText(/loading statistics/i)).toBeInTheDocument();
    });

    it('should load and display leaderboard successfully', async () => {
      // Arrange & Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      expect(mockedApi.statsApi.leaderboard).toHaveBeenCalledWith('all', 50);
    });

    it('should display top 10 players', async () => {
      // Arrange
      const manyPlayers = Array.from({ length: 15 }, (_, i) => ({
        player_id: i + 1,
        name: `Player ${i + 1}`,
        games: 50 - i,
        wins: 30 - i,
        win_rate: 0.6,
        elo: 1800 - i * 10,
      }));
      mockedApi.statsApi.leaderboard = vi.fn().mockResolvedValue(manyPlayers);

      // Act
      render(<StatsHub />);

      // Assert - Should display first 10
      await waitFor(() => {
        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('Player 10')).toBeInTheDocument();
      });

      // Player 11+ should not be in the main leaderboard
      expect(screen.queryByText('Player 11')).not.toBeInTheDocument();
    });

    it('should display player stats (games, wins, win rate, ELO)', async () => {
      // Arrange & Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      expect(screen.getByText(/60.*games/i)).toBeInTheDocument();
      expect(screen.getByText(/42.*wins/i)).toBeInTheDocument();
      expect(screen.getByText(/70%|0.7/i)).toBeInTheDocument();
      expect(screen.getByText(/1850/i)).toBeInTheDocument();
    });
  });

  describe('Scope Filter - Happy Path', () => {
    it('should have scope filter dropdown', async () => {
      // Arrange & Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should load data with selected scope', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<StatsHub />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Act - Change scope
      const dropdown = screen.getByRole('combobox');
      await user.click(dropdown);

      const quickOption = screen.getByText('Quick Matches Only');
      await user.click(quickOption);

      // Assert - Should call API with new scope
      await waitFor(() => {
        expect(mockedApi.statsApi.leaderboard).toHaveBeenCalledWith('quick', 50);
      });
    });

    it('should reload leaderboard when scope changes', async () => {
      // Arrange
      const quickLeaderboard = [
        {
          player_id: 5,
          name: 'Eve Taylor',
          games: 30,
          wins: 20,
          win_rate: 0.67,
          elo: 1700,
        },
      ];

      mockedApi.statsApi.leaderboard = vi.fn().mockResolvedValue(mockLeaderboard);

      const user = userEvent.setup();
      render(<StatsHub />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Act - Change to quick scope
      mockedApi.statsApi.leaderboard = vi.fn().mockResolvedValue(quickLeaderboard);

      const dropdown = screen.getByRole('combobox');
      await user.click(dropdown);
      const quickOption = screen.getByText('Quick Matches Only');
      await user.click(quickOption);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Eve Taylor')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality - Happy Path', () => {
    it('should have search input field', async () => {
      // Arrange & Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search players/i)).toBeInTheDocument();
      });
    });

    it('should filter players by search term', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<StatsHub />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Act - Search for "alice"
      const searchInput = screen.getByPlaceholderText(/search players/i);
      await user.type(searchInput, 'alice');

      // Assert - Only Alice should be visible
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });

    it('should be case-insensitive in search', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<StatsHub />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Act - Search with uppercase
      const searchInput = screen.getByPlaceholderText(/search players/i);
      await user.type(searchInput, 'ALICE');

      // Assert
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should show no results when search has no match', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<StatsHub />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Act - Search for non-existent player
      const searchInput = screen.getByPlaceholderText(/search players/i);
      await user.type(searchInput, 'NonExistentPlayer');

      // Assert - No players should be visible
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });

    it('should clear filter when search is cleared', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<StatsHub />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search players/i);

      // Act - Search then clear
      await user.type(searchInput, 'alice');
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();

      await user.clear(searchInput);

      // Assert - All players visible again
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });
  });

  describe('Hot Streak Section - Happy Path', () => {
    it('should display hot streak players with >50% win rate', async () => {
      // Arrange & Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/hot streak/i)).toBeInTheDocument();
      });

      // Players with >50% win rate should be shown
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('should limit hot streak to top 3 players', async () => {
      // Arrange
      const manyGoodPlayers = Array.from({ length: 5 }, (_, i) => ({
        player_id: i + 1,
        name: `Good Player ${i + 1}`,
        games: 20,
        wins: 15,
        win_rate: 0.75,
        elo: 1800 - i * 10,
      }));
      mockedApi.statsApi.leaderboard = vi.fn().mockResolvedValue(manyGoodPlayers);

      // Act
      render(<StatsHub />);

      // Assert - Only top 3 in hot streak section
      await waitFor(() => {
        const hotStreakSection = screen.getByText(/hot streak/i).closest('section');
        const playerCards = hotStreakSection?.querySelectorAll('[data-player]') || [];
        expect(playerCards.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Medal Display - Happy Path', () => {
    it('should display gold medal for 1st place', async () => {
      // Arrange & Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('🥇')).toBeInTheDocument();
      });
    });

    it('should display silver medal for 2nd place', async () => {
      // Arrange & Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('🥈')).toBeInTheDocument();
      });
    });

    it('should display bronze medal for 3rd place', async () => {
      // Arrange & Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('🥉')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      // Arrange
      const error = new Error('API Error');
      mockedApi.statsApi.leaderboard = vi.fn().mockRejectedValue(error);

      // Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      const error = new Error('API Error');
      mockedApi.statsApi.leaderboard = vi.fn().mockRejectedValue(error);

      // Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button clicked', async () => {
      // Arrange
      const error = new Error('API Error');
      mockedApi.statsApi.leaderboard = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockLeaderboard);

      const user = userEvent.setup();
      render(<StatsHub />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByRole('button', { name: /retry/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should handle empty leaderboard gracefully', async () => {
      // Arrange
      mockedApi.statsApi.leaderboard = vi.fn().mockResolvedValue([]);

      // Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/no players/i)).toBeInTheDocument();
      });
    });
  });

  describe('Player Initials', () => {
    it('should display player initials in avatar', async () => {
      // Arrange & Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('AJ')).toBeInTheDocument(); // Alice Johnson
        expect(screen.getByText('BS')).toBeInTheDocument(); // Bob Smith
      });
    });

    it('should handle single name players', async () => {
      // Arrange
      const singleNamePlayer = [
        {
          player_id: 1,
          name: 'Madonna',
          games: 30,
          wins: 20,
          win_rate: 0.67,
          elo: 1700,
        },
      ];
      mockedApi.statsApi.leaderboard = vi.fn().mockResolvedValue(singleNamePlayer);

      // Act
      render(<StatsHub />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('M')).toBeInTheDocument();
      });
    });
  });
});

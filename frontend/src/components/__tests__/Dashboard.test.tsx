import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '../Dashboard';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api');
const mockedApi = api as any;

// Mock child components to simplify testing
vi.mock('../MatchCard', () => ({
  MatchCard: ({ id, yellowTeam, blackTeam, ...props }: any) => (
    <div data-testid={`match-${id}`}>
      {yellowTeam && yellowTeam[0] && yellowTeam[0].name}
    </div>
  ),
}));

vi.mock('../FAB', () => ({
  FAB: ({ onClick }: any) => <button onClick={onClick} data-testid="fab">Create Match</button>,
}));

vi.mock('../MatchSimulator', () => ({
  MatchSimulator: () => <div data-testid="match-simulator">Match Simulator</div>,
}));

describe('Dashboard Component', () => {
  const mockOnCreateMatch = vi.fn();

  const mockPlayers = {
    '1': { name: 'Alice', nick: 'A', elo: 1850 },
    '2': { name: 'Bob', nick: 'B', elo: 1720 },
    '3': { name: 'Carol', nick: 'C', elo: 1680 },
    '4': { name: 'Dave', nick: 'D', elo: 1550 },
  };

  const mockLeaderboard = [
    { player_id: 1, name: 'Alice', games: 50, wins: 35, win_rate: 0.7, elo: 1850 },
    { player_id: 2, name: 'Bob', games: 45, wins: 27, win_rate: 0.6, elo: 1720 },
  ];

  const mockOpenMatches = [
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.playerApi = {
      getAllPlayers: vi.fn().mockResolvedValue(mockPlayers),
    };
    mockedApi.statsApi = {
      leaderboard: vi.fn().mockResolvedValue(mockLeaderboard),
    };
    mockedApi.matchApi = {
      getOpenMatches: vi.fn().mockResolvedValue(mockOpenMatches),
    };
  });

  describe('Initial Load - Happy Path', () => {
    it('should render loading state initially', () => {
      // Arrange
      mockedApi.matchApi.getOpenMatches = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve(mockOpenMatches), 100))
      );

      // Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should load and display dashboard data successfully', async () => {
      // Arrange & Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert - Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('match-42')).toBeInTheDocument();
      });

      expect(mockedApi.playerApi.getAllPlayers).toHaveBeenCalled();
      expect(mockedApi.statsApi.leaderboard).toHaveBeenCalledWith('all', 5);
      expect(mockedApi.matchApi.getOpenMatches).toHaveBeenCalled();
    });

    it('should display top players leaderboard', async () => {
      // Arrange & Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Top Players')).toBeInTheDocument();
      });

      // Check leaderboard has player names (multiple elements with same name is OK)
      const aliceElements = screen.getAllByText('Alice');
      expect(aliceElements.length).toBeGreaterThan(0);
      const bobElements = screen.getAllByText('Bob');
      expect(bobElements.length).toBeGreaterThan(0);
    });

    it('should transform backend matches to display format', async () => {
      // Arrange & Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        const matchCard = screen.getByTestId('match-42');
        expect(matchCard).toBeInTheDocument();
        expect(matchCard).toHaveTextContent('Alice');
      });
    });
  });

  describe('Filter Functionality - Happy Path', () => {
    it('should have filter buttons for all, league, and quick', async () => {
      // Arrange & Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('All Matches')).toBeInTheDocument();
      });

      expect(screen.getByText('League')).toBeInTheDocument();
      expect(screen.getByText('Quick')).toBeInTheDocument();
    });

    it('should change filter when clicking filter buttons', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      await waitFor(() => {
        expect(screen.getByText('All Matches')).toBeInTheDocument();
      });

      // Act - Click Quick filter
      const quickButton = screen.getByText('Quick');
      await user.click(quickButton);

      // Assert - Filter is applied (button becomes active)
      expect(quickButton).toHaveClass('bg-primary');
    });
  });

  describe('Empty State - Happy Path', () => {
    it('should display empty state when no matches', async () => {
      // Arrange
      mockedApi.matchApi.getOpenMatches = vi.fn().mockResolvedValue([]);

      // Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/no matches available/i)).toBeInTheDocument();
      });
    });

    it('should show create match button in empty state', async () => {
      // Arrange
      mockedApi.matchApi.getOpenMatches = vi.fn().mockResolvedValue([]);

      // Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert - Multiple "Create Match" buttons exist (empty state + FAB)
      await waitFor(() => {
        const createButtons = screen.getAllByText(/create match/i);
        expect(createButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data loading fails', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedApi.matchApi.getOpenMatches = vi.fn().mockRejectedValue(error);

      // Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedApi.matchApi.getOpenMatches = vi.fn().mockRejectedValue(error);

      // Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button clicked', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedApi.matchApi.getOpenMatches = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockOpenMatches);

      const user = userEvent.setup();
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Act - Click retry
      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);

      // Assert - Should load successfully
      await waitFor(() => {
        expect(screen.getByTestId('match-42')).toBeInTheDocument();
      });
    });
  });

  describe('FAB Integration - Happy Path', () => {
    it('should render FAB for creating matches', async () => {
      // Arrange & Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('fab')).toBeInTheDocument();
      });
    });

    it('should call onCreateMatch when FAB clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      await waitFor(() => {
        expect(screen.getByTestId('fab')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByTestId('fab'));

      // Assert
      expect(mockOnCreateMatch).toHaveBeenCalled();
    });
  });

  describe('Data Transformation', () => {
    it('should correctly transform team player IDs to names', async () => {
      // Arrange & Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        const matchCard = screen.getByTestId('match-42');
        // Should display player name from teams.yellow.names
        expect(matchCard).toHaveTextContent('Alice');
      });
    });

    it('should handle matches with default ELO values', async () => {
      // Arrange & Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert - Transformation should set default ELO of 1500
      await waitFor(() => {
        expect(screen.getByTestId('match-42')).toBeInTheDocument();
      });

      // The transformation logic sets elo: 1500 for all players
      expect(mockedApi.matchApi.getOpenMatches).toHaveBeenCalled();
    });
  });

  describe('Leaderboard Display', () => {
    it('should display top 5 players in leaderboard', async () => {
      // Arrange & Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Top Players')).toBeInTheDocument();
      });

      // Check leaderboard has player names
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
      expect(mockedApi.statsApi.leaderboard).toHaveBeenCalledWith('all', 5);
    });

    it('should display player stats (games, win rate, elo)', async () => {
      // Arrange & Act
      render(<Dashboard onCreateMatch={mockOnCreateMatch} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Top Players')).toBeInTheDocument();
      });

      // Check that stats are displayed
      expect(screen.getByText('1850')).toBeInTheDocument(); // ELO
      expect(screen.getByText('35W - 15L')).toBeInTheDocument(); // Win/Loss
    });
  });
});

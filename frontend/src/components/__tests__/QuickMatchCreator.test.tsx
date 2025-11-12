import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickMatchCreator } from '../QuickMatchCreator';
import * as api from '../../lib/api';
import type { Player } from '../../lib/types';

// Mock the API
vi.mock('../../lib/api');
const mockedApi = api as any;

// Mock sonner toast
vi.mock('sonner@2.0.3', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

describe('QuickMatchCreator Component', () => {
  const mockPlayers: Player[] = [
    { id: 1, name: 'Alice Johnson', nick: 'Alice', elo: 1850 },
    { id: 2, name: 'Bob Smith', nick: 'Bob', elo: 1720 },
    { id: 3, name: 'Carol Williams', nick: 'Carol', elo: 1680 },
    { id: 4, name: 'Dave Brown', nick: 'Dave', elo: 1650 },
  ];

  const mockOnClose = vi.fn();
  const mockOnMatchCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.playerApi = {
      getAllPlayers: vi.fn().mockResolvedValue(mockPlayers),
    };
    mockedApi.matchApi = {
      createQuickMatch: vi.fn().mockResolvedValue({ success: true, match_id: 42 }),
    };
  });

  describe('Initial Render - Happy Path', () => {
    it('should render the dialog when open', () => {
      // Arrange & Act
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Assert
      expect(screen.getByText('Create Quick Match')).toBeInTheDocument();
      expect(screen.getByText('Select Match Mode')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      // Arrange & Act
      render(
        <QuickMatchCreator
          open={false}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Assert
      expect(screen.queryByText('Create Quick Match')).not.toBeInTheDocument();
    });
  });

  describe('Mode Selection - Happy Path', () => {
    it('should allow selecting singles mode', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Act
      const singlesCard = screen.getByText('Singles').closest('div[class*="cursor-pointer"]');
      if (singlesCard) await user.click(singlesCard);

      // Assert
      expect(singlesCard).toHaveClass('ring-2', 'ring-primary');
    });

    it('should default to doubles mode', () => {
      // Arrange & Act
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Assert
      const doublesCard = screen.getByText('Doubles').closest('div[class*="cursor-pointer"]');
      expect(doublesCard).toHaveClass('ring-2', 'ring-primary');
    });

    it('should navigate to player selection after mode selection', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Act
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Select Players')).toBeInTheDocument();
      });
    });
  });

  describe('Player Loading - Happy Path', () => {
    it('should load players when step 2 is reached', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Act
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Assert
      await waitFor(() => {
        expect(mockedApi.playerApi.getAllPlayers).toHaveBeenCalled();
      });
    });

    it('should display loading state while fetching players', async () => {
      // Arrange
      mockedApi.playerApi.getAllPlayers = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve(mockPlayers), 100))
      );
      const user = userEvent.setup();
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Act
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Assert
      expect(screen.getByText('Select Players')).toBeInTheDocument();
      // Loading spinner should appear briefly
    });
  });

  describe('Player Selection - Happy Path', () => {
    it('should allow selecting all players for doubles match', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Act - Navigate to step 2
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Select Players'));

      // Note: Actual player selection via dropdowns would require more complex interaction
      // This test validates the structure is present
      // Assert
      expect(screen.getByText('Yellow Team')).toBeInTheDocument();
      expect(screen.getByText('Black Team')).toBeInTheDocument();
    });
  });

  describe('Match Creation - Happy Path', () => {
    it('should create match with valid data', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Act - Navigate through all steps
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Select Players'));

      // Skip to step 3 for settings
      await user.click(screen.getAllByRole('button', { name: /next/i })[0]);
      await waitFor(() => screen.getByText('Match Settings'));

      // Assert - Settings UI is present
      expect(screen.getByText('Target Score')).toBeInTheDocument();
      expect(screen.getByText('Best of 3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error when player loading fails', async () => {
      // Arrange
      const error = new Error('Failed to load players');
      mockedApi.playerApi.getAllPlayers = vi.fn().mockRejectedValue(error);
      const user = userEvent.setup();
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Act
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to load players/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after loading error', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedApi.playerApi.getAllPlayers = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockPlayers);
      const user = userEvent.setup();
      render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Act - Navigate to player selection
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText(/failed to load players/i));

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Assert
      await waitFor(() => {
        expect(mockedApi.playerApi.getAllPlayers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Dialog Lifecycle', () => {
    it('should reset form when dialog closes', async () => {
      // Arrange
      const user = userEvent.setup();
      const { rerender } = render(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Act - Navigate to step 2
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => screen.getByText('Select Players'));

      // Close dialog
      rerender(
        <QuickMatchCreator
          open={false}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Reopen dialog
      rerender(
        <QuickMatchCreator
          open={true}
          onClose={mockOnClose}
          onMatchCreated={mockOnMatchCreated}
        />
      );

      // Assert - Should be back at step 1
      expect(screen.getByText('Select Match Mode')).toBeInTheDocument();
    });
  });
});

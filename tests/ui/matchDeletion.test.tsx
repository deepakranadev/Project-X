/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, renderHook, act, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";

// vi.mock must be at module level; Vitest hoists it so toast is always the mock
vi.mock("sonner", () => ({
  toast: vi.fn(),
  Toaster: () => null,
}));

import { toast } from "sonner";
import { MatchManagement } from "@/features/matches/components/MatchManagement";
import { useMatchManagement } from "@/features/matches/useMatchManagement";
import type { MatchFeatureDependencies } from "@/features/matches/matchFeatureDependencies";
import type { TournamentMatch } from "@/domain/matches/types";

const mockMatch: TournamentMatch = {
  id: "m1",
  tournamentId: "t1",
  matchNumber: 1,
  status: "DRAFT",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("Match Delete Interaction Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("opening and cancelling the AlertDialog performs zero mutations", async () => {
    const mockRepos = {
      matches: {
        listMatchesByTournament: vi.fn().mockResolvedValue([mockMatch]),
        deleteMatch: vi.fn(),
      },
    } as unknown as MatchFeatureDependencies;

    render(
      <MatchManagement
        tournamentId="t1"
        teams={[]}
        repositories={mockRepos}
        onMatchesChanged={vi.fn()}
      />
    );

    // Wait for matches to load
    const deleteTrigger = await screen.findByRole("button", { name: "Delete Match 1" });

    // Open
    fireEvent.click(deleteTrigger);

    const confirmDialog = await screen.findByRole("alertdialog");
    expect(confirmDialog).toBeTruthy();

    expect(mockRepos.matches.deleteMatch).not.toHaveBeenCalled();

    // Cancel
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    expect(mockRepos.matches.deleteMatch).not.toHaveBeenCalled();
    // No toast emitted on open/cancel
    expect(toast).not.toHaveBeenCalled();
  });

  it("confirming deletion performs exactly one mutation and emits exactly one success toast", async () => {
    const mockRepos = {
      matches: {
        listMatchesByTournament: vi.fn().mockResolvedValue([mockMatch]),
        deleteMatch: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as MatchFeatureDependencies;

    render(
      <MatchManagement
        tournamentId="t1"
        teams={[]}
        repositories={mockRepos}
        onMatchesChanged={vi.fn()}
      />
    );

    const deleteTrigger = await screen.findByRole("button", { name: "Delete Match 1" });
    fireEvent.click(deleteTrigger);

    const confirmBtn = await screen.findByRole("button", { name: "Delete Match" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRepos.matches.deleteMatch).toHaveBeenCalledTimes(1);
    });

    // Exactly ONE success toast
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith("Match 1 and its results were deleted.");
  });

  it("failed deletion surfaces persistent inline error and emits ZERO toasts", async () => {
    const mockRepos = {
      matches: {
        listMatchesByTournament: vi.fn().mockResolvedValue([mockMatch]),
        deleteMatch: vi.fn().mockRejectedValue(new Error("Fail")),
      },
    } as unknown as MatchFeatureDependencies;

    render(
      <MatchManagement
        tournamentId="t1"
        teams={[]}
        repositories={mockRepos}
        onMatchesChanged={vi.fn()}
      />
    );

    const deleteTrigger = await screen.findByRole("button", { name: "Delete Match 1" });
    fireEvent.click(deleteTrigger);

    const confirmBtn = await screen.findByRole("button", { name: "Delete Match" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRepos.matches.deleteMatch).toHaveBeenCalledTimes(1);
    });

    // Persistent inline error surfaced
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("The match could not be deleted. Try again.");

    // ZERO toasts on failure
    expect(toast).not.toHaveBeenCalled();
  });

  it("rapid double invocation relies on synchronous lock (useRef), performing exactly ONE underlying mutation", async () => {
    // We mock the deletion to take 50ms so we can fire two rapid calls before resolution.
    const deleteMock = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 50))
    );

    const mockRepos = {
      matches: {
        listMatchesByTournament: vi.fn().mockResolvedValue([mockMatch]),
        deleteMatch: deleteMock,
      },
    } as unknown as MatchFeatureDependencies;

    const { result } = renderHook(() => useMatchManagement("t1", [], mockRepos, vi.fn()));

    await waitFor(() => {
      expect(result.current.matches.length).toBe(1);
    });

    // Fire twice synchronously (without waiting for state updates)
    act(() => {
      result.current.deleteMatch(mockMatch);
      result.current.deleteMatch(mockMatch);
    });

    // Wait for the single-flight promise to finish
    await waitFor(() => {
      expect(result.current.isDeletingMatch).toBe(false);
    });

    // Only one should have passed the useRef lock
    expect(deleteMock).toHaveBeenCalledTimes(1);
    // Exactly ONE toast for the single successful deletion
    expect(toast).toHaveBeenCalledTimes(1);
  });
});

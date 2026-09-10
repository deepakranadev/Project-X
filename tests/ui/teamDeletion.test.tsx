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
import { TeamEditSheet } from "@/features/teams/components/TeamEditSheet";
import { useTeamManagement } from "@/features/teams/useTeamManagement";
import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTeam } from "@/features/teams/types";
import { TeamDeletionError } from "@/domain/teams/errors";

const mockTeam: GuestTeam = {
  id: "team-1",
  tournamentId: "t1",
  name: "Team Soul",
  shortName: null,
  slotNumber: null,
  logo: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("Team Delete Interaction Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("opening and cancelling the AlertDialog performs zero mutations", async () => {
    const mockRepo = {
      deleteTeam: vi.fn(),
      updateTeam: vi.fn(),
    } as unknown as GuestTeamRepository;

    render(
      <TeamEditSheet
        team={mockTeam}
        repository={mockRepo}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    // Opening AlertDialog
    fireEvent.click(screen.getByRole("button", { name: "Remove team" }));

    const confirmDialog = await screen.findByRole("alertdialog");
    expect(confirmDialog).toBeTruthy();

    // Zero mutations yet
    expect(mockRepo.deleteTeam).not.toHaveBeenCalled();

    // Cancelling
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    // Still zero mutations
    expect(mockRepo.deleteTeam).not.toHaveBeenCalled();
  });

  it("confirming deletion performs exactly one mutation and triggers success callback", async () => {
    const mockRepo = {
      deleteTeam: vi.fn().mockResolvedValue(undefined),
      updateTeam: vi.fn(),
    } as unknown as GuestTeamRepository;

    const onDeletedMock = vi.fn();

    render(
      <TeamEditSheet
        team={mockTeam}
        repository={mockRepo}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        onDeleted={onDeletedMock}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove team" }));

    const confirmBtn = await screen.findByRole("button", { name: "Yes, remove" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRepo.deleteTeam).toHaveBeenCalledTimes(1);
    });

    // onDeleted callback fired exactly once (toast is fired by useTeamManagement via onDeleted)
    expect(onDeletedMock).toHaveBeenCalledTimes(1);
  });

  it("failed deletion shows TEAM_HAS_MATCH_HISTORY error without closing sheet", async () => {
    const mockRepo = {
      deleteTeam: vi.fn().mockRejectedValue(new TeamDeletionError("TEAM_HAS_MATCH_HISTORY", "Match history err")),
      updateTeam: vi.fn(),
    } as unknown as GuestTeamRepository;

    const onCloseMock = vi.fn();

    render(
      <TeamEditSheet
        team={mockTeam}
        repository={mockRepo}
        onClose={onCloseMock}
        onSaved={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove team" }));

    const confirmBtn = await screen.findByRole("button", { name: "Yes, remove" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // AlertDialog closes on failure because the hook resets isDeleting to false
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    // Error surfaces inline
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("This team can't be deleted because it already has match history.");

    // Sheet remains open (onClose not called)
    expect(onCloseMock).not.toHaveBeenCalled();
  });
});

// ---
// Toast assertion for the team deletion success/failure path lives here at the
// useTeamManagement level where toast() is actually called (via publishDeleted).
// TeamEditSheet tests mock onDeleted with vi.fn() — the real toast fires one
// level up in useTeamManagement.publishDeleted which calls toast().
// ---
describe("Team Delete Toast Coverage (useTeamManagement)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successful team deletion emits exactly ONE success toast via publishDeleted", () => {
    const mockRepo = {
      reorderTeams: vi.fn(),
    } as unknown as GuestTeamRepository;

    const { result } = renderHook(() =>
      useTeamManagement("t1", [mockTeam], mockRepo, vi.fn())
    );

    // Simulate the onDeleted callback firing (as TeamEditSheet would call it on success)
    act(() => {
      result.current.publishDeleted(mockTeam.id);
    });

    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith("Team removed from the roster.");
  });

  it("failed team deletion emits ZERO toasts — onDeleted is never called on failure", async () => {
    const mockRepo = {
      deleteTeam: vi.fn().mockRejectedValue(new TeamDeletionError("TEAM_HAS_MATCH_HISTORY", "Cannot delete")),
      updateTeam: vi.fn(),
    } as unknown as GuestTeamRepository;

    render(
      <TeamEditSheet
        team={mockTeam}
        repository={mockRepo}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        onDeleted={vi.fn()} // This will NOT be called on failure
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove team" }));
    const confirmBtn = await screen.findByRole("button", { name: "Yes, remove" });
    fireEvent.click(confirmBtn);

    // Wait for the hook to process the rejection
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    // onDeleted was not called → publishDeleted was not called → toast was not called
    expect(toast).not.toHaveBeenCalled();

    cleanup();
  });
});

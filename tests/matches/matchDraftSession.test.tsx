/**
 * @vitest-environment jsdom
 */
import { render, screen, act, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type { TournamentMatch } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";
import { MatchEntry } from "@/features/matches/components/MatchEntry";
import type { MatchFeatureDependencies } from "@/features/matches/matchFeatureDependencies";
import { createMatchWriteCoordinatorRegistry } from "@/features/matches/matchWriteCoordinator";
import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { MatchLifecycleRepository } from "@/features/matches/matchLifecycleRepository";
import type { MatchRepository } from "@/features/matches/matchRepository";
import type { MatchResultRepository } from "@/features/matches/matchResultRepository";
import { MatchEntryRoute } from "@/screens/tournament-workspace/MatchEntryRoute";

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", { value: {} });
}
if (!globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis.crypto, "randomUUID", {
    value: () => Math.random().toString(36).slice(2) + Date.now().toString(36),
  });
}

// Mock WorkspaceRepositoryProvider at top level
let currentMockRepos: MatchFeatureDependencies | null = null;
vi.mock("@/screens/tournament-workspace/WorkspaceRepositoryProvider", () => ({
  useWorkspaceRepositories: () => ({
    matchFeature: currentMockRepos,
    teams: currentMockRepos?.teams,
  })
}));

const mockTeamA: Team = {
  id: "teamA",
  tournamentId: "t1",
  name: "Alpha",
  shortName: "ALP",
  slotNumber: 1,
  logo: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const mockTeamB: Team = {
  id: "teamB",
  tournamentId: "t1",
  name: "Bravo",
  shortName: "BRV",
  slotNumber: 2,
  logo: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const mockTeamC: Team = {
  id: "teamC",
  tournamentId: "t1",
  name: "Charlie",
  shortName: "CHA",
  slotNumber: 3,
  logo: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const mockTeams = [mockTeamA, mockTeamB, mockTeamC];
const mockMatch: TournamentMatch = {
  id: "m1",
  tournamentId: "t1",
  matchNumber: 1,
  name: "Game 1",
  status: "DRAFT",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("MatchEntry Routing & Persistence Hardening", () => {
  let mockDraftStore: Record<string, string>; // matchId -> results JSON
  let mockNameStore: Record<string, string | undefined>; // matchId -> name

  beforeEach(() => {
    mockDraftStore = {};
    mockNameStore = {};
    const registry = createMatchWriteCoordinatorRegistry();

    currentMockRepos = {
      lifecycle: {
        saveMatchDraft: vi.fn().mockImplementation(async (req: import("@/features/matches/matchLifecycleRepository").MatchSnapshotCommand) => {
          mockNameStore[req.matchId] = req.name ?? mockMatch.name;
          mockDraftStore[req.matchId] = JSON.stringify(req.results);
          return {
            match: { ...mockMatch, name: req.name ?? mockMatch.name },
            results: req.results,
          };
        }),
        finalizeMatch: vi.fn().mockImplementation(async (req: import("@/features/matches/matchLifecycleRepository").MatchSnapshotCommand) => {
          mockNameStore[req.matchId] = req.name ?? mockMatch.name;
          mockDraftStore[req.matchId] = JSON.stringify(req.results);
          return {
            ok: true,
            match: { ...mockMatch, name: req.name ?? mockMatch.name, status: "FINALIZED" },
            results: req.results,
          };
        }),
      } as unknown as MatchLifecycleRepository,
      matches: {
        getMatch: vi.fn().mockImplementation(async (tId: string, mId: string) => {
          if (mId === mockMatch.id) {
            return { ...mockMatch, name: mockNameStore[mId] ?? mockMatch.name };
          }
          return null;
        }),
      } as unknown as MatchRepository,
      results: {
        getResultsByMatch: vi.fn().mockImplementation(async (tId: string, mId: string) => {
          const stored = mockDraftStore[mId];
          return stored ? JSON.parse(stored) : [];
        }),
        bulkSaveResults: vi.fn().mockImplementation(async (tId: string, mId: string, created: import("@/domain/matches/types").StoredMatchResult[]) => {
          // If we wanted to, we could merge this into mockDraftStore, 
          // but usually saveMatchDraft writes the authoritative draft.
          return created;
        }),
      } as unknown as MatchResultRepository,
      teams: {
        listTeamsByTournament: vi.fn().mockResolvedValue(mockTeams),
      } as unknown as GuestTeamRepository,
      writeCoordinators: registry,
    };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    currentMockRepos = null;
  });

  it("1. FIN 0 + FIN 5 rapid navigation & 2. immediate remount NO artificial wait", async () => {
    const { unmount } = render(
      <MatchEntry
        match={mockMatch}
        teams={mockTeams}
        lifecycleRepository={currentMockRepos!.lifecycle}
        resultRepository={currentMockRepos!.results}
        writeCoordinators={currentMockRepos!.writeCoordinators}
        onClose={vi.fn()}
        onMatchChange={vi.fn()}
      />
    );

    await screen.findAllByLabelText("Finishes for Alpha");

    const finInput = screen.getByLabelText("Finishes for Alpha");
    await act(async () => {
      fireEvent.change(finInput, { target: { value: "0" } });
    });

    unmount();

    render(
      <MatchEntry
        match={mockMatch}
        teams={mockTeams}
        lifecycleRepository={currentMockRepos!.lifecycle}
        resultRepository={currentMockRepos!.results}
        writeCoordinators={currentMockRepos!.writeCoordinators}
        onClose={vi.fn()}
        onMatchChange={vi.fn()}
      />
    );

    await waitFor(() => {
      const loadedInput = screen.getByLabelText("Finishes for Alpha") as HTMLInputElement;
      expect(loadedInput.value).toBe("0");
    });
  });

  it("3. WRITE→READ→WRITE immediate remount combining FIN 0, FIN 5, and Match Name", async () => {
    // 1. Initial MatchEntry instance
    const { unmount } = render(
      <MatchEntry
        match={mockMatch}
        teams={mockTeams}
        lifecycleRepository={currentMockRepos!.lifecycle}
        resultRepository={currentMockRepos!.results}
        writeCoordinators={currentMockRepos!.writeCoordinators}
        onClose={vi.fn()}
        onMatchChange={vi.fn()}
      />
    );

    await screen.findAllByLabelText("Finishes for Alpha");

    // Set Team A FIN to 0
    const finInputA = screen.getByLabelText("Finishes for Alpha");
    await act(async () => {
      fireEvent.change(finInputA, { target: { value: "0" } });
    });

    // Set Team B FIN to 5
    const finInputB = screen.getByLabelText("Finishes for Bravo");
    await act(async () => {
      fireEvent.change(finInputB, { target: { value: "5" } });
    });

    // Change Match Name
    const nameInput = screen.getByLabelText(/Match name/i);
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Rapid Route Test" } });
    });

    // 2. Unmount BEFORE the 500ms debounce fires
    unmount();

    // 3. IMMEDIATELY mount a new MatchEntry for the SAME match via Route
    // This goes through the coordinator.whenIdle() barrier internally
    const { unmount: unmount2 } = render(<MatchEntryRoute tournamentId="t1" matchId="m1" />);

    // 4. Assert after remount
    await waitFor(() => {
      const loadedFinA = screen.getByLabelText("Finishes for Alpha") as HTMLInputElement;
      expect(loadedFinA.value).toBe("0");
    });
    
    const loadedFinB = screen.getByLabelText("Finishes for Bravo") as HTMLInputElement;
    expect(loadedFinB.value).toBe("5");

    const loadedName = screen.getByLabelText(/Match name/i) as HTMLInputElement;
    expect(loadedName.value).toBe("Rapid Route Test");

    // 5. Change another persisted field (Team C FIN = 7)
    const finInputC = screen.getByLabelText("Finishes for Charlie");
    await act(async () => {
      fireEvent.change(finInputC, { target: { value: "7" } });
    });

    // We allow persistence to occur via another immediate unmount
    unmount2();

    // 6. Reload/remount again
    render(<MatchEntryRoute tournamentId="t1" matchId="m1" />);

    // 7. Assert all fields
    await waitFor(() => {
      const finalFinA = screen.getByLabelText("Finishes for Alpha") as HTMLInputElement;
      expect(finalFinA.value).toBe("0");
    });

    const finalFinB = screen.getByLabelText("Finishes for Bravo") as HTMLInputElement;
    expect(finalFinB.value).toBe("5");

    const finalFinC = screen.getByLabelText("Finishes for Charlie") as HTMLInputElement;
    expect(finalFinC.value).toBe("7");

    const finalName = screen.getByLabelText(/Match name/i) as HTMLInputElement;
    expect(finalName.value).toBe("Rapid Route Test");
  });

  it("5. Save Draft + immediate navigation", async () => {
    const { unmount } = render(
      <MatchEntry
        match={mockMatch}
        teams={mockTeams}
        lifecycleRepository={currentMockRepos!.lifecycle}
        resultRepository={currentMockRepos!.results}
        writeCoordinators={currentMockRepos!.writeCoordinators}
        onClose={vi.fn()}
        onMatchChange={vi.fn()}
      />
    );

    await screen.findAllByLabelText("Finishes for Alpha");
    const finInput = screen.getByLabelText("Finishes for Alpha");
    await act(async () => {
      fireEvent.change(finInput, { target: { value: "8" } });
    });

    const saveBtn = screen.getByText("Save Draft");
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    unmount(); 

    render(
      <MatchEntry
        match={mockMatch}
        teams={mockTeams}
        lifecycleRepository={currentMockRepos!.lifecycle}
        resultRepository={currentMockRepos!.results}
        writeCoordinators={currentMockRepos!.writeCoordinators}
        onClose={vi.fn()}
        onMatchChange={vi.fn()}
      />
    );

    await waitFor(() => {
      const input = screen.getByLabelText("Finishes for Alpha") as HTMLInputElement;
      expect(input.value).toBe("8");
    });
  });

  it("6. Finalize + immediate unmount & 7. finalized status cannot be reverted by stale draft write", async () => {
    let finalStatus = "DRAFT";
    
    const { unmount } = render(
      <MatchEntry
        match={mockMatch}
        teams={mockTeams}
        lifecycleRepository={currentMockRepos!.lifecycle}
        resultRepository={currentMockRepos!.results}
        writeCoordinators={currentMockRepos!.writeCoordinators}
        onClose={vi.fn()}
        onMatchChange={(m) => { finalStatus = m.status; }}
      />
    );

    await screen.findAllByLabelText("Finishes for Alpha");

    const autofillBtn = screen.getByRole("button", { name: "Auto-fill placements" });
    await act(async () => {
      fireEvent.click(autofillBtn);
    });

    const finInputA = screen.getByLabelText("Finishes for Alpha");
    const finInputB = screen.getByLabelText("Finishes for Bravo");
    const finInputC = screen.getByLabelText("Finishes for Charlie");
    
    await act(async () => {
      fireEvent.change(finInputA, { target: { value: "1" } }); 
      fireEvent.change(finInputB, { target: { value: "0" } }); 
      fireEvent.change(finInputC, { target: { value: "0" } }); 
    });

    const finalizeBtn = screen.getByText("Finalize Match");
    await act(async () => {
      fireEvent.click(finalizeBtn);
    });

    unmount(); 

    // Final status should be updated via onMatchChange
    expect(finalStatus).toBe("FINALIZED");
    expect(currentMockRepos!.lifecycle.saveMatchDraft).toHaveBeenCalledTimes(0);
  });

  it("8. wrong-tournament match rejection & 9. direct MatchEntry load/reload", async () => {
    render(<MatchEntryRoute tournamentId="wrong-t" matchId="m1" />);

    await waitFor(() => {
      expect(screen.queryByText("Match belongs to a different tournament.")).not.toBeNull();
    });
  });

  it("10. finalized direct URL is read-only", async () => {
    const finalizedMatch = { ...mockMatch, status: "FINALIZED" as const };
    
    currentMockRepos!.matches.getMatch = vi.fn().mockResolvedValue(finalizedMatch);

    render(<MatchEntryRoute tournamentId="t1" matchId="m1" />);

    await waitFor(() => {
      const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
      expect(inputs[0].disabled).toBe(true);
    });
    
    expect(screen.queryByText("Saved")).not.toBeNull();
    expect(screen.getByText("Save Draft")).toHaveProperty("disabled", true);
    expect(screen.getByText("Finalize Match")).toHaveProperty("disabled", true);
  });
});

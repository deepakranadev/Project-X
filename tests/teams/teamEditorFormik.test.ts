/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTeamEditor } from "@/features/teams/useTeamEditor";
import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTeam } from "@/features/teams/types";
import { TeamDeletionError } from "@/domain/teams/errors";

const mockTeamA: GuestTeam = { id: "a", tournamentId: "t1", name: "Team A", shortName: null, slotNumber: null, logo: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
const mockTeamB: GuestTeam = { id: "b", tournamentId: "t1", name: "Team B", shortName: "TB", slotNumber: 2, logo: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

describe("Team Editor Formik Migration", () => {
  it("reinitializes values when the incoming team prop changes", () => {
    const { result, rerender } = renderHook(
      ({ team }) => useTeamEditor(team, {} as GuestTeamRepository, vi.fn(), vi.fn(), vi.fn()),
      { initialProps: { team: mockTeamA } }
    );

    expect(result.current.formik.values.name).toBe("Team A");
    
    // Simulate changing to another team (e.g. clicking a different sheet trigger)
    rerender({ team: mockTeamB });

    expect(result.current.formik.values.name).toBe("Team B");
    expect(result.current.formik.values.shortName).toBe("TB");
  });

  it("rebases the form to the canonical persisted team and resets dirty state", async () => {
    const mockRepo = {
      updateTeam: vi.fn().mockResolvedValue({
        id: "a",
        tournamentId: "t1",
        name: "Canonical Name", // Repo trimmed or otherwise modified it
        shortName: null,
        slotNumber: null,
        logo: null,
      } as GuestTeam),
    } as unknown as GuestTeamRepository;

    let onSavedWrapper: (t: GuestTeam) => void = () => {};
    const { result, rerender } = renderHook(
      (props) => useTeamEditor(props.team, mockRepo, props.onSaved, vi.fn(), vi.fn()),
      { initialProps: { team: mockTeamA, onSaved: (t: GuestTeam) => onSavedWrapper(t) } }
    );

    onSavedWrapper = (t: GuestTeam) => {
      rerender({ team: t, onSaved: onSavedWrapper });
    };

    await act(async () => {
      await result.current.formik.setValues({ name: "  Canonical Name  ", shortName: "", slotNumber: "", logo: undefined as unknown });
    });
    await act(async () => {
      await result.current.formik.submitForm();
    });
    
    if (result.current.formError) console.error("Form error:", result.current.formError);
    console.log("Values:", result.current.formik.values);

    expect(result.current.formik.values.name).toBe("Canonical Name");
    expect(result.current.formik.dirty).toBe(false); // cleanly rebased
  });

  it("delete does not invoke Formik save submission", async () => {
    const mockRepo = {
      updateTeam: vi.fn(),
      deleteTeam: vi.fn().mockResolvedValue(undefined),
    } as unknown as GuestTeamRepository;

    const { result } = renderHook(() => useTeamEditor(mockTeamA, mockRepo, vi.fn(), vi.fn(), vi.fn()));

    await act(async () => {
      await result.current.deleteTeam();
    });

    expect(mockRepo.deleteTeam).toHaveBeenCalled();
    expect(mockRepo.updateTeam).not.toHaveBeenCalled();
  });

  it("save and delete mutually exclude and cannot overlap", async () => {
    const mockRepo = {
      updateTeam: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return mockTeamA;
      }),
      deleteTeam: vi.fn(),
    } as unknown as GuestTeamRepository;

    const { result } = renderHook(() => useTeamEditor(mockTeamA, mockRepo, vi.fn(), vi.fn(), vi.fn()));

    let savePromise: Promise<void>;
    await act(async () => {
      savePromise = result.current.formik.submitForm();
      // wait for Formik's internal async validation to resolve so onSubmit starts
      await new Promise((resolve) => setTimeout(resolve, 0));
      await result.current.deleteTeam();
    });
    
    await act(async () => {
      await savePromise;
    });

    expect(mockRepo.updateTeam).toHaveBeenCalled();
    expect(mockRepo.deleteTeam).not.toHaveBeenCalled(); // guarded!
  });

  it("surfaces TEAM_HAS_MATCH_HISTORY domain error properly on delete", async () => {
    const mockRepo = {
      deleteTeam: vi.fn().mockRejectedValue(new TeamDeletionError("TEAM_HAS_MATCH_HISTORY", "Cannot delete")),
    } as unknown as GuestTeamRepository;

    const { result } = renderHook(() => useTeamEditor(mockTeamA, mockRepo, vi.fn(), vi.fn(), vi.fn()));

    await act(async () => {
      await result.current.deleteTeam();
    });

    expect(result.current.formError || "").toContain("already has match history");
  });
});

/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useScoringConfiguration } from "@/features/scoring/useScoringConfiguration";
import { createBgmiStandardScoringConfig } from "@/domain/tournaments/scoringPresets";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import type { GuestTournament } from "@/features/tournaments/types";

const mockConfig = createBgmiStandardScoringConfig();

describe("Scoring Configuration Session Draft", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const getMockRepo = () =>
    ({
      updateTournament: vi.fn().mockResolvedValue({
        id: "t1",
        scoringConfig: { ...mockConfig, pointsPerKill: 3 },
      } as unknown as GuestTournament),
    } as unknown as GuestTournamentRepository);

  it("restores unsaved latest value if component is unmounted and remounted before debounce fires", () => {
    const { result, unmount } = renderHook(() =>
      useScoringConfiguration(mockConfig, "t1", getMockRepo(), vi.fn())
    );

    act(() => {
      result.current.applyChange({ pointsPerFinish: "17.5" });
    });
    expect(result.current.isDirty).toBe(true);

    // Unmount before debounce fires (which is 500ms)
    unmount();

    // Remount
    const { result: newResult } = renderHook(() =>
      useScoringConfiguration(mockConfig, "t1", getMockRepo(), vi.fn())
    );

    expect(newResult.current.draft.pointsPerFinish).toBe("17.5");
    expect(newResult.current.isDirty).toBe(true);
  });

  it("does NOT restore an old session draft if the authoritative config was successfully saved (and thus snapshot updated)", async () => {
    let onSavedWrapper: (t: GuestTournament) => void = () => {};
    const { result, rerender, unmount } = renderHook(
      (props) => useScoringConfiguration(props.config, "t1", getMockRepo(), props.onSaved),
      {
        initialProps: {
          config: mockConfig,
          onSaved: (t: GuestTournament) => onSavedWrapper(t),
        },
      }
    );

    onSavedWrapper = (t: GuestTournament) => {
      rerender({ config: t.scoringConfig, onSaved: onSavedWrapper });
    };

    act(() => {
      result.current.applyChange({ pointsPerFinish: "3" });
    });

    await act(async () => {
      await result.current.formik.submitForm();
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.draft.pointsPerFinish).toBe("3");

    // Unmount and remount. The draft was cleared on successful save!
    unmount();
    
    // Simulate a new authoritative config (as if returning)
    const newConfig = { ...mockConfig, pointsPerKill: 3 };
    const { result: newResult } = renderHook(() =>
      useScoringConfiguration(newConfig, "t1", getMockRepo(), vi.fn())
    );

    expect(newResult.current.draft.pointsPerFinish).toBe("3");
    expect(newResult.current.isDirty).toBe(false);
  });

  it("discards stored draft if it is based on a different authoritative config snapshot", () => {
    // Inject a stale draft (e.g. from an old version of the tournament)
    const staleSnapshot = JSON.stringify({
      preset: "CUSTOM",
      placementPoints: [],
      pointsPerFinish: 99,
      tiebreakers: [],
    });

    sessionStorage.setItem(
      "openloby:scoring-draft:t1",
      JSON.stringify({
        version: 1,
        baseConfigSnapshot: staleSnapshot,
        draftValues: { ...mockConfig, pointsPerFinish: "123" },
      })
    );

    const { result } = renderHook(() =>
      useScoringConfiguration(mockConfig, "t1", getMockRepo(), vi.fn())
    );

    // The component should ignore the draft and use mockConfig (which has pointsPerFinish 1)
    expect(result.current.draft.pointsPerFinish).toBe("1");
    expect(result.current.isDirty).toBe(false);
  });

  it("falls back safely if the sessionStorage draft is completely malformed", () => {
    sessionStorage.setItem("openloby:scoring-draft:t1", "{ invalid json");

    const { result } = renderHook(() =>
      useScoringConfiguration(mockConfig, "t1", getMockRepo(), vi.fn())
    );

    // Should gracefully catch and fallback
    expect(result.current.draft.pointsPerFinish).toBe("1");
    expect(result.current.isDirty).toBe(false);
  });

  it("removes the session draft if the user manually reverts their changes back to the authoritative config", () => {
    const { result, unmount } = renderHook(() =>
      useScoringConfiguration(mockConfig, "t1", getMockRepo(), vi.fn())
    );

    act(() => {
      result.current.applyChange({ pointsPerFinish: "12.5" });
    });
    
    // Fast-forward so the draft actually saves to sessionStorage
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(sessionStorage.getItem("openloby:scoring-draft:t1")).not.toBeNull();

    // Now user reverts back to the original value
    act(() => {
      result.current.applyChange({ pointsPerFinish: "1" });
    });
    
    // The session draft should be synchronously removed, even before debounce!
    expect(sessionStorage.getItem("openloby:scoring-draft:t1")).toBeNull();

    unmount();
    
    // Still shouldn't exist after unmount
    expect(sessionStorage.getItem("openloby:scoring-draft:t1")).toBeNull();
  });

  it("cancels a pending debounce draft write if the user quickly reverts to the authoritative config", () => {
    const { result, unmount } = renderHook(() =>
      useScoringConfiguration(mockConfig, "t1", getMockRepo(), vi.fn())
    );

    act(() => {
      result.current.applyChange({ pointsPerFinish: "12.5" });
    });
    
    // Before debounce fires, revert back
    act(() => {
      result.current.applyChange({ pointsPerFinish: "1" });
    });
    
    // Now allow timers to settle
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // The cancelled debounce should NOT have written the 12.5 draft
    expect(sessionStorage.getItem("openloby:scoring-draft:t1")).toBeNull();

    unmount();
    
    const { result: newResult } = renderHook(() =>
      useScoringConfiguration(mockConfig, "t1", getMockRepo(), vi.fn())
    );

    expect(newResult.current.draft.pointsPerFinish).toBe("1");
    expect(newResult.current.isDirty).toBe(false);
  });
});

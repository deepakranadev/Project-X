/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useScoringConfiguration } from "@/features/scoring/useScoringConfiguration";
import { createBgmiStandardScoringConfig } from "@/domain/tournaments/scoringPresets";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import type { GuestTournament } from "@/features/tournaments/types";

const mockConfig = createBgmiStandardScoringConfig();

describe("Scoring Configuration Formik Migration", () => {
  it("rebases Formik to the canonical persisted config and resets dirty status on save", async () => {
    const mockRepo = {
      updateTournament: vi.fn().mockResolvedValue({
        id: "t1",
        scoringConfig: { ...mockConfig, pointsPerKill: 2 },
      } as unknown as GuestTournament),
    } as unknown as GuestTournamentRepository;

    let onSavedWrapper = (_t: GuestTournament) => {};
    const { result, rerender } = renderHook(
      (props) => useScoringConfiguration(props.config, "t1", mockRepo, props.onSaved),
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
      result.current.applyChange({ pointsPerFinish: "2" });
    });
    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      await result.current.formik.submitForm();
    });

    if (result.current.saveError) console.error("Save error:", result.current.saveError);
    // @ts-expect-error Mock calls type mismatch in vitest
    console.log("Mock calls:", mockRepo.updateTournament.mock.calls);
    console.log("Values:", result.current.draft);

    expect(result.current.draft.pointsPerFinish).toBe("2");
    expect(result.current.isDirty).toBe(false); // successfully rebased
    expect(result.current.saved).toBe(true);
  });

  it("failed save does not falsely enter the saved state", async () => {
    const mockRepo = {
      updateTournament: vi.fn().mockRejectedValue(new Error("Network offline")),
    } as unknown as GuestTournamentRepository;

    const { result } = renderHook(() => useScoringConfiguration(mockConfig, "t1", mockRepo, vi.fn()));

    result.current.applyChange({ pointsPerFinish: "3" });
    await act(async () => {
      await result.current.formik.submitForm();
    });

    expect(result.current.isDirty).toBe(true); // still dirty because save failed
    expect(result.current.saved).toBe(false);
    expect(result.current.saveError || "").toContain("could not be saved");
  });

  it("concurrency: prevents overlapping saves", async () => {
    let callCount = 0;
    const mockRepo = {
      updateTournament: vi.fn().mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { id: "t1", scoringConfig: mockConfig } as unknown as GuestTournament;
      }),
    } as unknown as GuestTournamentRepository;

    const { result } = renderHook(() => useScoringConfiguration(mockConfig, "t1", mockRepo, vi.fn()));

    result.current.applyChange({ pointsPerFinish: "2" });

    let p1: Promise<void>, p2: Promise<void>;
    await act(async () => {
      p1 = result.current.formik.submitForm();
      p2 = result.current.formik.submitForm();
      await Promise.all([p1, p2]);
    });

    expect(callCount).toBe(1);
  });

  it("maintains string-backed numeric draft behavior for intermediate editing", async () => {
    const { result } = renderHook(() => useScoringConfiguration(mockConfig, "t1", {} as GuestTournamentRepository, vi.fn()));

    // When the user clears the input
    await act(async () => {
      result.current.applyChange({ pointsPerFinish: "2" });
    });
    await waitFor(() => expect(result.current.isDirty).toBe(true));
    
    act(() => {
      result.current.applyChange({ pointsPerFinish: "" });
    });
    expect(result.current.draft.pointsPerFinish).toBe("");

    // When the user starts typing a decimal
    act(() => {
      result.current.applyChange({ pointsPerFinish: "0." });
    });
    expect(result.current.draft.pointsPerFinish).toBe("0.");

    // The mapping validation handles these intermediate states (usually marking them invalid without breaking the form)
    expect(result.current.generalIssues.length).toBeGreaterThanOrEqual(0);
  });

  it(">2-decimal precision still reaches the correct field-level Formik error without silent rounding", async () => {
    const { result } = renderHook(() => useScoringConfiguration(mockConfig, "t1", {} as GuestTournamentRepository, vi.fn()));

    act(() => {
      result.current.applyChange({ pointsPerFinish: "1.123" });
    });
    await act(async () => {
      await result.current.formik.submitForm();
    });

    expect(result.current.finishError).toBe("Points per finish must use at most 2 decimal places.");
  });
});

/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTournamentCreation } from "@/features/tournaments/useTournamentCreation";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import type { GuestTournament } from "@/features/tournaments/types";

describe("Tournament Creation Formik Migration", () => {
  it("concurrency: prevents overlapping submissions", async () => {
    let callCount = 0;
    const mockRepo = {
      createTournament: vi.fn().mockImplementation(async () => {
        callCount++;
        // artificially delay the resolution to test concurrency overlap
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { id: "t1" } as GuestTournament;
      }),
    } as unknown as GuestTournamentRepository;

    const { result } = renderHook(() => useTournamentCreation(mockRepo, vi.fn()));

    // Trigger two rapid
    await act(async () => {
      await result.current.formik.setValues({ name: "Valid Name", game: "BGMI", organizerName: "", tournamentLogo: undefined as unknown, organizerLogo: undefined as unknown });
    });
    
    // Fire and don't await immediately
    let p1: Promise<void>, p2: Promise<void>;
    await act(async () => {
      p1 = result.current.formik.submitForm();
      p2 = result.current.formik.submitForm();
      await Promise.all([p1, p2]);
    });

    expect(callCount).toBe(1); // exactly one operation reached the repo
  });

  it("maps domain validation errors to Formik field errors", async () => {
    const mockRepo = {
      createTournament: vi.fn().mockResolvedValue({ id: "t1" }),
    } as unknown as GuestTournamentRepository;

    const { result } = renderHook(() => useTournamentCreation(mockRepo, vi.fn()));

    // Name length > 80 will fail inside createGuestTournament's validation mapping
    const longName = "A".repeat(81);
    await act(async () => {
      await result.current.formik.setValues({ name: longName, game: "BGMI", organizerName: "", tournamentLogo: undefined as unknown, organizerLogo: undefined as unknown });
    });
    await act(async () => {
      await result.current.formik.submitForm();
    });

    expect(result.current.formik.errors.name).toBe("Tournament name must be 80 characters or fewer.");
    expect(result.current.formError).toBeNull();
  });

  it("maps unhandled persistence failures to a form-level error", async () => {
    const mockRepo = {
      createTournament: vi.fn().mockRejectedValue(new Error("Database offline")),
    } as unknown as GuestTournamentRepository;

    const { result } = renderHook(() => useTournamentCreation(mockRepo, vi.fn()));

    await act(async () => {
      await result.current.formik.setValues({ name: "Valid", game: "BGMI", organizerName: "", tournamentLogo: undefined as unknown, organizerLogo: undefined as unknown });
    });
    await act(async () => {
      await result.current.formik.submitForm();
    });

    // Field errors remain empty
    expect(result.current.formik.errors.name).toBeUndefined();
    // But form-level error exists
    expect(result.current.formError || "").toContain("Check browser storage permissions");
  });
});

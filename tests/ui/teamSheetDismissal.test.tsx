/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import React from "react";

import { TeamEditSheet } from "@/features/teams/components/TeamEditSheet";
import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTeam } from "@/features/teams/types";

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

describe("Team Sheet Accessibility & Dismissal", () => {
  afterEach(() => {
    cleanup();
  });

  it("exposes meaningful accessible title and description", () => {
    render(
      <TeamEditSheet
        team={mockTeam}
        repository={{} as GuestTeamRepository}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    // Radix Dialog maps the Title to aria-labelledby and Description to aria-describedby
    const dialog = screen.getByRole("dialog", { name: "Edit team" });
    expect(dialog).toBeTruthy();

    // Verify description exists in the DOM and is accessible
    const desc = screen.getByText("Edit team details such as name, short name, slot, and logo.");
    expect(desc).toBeTruthy();
  });

  it("closing/dismissing the Sheet does NOT submit the Team Formik form", () => {
    const mockRepo = { updateTeam: vi.fn() } as unknown as GuestTeamRepository;
    const onClose = vi.fn();
    
    render(
      <TeamEditSheet
        team={mockTeam}
        repository={mockRepo}
        onClose={onClose}
        onSaved={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    // Click the X Close button provided by Radix
    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateTeam).not.toHaveBeenCalled();
  });

  it("when authoritative actionLock is active, a close request cannot dismiss the editing context", async () => {
    let resolveUpdate: () => void;
    const updatePromise = new Promise<GuestTeam>((resolve) => {
      resolveUpdate = () => resolve({ ...mockTeam, name: "Updated" });
    });

    const mockRepo = { updateTeam: vi.fn().mockReturnValue(updatePromise) } as unknown as GuestTeamRepository;
    const onClose = vi.fn();
    
    render(
      <TeamEditSheet
        team={mockTeam}
        repository={mockRepo}
        onClose={onClose}
        onSaved={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    // Fire form submission (save team)
    const saveBtn = screen.getByRole("button", { name: "Save team" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(saveBtn.textContent).toBe("Saving…");
    });

    // While saving is active, attempt to close
    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn); // Note: Radix might not even trigger onOpenChange if we use internal state, but clicking Close tests it directly.
    
    // onClose should NOT have been called because of the isLocked guard
    expect(onClose).not.toHaveBeenCalled();

    // Resolve the promise to let it finish
    resolveUpdate!();

    // After finish, the controller itself calls onClose
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("when idle, Escape dismissal works (if JSDOM supports it) or Close button works", () => {
    const onClose = vi.fn();
    render(
      <TeamEditSheet
        team={mockTeam}
        repository={{} as GuestTeamRepository}
        onClose={onClose}
        onSaved={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    // Radix requires specific pointer event or keyboard interactions that can be flaky in jsdom without userEvent.
    // We use fireEvent on the dialog itself as a fallback if window events aren't fully bubbled.
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    
    // If JSDOM successfully propagated the Escape key to Radix's DismissableLayer:
    expect(onClose).toHaveBeenCalled();
  });
});

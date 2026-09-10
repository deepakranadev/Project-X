/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("R2I UI Primitives Behavior", () => {
  it("Button renders with explicit type behavior (defaulting to button or inheriting)", () => {
    // Shadcn defaults to rendering a standard <button>.
    // It should not default to type="submit" when used generically without explicit type inside forms unless specified,
    // although standard HTML buttons inside forms DO default to submit. Let's just check prop forwarding.
    render(<Button data-testid="test-btn" type="button">Click</Button>);
    const btn = screen.getByTestId("test-btn");
    expect(btn.getAttribute("type")).toBe("button");
  });

  it("Button disabled behavior", () => {
    render(<Button data-testid="disabled-btn" disabled>Disabled</Button>);
    const btn = screen.getByTestId("disabled-btn") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("Input forwards native props correctly", () => {
    render(
      <Input
        data-testid="test-input"
        type="number"
        min={0}
        step="0.01"
        placeholder="Value"
        readOnly
      />
    );
    const input = screen.getByTestId("test-input") as HTMLInputElement;
    expect(input.type).toBe("number");
    expect(input.min).toBe("0");
    expect(input.step).toBe("0.01");
    expect(input.placeholder).toBe("Value");
    expect(input.readOnly).toBe(true);
  });
});

describe("R2I Exclusion Boundaries", () => {
  const repositoryRoot = process.cwd();

  function getFile(relativePath: string) {
    return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
  }

  it("Team delete remains type='button'", () => {
    const content = getFile("src/features/teams/components/TeamDeletionControls.tsx");
    // TeamDeletionControls should contain a button with type="button"
    expect(content).toMatch(/type="button"/);
  });

  it("MatchEntry specialized numeric inputs were not replaced", () => {
    const content = getFile("src/features/matches/components/MatchEntryForm.tsx");
    // Should still use <input> natively, not <Input>
    expect(content).toMatch(/<input/);
    expect(content).not.toMatch(/<Input/);
  });

  it("MatchEntry remains Formik-free", () => {
    const content = getFile("src/features/matches/components/MatchEntryForm.tsx");
    expect(content).not.toMatch(/formik/i);
  });

  it("Team bulk entry remains Formik-free", () => {
    const content = getFile("src/features/teams/components/TeamBulkForm.tsx");
    expect(content).not.toMatch(/formik/i);
  });
});

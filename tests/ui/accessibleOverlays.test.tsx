/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("R2J Accessible Overlays Boundaries & Dependencies", () => {
  const repositoryRoot = process.cwd();
  function getFile(relativePath: string) {
    return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
  }

  it("window.confirm and window.alert are gone from migrated flows", () => {
    const matchManagement = getFile("src/features/matches/useMatchManagement.ts");
    expect(matchManagement).not.toMatch(/window\.confirm/);
    expect(matchManagement).not.toMatch(/window\.alert/);
  });

  it("exactly one Toaster is mounted at application level", () => {
    const layout = getFile("src/app/layout.tsx");
    expect(layout).toMatch(/<Toaster/);
    // Should only be one instance
    const matches = layout.match(/<Toaster/g);
    expect(matches?.length).toBe(1);
  });

  it("next-themes is not a dependency/import", () => {
    const sonner = getFile("src/shared/ui/sonner.tsx");
    expect(sonner).not.toMatch(/next-themes/);
    
    const pkg = getFile("package.json");
    expect(pkg).not.toMatch(/"next-themes"/);
  });

  it("MatchEntry remains Formik-free and uses native numeric inputs", () => {
    const matchEntryForm = getFile("src/features/matches/components/MatchEntryForm.tsx");
    expect(matchEntryForm).not.toMatch(/formik/i);
    expect(matchEntryForm).toMatch(/<input/);
    expect(matchEntryForm).not.toMatch(/<Input/); // native input, not shadcn
  });

  it("Team delete trigger is type='button'", () => {
    const teamDeletionControls = getFile("src/features/teams/components/TeamDeletionControls.tsx");
    expect(teamDeletionControls).toMatch(/type="button"/);
    expect(teamDeletionControls).not.toMatch(/type="submit"/);
  });

  it("Match delete uses single-flight useRef lock", () => {
    const matchManagement = getFile("src/features/matches/useMatchManagement.ts");
    expect(matchManagement).toMatch(/deleteLockRef\.current = true/);
  });
});

import { describe, expect, it } from "vitest";

import fs from "node:fs/promises";
import path from "node:path";

describe("Workspace Navigation Architecture", () => {
  it("root /tournaments/[id] -> redirects to /overview", async () => {
    const pageContent = await fs.readFile(
      path.join(process.cwd(), "src/app/tournaments/[id]/page.tsx"),
      "utf8"
    );
    expect(pageContent).toContain('redirect(`/tournaments/${id}/overview`)');
    // Ensure it's a server component
    expect(pageContent).not.toContain('"use client"');
  });

  it("navigation destinations are real routes", async () => {
    const navContent = await fs.readFile(
      path.join(
        process.cwd(),
        "src/screens/tournament-workspace/TournamentWorkspaceNavigation.tsx"
      ),
      "utf8"
    );
    expect(navContent).toContain('href={`/tournaments/${tournamentId}/overview`}');
    expect(navContent).toContain('href={`/tournaments/${tournamentId}/teams`}');
    expect(navContent).toContain('href={`/tournaments/${tournamentId}/scoring`}');
    expect(navContent).toContain('href={`/tournaments/${tournamentId}/matches`}');
    expect(navContent).toContain('href={`/tournaments/${tournamentId}/standings`}');
  });

  it("active navigation derives from route segment", async () => {
    const navContent = await fs.readFile(
      path.join(
        process.cwd(),
        "src/screens/tournament-workspace/TournamentWorkspaceNavigation.tsx"
      ),
      "utf8"
    );
    expect(navContent).toContain("useSelectedLayoutSegment");
  });

  it("no normal workspace hash routing remains", async () => {
    // Audit specific legacy orchestrator files (which should be deleted)
    const oldScreenPath = path.join(
      process.cwd(),
      "src/screens/tournament-workspace/TournamentWorkspaceScreen.tsx"
    );
    let screenExists = true;
    try {
      await fs.access(oldScreenPath);
    } catch {
      screenExists = false;
    }
    expect(screenExists).toBe(false);

    // Audit nav component to ensure no href="#..." remains
    const navContent = await fs.readFile(
      path.join(
        process.cwd(),
        "src/screens/tournament-workspace/TournamentWorkspaceNavigation.tsx"
      ),
      "utf8"
    );
    expect(navContent).not.toMatch(/href="#(teams|scoring|matches|standings)"/);
  });
});

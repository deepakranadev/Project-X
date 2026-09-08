import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("Static Architecture Boundaries", () => {
  it("Formik remains absent from MatchEntry", () => {
    const matchEntryCode = readFileSync(
      join(process.cwd(), "src/features/matches/components/MatchEntry.tsx"),
      "utf8",
    );
    expect(matchEntryCode).not.toContain("useFormik");
    expect(matchEntryCode).not.toContain("formik");
  });

  it("Formik remains absent from TeamBulkForm and useTeamBulkEntry", () => {
    const teamBulkFormCode = readFileSync(
      join(process.cwd(), "src/features/teams/components/TeamBulkForm.tsx"),
      "utf8",
    );
    expect(teamBulkFormCode).not.toContain("useFormik");
    expect(teamBulkFormCode).not.toContain("formik");

    const useTeamBulkEntryCode = readFileSync(
      join(process.cwd(), "src/features/teams/useTeamBulkEntry.ts"),
      "utf8",
    );
    expect(useTeamBulkEntryCode).not.toContain("useFormik");
    expect(useTeamBulkEntryCode).not.toContain("formik");
  });
});

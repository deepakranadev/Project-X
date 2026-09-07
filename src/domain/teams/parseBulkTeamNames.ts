import {
  MAX_TEAM_NAME_LENGTH,
  normalizeTeamNameKey,
  normalizeTeamWhitespace,
} from "./validation";
import type { Team } from "./types";

export type BulkTeamParseIssueCode =
  | "EMPTY_BATCH"
  | "NAME_TOO_LONG"
  | "DUPLICATE_IN_BATCH"
  | "DUPLICATE_EXISTING";

export interface BulkTeamCandidate {
  readonly lineNumber: number;
  readonly name: string;
  readonly normalizedName: string;
}

export interface BulkTeamParseIssue {
  readonly code: BulkTeamParseIssueCode;
  readonly message: string;
  readonly lineNumbers: readonly number[];
}

export interface BulkTeamParseResult {
  readonly detectedCount: number;
  readonly candidates: readonly BulkTeamCandidate[];
  readonly issues: readonly BulkTeamParseIssue[];
}

export function parseBulkTeamNames(input: string): BulkTeamParseResult {
  const candidates: BulkTeamCandidate[] = [];
  const issues: BulkTeamParseIssue[] = [];

  input.split(/\r\n|\n|\r/).forEach((line, index) => {
    const name = normalizeTeamWhitespace(line);
    if (name.length === 0) return;

    const lineNumber = index + 1;
    const normalizedName = normalizeTeamNameKey(name);
    candidates.push({ lineNumber, name, normalizedName });

    if (name.length > MAX_TEAM_NAME_LENGTH) {
      issues.push({
        code: "NAME_TOO_LONG",
        lineNumbers: [lineNumber],
        message: `Line ${lineNumber} is longer than ${MAX_TEAM_NAME_LENGTH} characters. Shorten that team name.`,
      });
    }
  });

  if (candidates.length === 0) {
    issues.push({
      code: "EMPTY_BATCH",
      lineNumbers: [],
      message: "Paste at least one team name.",
    });
  }

  const firstLineByName = new Map<string, BulkTeamCandidate>();
  for (const candidate of candidates) {
    const first = firstLineByName.get(candidate.normalizedName);
    if (first) {
      issues.push({
        code: "DUPLICATE_IN_BATCH",
        lineNumbers: [first.lineNumber, candidate.lineNumber],
        message: `Lines ${first.lineNumber} and ${candidate.lineNumber} both resolve to “${first.name}”. Rename or remove one before adding teams.`,
      });
    } else {
      firstLineByName.set(candidate.normalizedName, candidate);
    }
  }

  return { detectedCount: candidates.length, candidates, issues };
}

export function validateBulkTeamNames(
  input: string,
  existingTeams: readonly Team[],
): BulkTeamParseResult {
  const parsed = parseBulkTeamNames(input);
  const existingByName = new Map(
    existingTeams.map((team) => [normalizeTeamNameKey(team.name), team]),
  );
  const issues = [...parsed.issues];

  for (const candidate of parsed.candidates) {
    const existing = existingByName.get(candidate.normalizedName);
    if (existing) {
      issues.push({
        code: "DUPLICATE_EXISTING",
        lineNumbers: [candidate.lineNumber],
        message: `Line ${candidate.lineNumber}, “${candidate.name}”, matches existing team “${existing.name}”. Rename it or edit the existing team.`,
      });
    }
  }

  return { ...parsed, issues };
}

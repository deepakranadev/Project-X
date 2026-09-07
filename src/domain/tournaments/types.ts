import type { ScoringConfig } from "@/domain/scoring/types";

export const TOURNAMENT_GAMES = ["BGMI"] as const;

export type TournamentGame = (typeof TOURNAMENT_GAMES)[number];

export type SupportedImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export interface PersistedImage {
  readonly blob: Blob;
  readonly fileName: string;
}

/** Kept as an alias so Task 002A callers remain source-compatible. */
export type TournamentImage = PersistedImage;

export interface Tournament {
  readonly id: string;
  readonly name: string;
  readonly game: TournamentGame;
  readonly tournamentLogo: TournamentImage | null;
  readonly organizerName: string | null;
  readonly organizerLogo: TournamentImage | null;
  readonly scoringConfig: ScoringConfig;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateTournamentInput {
  readonly name: string;
  readonly game: string;
  readonly tournamentLogo: TournamentImage | null;
  readonly organizerName: string;
  readonly organizerLogo: TournamentImage | null;
}

export type TournamentUpdate = Partial<
  Pick<
    Tournament,
    | "name"
    | "game"
    | "tournamentLogo"
    | "organizerName"
    | "organizerLogo"
    | "scoringConfig"
  >
>;

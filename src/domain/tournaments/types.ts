import type { ScoringConfig } from "@/domain/scoring/types";

export const TOURNAMENT_GAMES = ["BGMI"] as const;

export type TournamentGame = (typeof TOURNAMENT_GAMES)[number];

export interface Tournament<Image = unknown> {
  readonly id: string;
  readonly name: string;
  readonly game: TournamentGame;
  readonly tournamentLogo: Image | null;
  readonly organizerName: string | null;
  readonly organizerLogo: Image | null;
  readonly scoringConfig: ScoringConfig;
  readonly createdAt: string;
  readonly updatedAt: string;
}

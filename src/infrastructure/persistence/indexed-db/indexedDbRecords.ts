import type {
  MatchStatus,
  ParticipationStatus,
} from "@/domain/matches/types";
import type { ScoringConfig } from "@/domain/scoring/types";
import type { PersistedImage } from "@/infrastructure/browser/persistedImage";

export interface TournamentRecord {
  readonly id: string;
  readonly name: string;
  readonly game: "BGMI";
  readonly tournamentLogo: PersistedImage | null;
  readonly organizerName: string | null;
  readonly organizerLogo: PersistedImage | null;
  readonly scoringConfig: unknown;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WritableTournamentRecord
  extends Omit<TournamentRecord, "scoringConfig"> {
  readonly scoringConfig: ScoringConfig;
}

export interface TeamRecord {
  readonly id: string;
  readonly tournamentId: string;
  readonly name: string;
  readonly shortName: string | null;
  readonly slotNumber: number | null;
  readonly logo: PersistedImage | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MatchRecord {
  readonly id: string;
  readonly tournamentId: string;
  readonly matchNumber: number;
  readonly name?: string;
  readonly status: MatchStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MatchResultRecord {
  readonly id: string;
  readonly tournamentId: string;
  readonly matchId: string;
  readonly teamId: string;
  readonly placement: number | null;
  readonly kills: number | null;
  readonly participationStatus: ParticipationStatus;
  readonly source: "MANUAL";
  readonly createdAt: string;
  readonly updatedAt: string;
}

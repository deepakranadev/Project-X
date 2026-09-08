import type { GuestTeamRepository } from "@/features/teams/teamRepository";

import type { MatchLifecycleRepository } from "./matchLifecycleRepository";
import type { MatchRepository } from "./matchRepository";
import type { MatchResultRepository } from "./matchResultRepository";

export interface MatchFeatureRepositories {
  readonly lifecycle: MatchLifecycleRepository;
  readonly matches: MatchRepository;
  readonly results: MatchResultRepository;
  readonly teams: Pick<GuestTeamRepository, "listTeamsByTournament">;
}

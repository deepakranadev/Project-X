export interface Team<Image = unknown> {
  readonly id: string;
  readonly tournamentId: string;
  readonly name: string;
  readonly shortName: string | null;
  readonly slotNumber: number | null;
  readonly logo: Image | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

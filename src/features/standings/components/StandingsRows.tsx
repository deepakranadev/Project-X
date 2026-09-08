import type { GuestOverallStandingsSnapshot } from "@/features/standings/loadGuestOverallStandings";

export function StandingsRows({ snapshot }: { readonly snapshot: GuestOverallStandingsSnapshot }) {
  const teamById = new Map(snapshot.teams.map((team) => [team.id, team]));
  const unknownTeamCount = snapshot.standings.filter((row) => !teamById.has(row.teamId)).length;

  return (
    <>
      {unknownTeamCount > 0 ? (
        <p className="border-b border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-200 sm:px-6" role="alert">
          {unknownTeamCount === 1
            ? "One finalized result references a team no longer in this roster."
            : `${unknownTeamCount} finalized results reference teams no longer in this roster.`}
        </p>
      ) : null}

      <ol className="divide-y divide-white/6 sm:hidden" data-standings-mobile>
        {snapshot.standings.map((row) => {
          const name = teamById.get(row.teamId)?.name ?? `Unknown team (${row.teamId})`;
          return (
            <li className="grid grid-cols-[2.25rem_minmax(0,1fr)_3.5rem] gap-2 px-3 py-3.5" key={row.teamId} data-standing-team={row.teamId}>
              <span className="pt-0.5 text-base font-black tabular-nums text-lime-300">#{row.rank}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{name}</p>
                <dl className="mt-2 grid grid-cols-3 gap-2">
                  <StandingMetric label="MP" value={row.matchesPlayed} />
                  <StandingMetric label="Place pts" value={row.placementPoints} />
                  <StandingMetric label="Finish pts" value={row.killPoints} />
                </dl>
              </div>
              <div className="text-right">
                <span className="block text-xs font-black uppercase tracking-wide text-slate-500">Total</span>
                <strong className="mt-0.5 block text-xl font-black tabular-nums text-white">{row.totalPoints}</strong>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="hidden sm:block">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="bg-white/2 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-16 px-6 py-3">Rank</th>
              <th className="px-3 py-3">Team</th>
              <th className="w-24 px-3 py-3 text-right">Played</th>
              <th className="w-28 px-3 py-3 text-right">Place pts</th>
              <th className="w-28 px-3 py-3 text-right">Finish pts</th>
              <th className="w-24 px-6 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {snapshot.standings.map((row) => (
              <tr key={row.teamId} data-standing-team={row.teamId}>
                <td className="px-6 py-4 font-black tabular-nums text-lime-300">#{row.rank}</td>
                <td className="truncate px-3 py-4 font-black text-white">{teamById.get(row.teamId)?.name ?? `Unknown team (${row.teamId})`}</td>
                <td className="px-3 py-4 text-right font-bold tabular-nums text-slate-300">{row.matchesPlayed}</td>
                <td className="px-3 py-4 text-right font-bold tabular-nums text-slate-300">{row.placementPoints}</td>
                <td className="px-3 py-4 text-right font-bold tabular-nums text-slate-300">{row.killPoints}</td>
                <td className="px-6 py-4 text-right text-lg font-black tabular-nums text-white">{row.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StandingMetric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</dt>
      <dd className="mt-0.5 text-sm font-black tabular-nums text-slate-300">{value}</dd>
    </div>
  );
}

import type { Metadata } from "next";

import { CreateTournamentScreen } from "@/screens/create-tournament/CreateTournamentScreen";

export const metadata: Metadata = {
  title: "Create tournament",
};

export default function NewTournamentPage() {
  return <CreateTournamentScreen />;
}

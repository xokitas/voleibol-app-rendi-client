import { useCallback } from "react";
import type { CategoryStats } from "../../components/results/StatsPanel";
import { exportToPDF } from "../../lib/exportToPDF";
import type { Match } from "../../src/store/useMatchStore";

interface MatchExportData {
  match: Match;
  teamAPlayers: { number: string; fullName: string; team: string }[];
  teamBPlayers: { number: string; fullName: string; team: string }[];
  playerStats: Record<
    string,
    {
      totalActions: number;
      errors: number;
      effectiveness: number;
      errorEffectiveness: number;
      categories: Record<string, CategoryStats>;
    }
  >;
  teamAggregatedStats: {
    A: { totalActions: number; errors: number; effectiveness: number };
    B: { totalActions: number; errors: number; effectiveness: number };
  };
  formatDate: (iso: string) => string;
  getWinner: () => string;
}

export const useExportMatchPDF = (data: MatchExportData) => {
  const {
    match,
    teamAPlayers,
    teamBPlayers,
    playerStats,
    teamAggregatedStats,
    formatDate,
    getWinner,
  } = data;

  const handleExportPDF = useCallback(async () => {
    const winner = getWinner();
    const date = formatDate(match.config.date);

    const buildRows = (players: typeof teamAPlayers) =>
      players
        .map((player) => {
          const pId = `${player.team}-${player.number}`;
          const s = playerStats[pId];
          return `
          <tr>
            <td>#${player.number} ${player.fullName}</td>
            <td>${s?.totalActions || 0}</td>
            <td>${s?.errors || 0}</td>
            <td>${s?.effectiveness.toFixed(0) || 0}%</td>
          </tr>`;
        })
        .join("");

    const html = `
      <html>
        <head><meta charset="utf-8" /><style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #003366; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
          th { background-color: #f0f0f0; }
        </style></head>
        <body>
          <h1>${match.config.tournament || "Partido"}</h1>
          <p><strong>Fecha:</strong> ${date}</p>
          <p><strong>Categoría:</strong> ${match.config.category} | <strong>Rama:</strong> ${match.config.gender || "No definida"}</p>
          <h2>Resultado</h2>
          <p>${match.config.teamA.name} ${match.score.setsA} - ${match.score.setsB} ${match.config.teamB.name}</p>
          <p><strong>Ganador:</strong> ${winner}</p>

          <h2>${match.config.teamA.name}</h2>
          <table><tr><th>Jugador</th><th>Acciones</th><th>Errores</th><th>Efectividad</th></tr>${buildRows(teamAPlayers)}</table>

          <h2>${match.config.teamB.name}</h2>
          <table><tr><th>Jugador</th><th>Acciones</th><th>Errores</th><th>Efectividad</th></tr>${buildRows(teamBPlayers)}</table>
        </body>
      </html>`;

    await exportToPDF(html, `Partido_${match.id}.pdf`);
  }, [
    match,
    teamAPlayers,
    teamBPlayers,
    playerStats,
    teamAggregatedStats,
    formatDate,
    getWinner,
  ]);

  return { handleExportPDF };
};

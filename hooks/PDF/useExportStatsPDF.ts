import { useCallback } from "react";
import type { CategoryStats } from "../../components/results/StatsPanel";
import { exportToPDF } from "../../lib/exportToPDF";

interface StatsExportData {
  playerName: string;
  teamName: string;
  matchesPlayed: number;
  generalStats: {
    general: {
      totalActions: number;
      errors: number;
      efficiency: number;
    };
  };
  categoriesMap: Record<string, CategoryStats>;
}

export const useExportStatsPDF = (data: StatsExportData) => {
  const { playerName, teamName, matchesPlayed, generalStats, categoriesMap } =
    data;

  const handleExportPDF = useCallback(async () => {
    const title = playerName || teamName || "Estadísticas";
    const subtitle =
      playerName && teamName ? `${playerName} en ${teamName}` : "";

    const categoryRows = Object.entries(categoriesMap)
      .map(([cat, catData]) => {
        return `
        <tr>
          <td><strong>${cat}</strong></td>
          <td>${catData.total}</td>
          <td>${catData.positive}</td>
          <td>${catData.negative}</td>
          <td>${catData.effectiveness.toFixed(0)}%</td>
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
          <h1>Reporte de ${title}</h1>
          ${subtitle ? `<p><strong>${subtitle}</strong></p>` : ""}
          <p>Basado en ${matchesPlayed} partido(s)</p>
          <h2>Resumen</h2>
          <p>Total acciones: ${generalStats.general.totalActions}</p>
          <p>Errores: ${generalStats.general.errors}</p>
          <p>Efectividad: ${generalStats.general.efficiency}%</p>
          <h2>Desglose por categoría</h2>
          <table>
            <tr><th>Categoría</th><th>Total</th><th>Positivos</th><th>Negativos</th><th>Efectividad</th></tr>
            ${categoryRows}
          </table>
        </body>
      </html>`;

    await exportToPDF(html, `Estadisticas_${title}.pdf`);
  }, [playerName, teamName, matchesPlayed, generalStats, categoriesMap]);

  return { handleExportPDF };
};

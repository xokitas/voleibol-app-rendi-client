// utils/exportPdf.ts
import { CategoryStats } from "../components/results/StatsPanel";

// utils/exportPdf.ts

/**
 * Imprime un HTML inyectándolo en el DOM principal.
 * Esta es la ÚNICA forma segura de imprimir PDFs vectoriales y paginados
 * en aplicaciones de escritorio empaquetadas con TAURI, evitando el bloqueo de iframes.
 */
function printHTML(html: string, title: string): Promise<void> {
  return new Promise((resolve) => {
    // 1. Guardar el título original de la app
    const originalTitle = document.title;
    document.title = title;

    // 2. Crear un contenedor temporal para nuestro reporte
    const printContainer = document.createElement("div");
    printContainer.id = "tauri-print-container";
    printContainer.innerHTML = html;

    // 3. Crear estilos mágicos para engañar a Expo Web y Tauri
    const style = document.createElement("style");
    style.id = "tauri-print-style";
    style.innerHTML = `
      /* Ocultar el reporte en la pantalla normal */
      @media screen {
        #tauri-print-container {
          display: none !important;
        }
      }
      
      /* Reglas exclusivas para cuando Tauri lanza el cuadro de impresión */
      @media print {
        /* Ocultar toda la app de React Native (usualmente el #root) */
        body > *:not(#tauri-print-container):not(#tauri-print-style) {
          display: none !important;
        }
        
        /* DESTRUIR el "overflow: hidden" que Expo le pone al body por defecto.
           Si no hacemos esto, el PDF siempre saldrá recortado a 1 sola página */
        html, body {
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
          width: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: white !important;
        }
        
        #tauri-print-container {
          display: block !important;
          position: relative;
          width: 100%;
        }
      }
    `;

    // 4. Inyectar al DOM
    document.head.appendChild(style);
    document.body.appendChild(printContainer);

    // 5. Darle medio segundo al WebView para renderizar el CSS y lanzar impresión nativa
    setTimeout(() => {
      window.print();

      // 6. Limpieza profunda tras cerrar el cuadro de diálogo
      document.title = originalTitle;
      document.head.removeChild(style);
      document.body.removeChild(printContainer);
      resolve();
    }, 500);
  });
}

// ... EL RESTO DE TU ARCHIVO SE MANTIENE EXACTAMENTE IGUAL ...

// -----------------------------------------------------------
// Exportación de estadísticas agregadas
export async function exportStatsToPDF(
  title: string,
  totalActions: number,
  errors: number,
  efficiency: number,
  categoriesMap: Record<string, CategoryStats>,
  matchIds?: string[],
  matches?: any[],
) {
  let matchesHtml = "";
  if (matches && matches.length > 0) {
    matchesHtml = matches
      .map(
        (m) =>
          `<li>${m.config.tournament || m.config.denomination || "Partido"} – ${m.config.teamA.name} vs ${m.config.teamB.name}</li>`,
      )
      .join("");
  } else if (matchIds) {
    matchesHtml = `<p>${matchIds.length} partido(s) seleccionado(s).</p>`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1, h2, h3 { color: #003366; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; page-break-inside: avoid; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
          th { background-color: #f8fafc; font-weight: bold; }
          .summary { font-size: 16px; margin-bottom: 20px; background: #f1f5f9; padding: 15px; border-radius: 8px; }
          ul { list-style-type: none; padding: 0; }
          li { margin: 5px 0; font-size: 14px; }
          /* Reglas para paginación en PDF */
          @media print {
            .page-break { page-break-before: always; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="summary">
          <p><strong>Total Acciones:</strong> ${totalActions}</p>
          <p><strong>Errores:</strong> ${errors}</p>
          <p><strong>Efectividad:</strong> ${efficiency}%</p>
        </div>

        <h2>Desglose por Categorías</h2>
        <table>
          <tr><th>Categoría</th><th>Total</th><th>Positivas</th><th>Negativas</th><th>Efectividad</th></tr>
          ${Object.entries(categoriesMap)
            .map(
              ([cat, data]) => `
            <tr>
              <td><strong>${cat}</strong></td>
              <td>${data.total}</td>
              <td>${data.positive}</td>
              <td>${data.negative}</td>
              <td><strong>${data.effectiveness.toFixed(1)}%</strong></td>
            </tr>
          `,
            )
            .join("")}
        </table>

        <div class="page-break"></div>
        <h2>Desglose de Subacciones</h2>
        ${Object.entries(categoriesMap)
          .map(
            ([cat, data]) => `
          <h3>${cat}</h3>
          <table>
            <tr><th>Subacción</th><th>Total</th><th>Positivas</th><th>Negativas</th><th>Efectividad</th></tr>
            ${Object.entries(data.subs)
              .map(
                ([sub, subData]) => `
              <tr>
                <td>${sub}</td>
                <td>${subData.total}</td>
                <td>${subData.positive}</td>
                <td>${subData.negative}</td>
                <td>${subData.effectiveness.toFixed(1)}%</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        `,
          )
          .join("")}

        <h2>Partidos incluidos en el análisis</h2>
        <ul>${matchesHtml}</ul>
      </body>
    </html>
  `;

  await printHTML(html, title);
}

export const useExportStatsPDF = (params: any) => {
  const handleExportPDF = async () => {
    const {
      playerName,
      teamName,
      matchesPlayed,
      generalStats,
      categoriesMap,
      matchIds,
      matches,
    } = params;
    const title = `Estadísticas${playerName ? ` de ${playerName}` : teamName ? ` del equipo ${teamName}` : ""} (${matchesPlayed} partidos)`;

    await exportStatsToPDF(
      title,
      generalStats.general.totalActions,
      generalStats.general.errors,
      generalStats.general.efficiency,
      categoriesMap,
      matchIds,
      matches,
    );
  };
  return { handleExportPDF };
};

// -----------------------------------------------------------
// Exportación del detalle de un partido (todas las acciones)
export async function exportMatchToPDF(
  match: any,
  teamAPlayers: any[],
  teamBPlayers: any[],
  playerStats: Record<string, any>,
  teamAggregatedStats: { A: any; B: any },
  formatDate: (iso: string) => string,
  getWinner: () => string,
) {
  const actionsHtml = match.history
    .map(
      (set: any) => `
    <h3>Set ${set.set}</h3>
    ${set.rallies
      .map(
        (rally: any, idx: number) => `
      <p style="margin-bottom: 5px;"><strong>Rally ${idx + 1}</strong> (${rally.scoreAtTheTime.A}-${rally.scoreAtTheTime.B}) → Ganador: <strong>${rally.winner === "A" ? match.config.teamA.name : match.config.teamB.name}</strong></p>
      <table>
        <tr><th>Jugador</th><th>Acción</th><th>Valor</th><th>Origen</th><th>Destino</th></tr>
        ${rally.actions
          .map(
            (action: any) => `
          <tr>
            <td>${action.playerId}</td>
            <td>${action.category} / ${action.subAction}</td>
            <td><strong>${action.value !== undefined ? action.value : "-"}</strong></td>
            <td>${action.origin || "-"}</td>
            <td>${action.destination || "-"}</td>
          </tr>
        `,
          )
          .join("")}
      </table>
    `,
      )
      .join("")}
  `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Partido</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #003366; text-align: center; border-bottom: 2px solid #003366; padding-bottom: 10px; }
          h2 { color: #003366; margin-top: 30px; }
          h3 { color: #475569; margin-bottom: 10px; }
          p { margin: 5px 0; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; page-break-inside: avoid; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f8fafc; font-weight: bold; }
          .header-info { text-align: center; margin-bottom: 30px; font-size: 14px; }
          
          /* Reglas para paginación en PDF */
          @media print {
            .page-break { page-break-before: always; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <h1>${match.config.tournament || "Reporte de Partido"}</h1>
        <div class="header-info">
          <p><strong>Fecha:</strong> ${formatDate(match.config.date)} ${match.config.startTime ? `· ${match.config.startTime}` : ""}</p>
          <p><strong>Categoría:</strong> ${match.config.category} · ${match.config.gender === "M" ? "Masculino" : "Femenino"}</p>
          <p><strong>Equipos:</strong> ${match.config.teamA.name} vs ${match.config.teamB.name}</p>
          <p style="font-size: 16px; margin-top: 10px; color: #16a34a;"><strong>🏆 Ganador: ${getWinner()}</strong></p>
        </div>

        <h2>Resumen por Equipos</h2>
        
        <h3>${match.config.teamA.name}</h3>
        <table>
          <tr><th>Jugador</th><th>Acciones</th><th>Errores</th><th>Efectividad</th></tr>
          ${teamAPlayers
            .map((p: any) => {
              const stats = playerStats[`A-${p.number}`];
              if (!stats) return "";
              return `<tr><td>#${p.number} ${p.fullName}</td><td>${stats.totalActions}</td><td>${stats.errors}</td><td><strong>${stats.effectiveness.toFixed(1)}%</strong></td></tr>`;
            })
            .join("")}
        </table>
        
        <h3>${match.config.teamB.name}</h3>
        <table>
          <tr><th>Jugador</th><th>Acciones</th><th>Errores</th><th>Efectividad</th></tr>
          ${teamBPlayers
            .map((p: any) => {
              const stats = playerStats[`B-${p.number}`];
              if (!stats) return "";
              return `<tr><td>#${p.number} ${p.fullName}</td><td>${stats.totalActions}</td><td>${stats.errors}</td><td><strong>${stats.effectiveness.toFixed(1)}%</strong></td></tr>`;
            })
            .join("")}
        </table>

        <div class="page-break"></div>
        
        <h2>Desarrollo del Partido (Historial de Acciones)</h2>
        ${actionsHtml}
      </body>
    </html>
  `;

  const fileName = `Partido_${match.config.teamA.name}_vs_${match.config.teamB.name}`;
  await printHTML(html, fileName);
}

export const useExportMatchPDF = (params: any) => {
  const handleExportPDF = async () => {
    const {
      match,
      teamAPlayers,
      teamBPlayers,
      playerStats,
      teamAggregatedStats,
      formatDate,
      getWinner,
    } = params;
    await exportMatchToPDF(
      match,
      teamAPlayers,
      teamBPlayers,
      playerStats,
      teamAggregatedStats,
      formatDate,
      getWinner,
    );
  };
  return { handleExportPDF };
};

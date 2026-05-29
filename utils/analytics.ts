// utils/analytics.ts
import { CategoryStats } from "../components/results/StatsPanel";

export const actionAllowedValues: Record<string, number[]> = {
  SFC: [0],
  SR: [0],
  SME: [0],
  CI: [0],
  MC: [0],
  NAT: [0],
  CJR: [0],
  MCA: [0],
  JFZ: [0],
  GMD: [0],
  TI: [0],
  MER: [0],
  BTR: [0],
  Bn: [0, 1, 2, 3],
  "2ma": [0, 1, 2, 3],
  Ppm: [0, 1, 2, 3],
  P2a: [0, 1, 2, 3],
  P2b: [0, 1, 2, 3],
  Dd: [0, 1, 2, 3],
  Dltd: [0, 1, 2, 3],
  Rca: [4],
  Ub: [4],
  Acd: [4],
  Rdjn: [4],
  Rdpmp: [4],
  Rd: [4],
};

export const ALL_SUB_ACTIONS: Record<string, string[]> = {
  SERVICIO: ["BAJ", "FLO", "SAL", "SAF"],
  RECEPCION: ["2ma", "Ppm"],
  ACOMODADA: ["P2a", "P2b"],
  ATAQUE: ["Rm", "Rca", "Ub", "Tr", "Acd", "Rdjn", "Rdpmp", "Rd"],
  BLOQUEO: ["Bl", "Bd", "Bn"],
  DEFENSA: ["Dd", "Dltd", "Ld", "Cc"],
  ERRORES_SERV: ["SFC", "SR", "SME"],
  ERRORES_COM: ["CI", "MC"],
  ERRORES_POS: ["NAT", "CJR", "MCA", "JFZ"],
  ERRORES_TEC: ["GMD", "TI", "MER", "BTR"],
};

export function computeCategoriesAndRadar(
  aggregatedActions: { category: string; subAction: string; value?: number }[],
): {
  categoriesMap: Record<string, CategoryStats>;
  radarData: { label: string; value: number }[];
} {
  const categories: Record<string, CategoryStats> = {};
  // Inicializar
  Object.entries(ALL_SUB_ACTIONS).forEach(([cat, subs]) => {
    categories[cat] = {
      total: 0,
      positive: 0,
      negative: 0,
      effectiveness: 0,
      subs: {},
    };
    subs.forEach((sub) => {
      categories[cat].subs[sub] = {
        total: 0,
        positive: 0,
        negative: 0,
        effectiveness: 0,
      };
    });
  });

  let errorPos = 0,
    errorNeg = 0,
    errorTotal = 0;

  aggregatedActions.forEach((action) => {
    const cat = action.category;
    const sub = action.subAction;
    const val = action.value ?? 0; // valor por defecto 0 si es undefined
    const allowed = actionAllowedValues[sub];
    const maxVal = allowed ? Math.max(...allowed) : 4;
    const isPositive = val === maxVal;
    const isNegative = val === 0;

    if (!categories[cat]) {
      categories[cat] = {
        total: 0,
        positive: 0,
        negative: 0,
        effectiveness: 0,
        subs: {},
      };
    }
    categories[cat].total++;
    if (isPositive) categories[cat].positive++;
    if (isNegative) categories[cat].negative++;

    if (!categories[cat].subs[sub]) {
      categories[cat].subs[sub] = {
        total: 0,
        positive: 0,
        negative: 0,
        effectiveness: 0,
      };
    }
    categories[cat].subs[sub].total++;
    if (isPositive) categories[cat].subs[sub].positive++;
    if (isNegative) categories[cat].subs[sub].negative++;

    if (cat.startsWith("ERRORES")) {
      errorTotal++;
      if (isPositive) errorPos++;
      if (isNegative) errorNeg++;
    }
  });

  // Calcular efectividades
  Object.values(categories).forEach((catData) => {
    catData.effectiveness =
      catData.total > 0
        ? ((catData.positive - catData.negative) / catData.total) * 100
        : 0;
    Object.values(catData.subs).forEach((subData) => {
      subData.effectiveness =
        subData.total > 0
          ? ((subData.positive - subData.negative) / subData.total) * 100
          : 0;
    });
  });

  const errorEff =
    errorTotal > 0 ? ((errorPos - errorNeg) / errorTotal) * 100 : 0;
  const radar = [
    ...Object.entries(categories)
      .filter(([cat]) => !cat.startsWith("ERRORES"))
      .map(([cat, data]) => ({
        label: cat.substring(0, 4),
        value: Math.max(0, data.effectiveness),
      })),
    { label: "Errores", value: Math.max(0, errorEff) },
  ];

  return { categoriesMap: categories, radarData: radar };
}

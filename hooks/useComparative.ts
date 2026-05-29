// hooks/useComparative.ts
import { useCallback, useState } from "react";

export interface ComparisonFilters {
  playerName: string;
  teamName: string;
  denomination: string;
  category: string;
  eventType: string;
  place: string;
  meso: string;
  micro: string;
  gender: string;
}

export interface ComparisonSet {
  filters: ComparisonFilters;
  matchIds: string[];
}

export function useComparative() {
  const [set1, setSet1] = useState<ComparisonSet | null>(null);
  const [set2, setSet2] = useState<ComparisonSet | null>(null);
  const [showModal, setShowModal] = useState(false);

  const saveSet1 = useCallback(
    (filters: ComparisonFilters, matchIds: Set<string>) => {
      setSet1({
        filters: { ...filters },
        matchIds: Array.from(matchIds),
      });
    },
    [],
  );

  const saveSet2 = useCallback(
    (filters: ComparisonFilters, matchIds: Set<string>) => {
      setSet2({
        filters: { ...filters },
        matchIds: Array.from(matchIds),
      });
    },
    [],
  );

  const clearSet1 = useCallback(() => setSet1(null), []);
  const clearSet2 = useCallback(() => setSet2(null), []);

  const clearComparison = useCallback(() => {
    setSet1(null);
    setSet2(null);
    setShowModal(false);
  }, []);

  const isComparisonMode = set1 !== null;

  return {
    set1,
    set2,
    showModal,
    setShowModal,
    saveSet1,
    saveSet2,
    clearSet1,
    clearSet2,
    clearComparison,
    isComparisonMode,
  };
}

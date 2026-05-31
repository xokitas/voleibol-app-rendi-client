// hooks/useGameTimers.ts
import { useEffect, useRef, useState } from "react";

export const useGameTimers = (
  initialTotal: number = 0,
  initialReal: number = 0,
) => {
  const [totalTime, setTotalTime] = useState(initialTotal);
  const [realTime, setRealTime] = useState(initialReal);
  const [isTotalTimeActive, setIsTotalTimeActive] = useState(false);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(initialTotal > 0);
  const totalStartTimeRef = useRef<number>(Date.now() - initialTotal * 1000);
  const realIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🔄 Reiniciar todo cuando cambian los tiempos iniciales (nuevo partido)
  useEffect(() => {
    setTotalTime(initialTotal);
    setRealTime(initialReal);
    setIsTotalTimeActive(false);
    setIsRealTimeActive(false);
    setHasStartedOnce(initialTotal > 0);
    totalStartTimeRef.current = Date.now() - initialTotal * 1000;
  }, [initialTotal, initialReal]);

  const startTotalTime = () => {
    if (!isTotalTimeActive) {
      totalStartTimeRef.current = Date.now() - totalTime * 1000;
      setIsTotalTimeActive(true);
    }
  };
  const stopTotalTime = () => setIsTotalTimeActive(false);

  const startRealTime = () => setIsRealTimeActive(true);
  const stopRealTime = () => setIsRealTimeActive(false);

  const resetTimers = () => {
    setTotalTime(0);
    setRealTime(0);
    setIsTotalTimeActive(false);
    setIsRealTimeActive(false);
    setHasStartedOnce(false);
  };

  // Total time basado en timestamps reales
  useEffect(() => {
    if (!isTotalTimeActive) return;
    const interval = setInterval(() => {
      setTotalTime(Math.floor((Date.now() - totalStartTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTotalTimeActive]);

  // Real time con intervalos normales
  useEffect(() => {
    if (isRealTimeActive) {
      realIntervalRef.current = setInterval(
        () => setRealTime((prev) => prev + 1),
        1000,
      );
    } else {
      if (realIntervalRef.current) clearInterval(realIntervalRef.current);
    }
    return () => {
      if (realIntervalRef.current) clearInterval(realIntervalRef.current);
    };
  }, [isRealTimeActive]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hrs, mins, secs].map((v) => (v < 10 ? "0" + v : v)).join(":");
  };

  return {
    totalTime,
    realTime,
    formattedTotalTime: formatTime(totalTime),
    formattedRealTime: formatTime(realTime),
    isRealTimeActive,
    isTotalTimeActive,
    startTotalTime,
    stopTotalTime,
    startRealTime,
    stopRealTime,
    resetTimers,
  };
};

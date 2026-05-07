import { useEffect, useRef, useState } from 'react';

export const useGameTimers = () => {
  const [totalTime, setTotalTime] = useState(0);
  const [realTime, setRealTime] = useState(0);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [isTotalTimeActive, setIsTotalTimeActive] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false); // Nuevo: rastreo de inicio único

  const totalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // El tiempo total solo se activa si no se había iniciado antes
  const startTotalTime = () => {
    if (!hasStartedOnce) {
      setIsTotalTimeActive(true);
      setHasStartedOnce(true);
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

  useEffect(() => {
    if (isTotalTimeActive) {
      totalIntervalRef.current = setInterval(() => {
        setTotalTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (totalIntervalRef.current) clearInterval(totalIntervalRef.current);
    }
    return () => { if (totalIntervalRef.current) clearInterval(totalIntervalRef.current); };
  }, [isTotalTimeActive]);

  useEffect(() => {
    if (isRealTimeActive) {
      realIntervalRef.current = setInterval(() => {
        setRealTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (realIntervalRef.current) clearInterval(realIntervalRef.current);
    }
    return () => { if (realIntervalRef.current) clearInterval(realIntervalRef.current); };
  }, [isRealTimeActive]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hrs, mins, secs].map((v) => (v < 10 ? '0' + v : v)).join(':');
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
import type { AppState } from "@/lib/types";

import { useEffect, useState } from "react";

import { loadState, saveState } from "@/lib/storage";

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function defaultState(): AppState {
  return {
    subjects: [],
    settings: {
      startDate: todayIso(),
      weeksCount: 3,
      daysOff: [0],
    },
    workDays: [],
    lightDays: [],
    workSchedule: {
      pattern: "manual",
      cycleStartDate: todayIso(),
    },
    pomodoroSettings: {
      workMinutes: 25,
      breakMinutes: 5,
    },
    smartLoad: {
      enabled: true,
      age: 30,
    },
    notes: {},
    schedule: null,
  };
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() =>
    loadState<AppState>(defaultState()),
  );

  useEffect(() => {
    saveState(state);
  }, [state]);

  return [state, setState] as const;
}

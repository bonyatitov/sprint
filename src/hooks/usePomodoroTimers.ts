import type { PomodoroSettings } from "@/lib/types";

import { useEffect, useRef, useState } from "react";

export type PomodoroPhase = "work" | "break" | "done";

export interface PomodoroState {
  sessions: number[]; // work-session lengths in seconds, sum === budget
  sessionIndex: number;
  phase: PomodoroPhase;
  remainingSeconds: number;
  isRunning: boolean;
  completed: number;
  lastTickAt: number; // ms epoch — only meaningful while running
}

/** Splits `totalSeconds` into `count` work sessions as evenly as possible; every session differs by at most 1s. */
function splitIntoSessions(totalSeconds: number, count: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < count; i++) {
    const upTo = Math.floor(((i + 1) * totalSeconds) / count);
    const from = Math.floor((i * totalSeconds) / count);

    result.push(upTo - from);
  }

  return result;
}

/** Plans work sessions that sum exactly to the entry's budget — no leftover minutes. */
function planSessions(budgetMinutes: number, workMinutes: number): number[] {
  const totalSeconds = Math.max(0, Math.round(budgetMinutes * 60));
  const sessionCount = Math.max(
    1,
    Math.round(budgetMinutes / Math.max(1, workMinutes)),
  );

  return splitIntoSessions(totalSeconds, sessionCount);
}

function initialState(
  budgetMinutes: number,
  workMinutes: number,
): PomodoroState {
  const sessions = planSessions(budgetMinutes, workMinutes);

  return {
    sessions,
    sessionIndex: 0,
    phase: "work",
    remainingSeconds: sessions[0],
    isRunning: false,
    completed: 0,
    lastTickAt: Date.now(),
  };
}

function playChime() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.6);
    oscillator.onended = () => ctx.close();
  } catch {
    // Web Audio unavailable — skip the chime silently.
  }
}

/**
 * Advances a running timer by `elapsedSeconds` of real time, walking through
 * as many phase transitions as that time spans (work -> break -> work -> …).
 * This is what keeps the timer correct even when the tab was backgrounded and
 * the browser throttled `setInterval` to fire far less than once a second —
 * a single catch-up tick can legitimately cover several finished sessions.
 */
function advance(
  timer: PomodoroState,
  elapsedSeconds: number,
  breakSeconds: number,
): { state: PomodoroState; didTransition: boolean } {
  let remaining = timer.remainingSeconds;
  let phase = timer.phase;
  let sessionIndex = timer.sessionIndex;
  let completed = timer.completed;
  let isRunning = timer.isRunning;
  let left = elapsedSeconds;
  let didTransition = false;

  while (left > 0 && isRunning) {
    if (remaining > left) {
      remaining -= left;
      left = 0;
      break;
    }

    left -= remaining;
    didTransition = true;

    if (phase === "work") {
      completed += 1;

      const isLastSession = sessionIndex === timer.sessions.length - 1;

      if (isLastSession) {
        phase = "done";
        remaining = 0;
        isRunning = false;
        break;
      }

      phase = "break";
      remaining = breakSeconds;
    } else {
      sessionIndex += 1;
      phase = "work";
      remaining = timer.sessions[sessionIndex];
    }
  }

  return {
    state: {
      ...timer,
      sessionIndex,
      phase,
      remainingSeconds: remaining,
      isRunning,
      completed,
      lastTickAt: timer.lastTickAt + (elapsedSeconds - left) * 1000,
    },
    didTransition,
  };
}

export function usePomodoroTimers(settings: PomodoroSettings) {
  const [timers, setTimers] = useState<Record<string, PomodoroState>>({});
  const timersRef = useRef(timers);
  const settingsRef = useRef(settings);

  timersRef.current = timers;
  settingsRef.current = settings;

  useEffect(() => {
    const interval = setInterval(() => {
      const current = timersRef.current;
      const runningIds = Object.keys(current).filter(
        (id) => current[id].isRunning,
      );

      if (runningIds.length === 0) return;

      const now = Date.now();
      const breakSeconds = Math.max(
        1,
        Math.round(settingsRef.current.breakMinutes * 60),
      );
      const next = { ...current };
      let anyTransition = false;

      for (const id of runningIds) {
        const timer = current[id];
        const elapsedSeconds = Math.floor((now - timer.lastTickAt) / 1000);

        if (elapsedSeconds < 1) continue;

        const { state, didTransition } = advance(
          timer,
          elapsedSeconds,
          breakSeconds,
        );

        next[id] = state;
        if (didTransition) anyTransition = true;
      }

      if (anyTransition) playChime();
      setTimers(next);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const get = (id: string, budgetMinutes: number): PomodoroState =>
    timers[id] ?? initialState(budgetMinutes, settings.workMinutes);

  const toggle = (id: string, budgetMinutes: number) => {
    setTimers((prev) => {
      const current =
        prev[id] ?? initialState(budgetMinutes, settings.workMinutes);

      if (current.phase === "done") return prev;

      const isRunning = !current.isRunning;

      return {
        ...prev,
        [id]: {
          ...current,
          isRunning,
          // Restart the real-time clock the moment it's (re)started, so time
          // spent paused is never counted as elapsed.
          lastTickAt: isRunning ? Date.now() : current.lastTickAt,
        },
      };
    });
  };

  const reset = (id: string, budgetMinutes: number) => {
    setTimers((prev) => ({
      ...prev,
      [id]: initialState(budgetMinutes, settings.workMinutes),
    }));
  };

  return { get, toggle, reset };
}

export type UsePomodoroTimersReturn = ReturnType<typeof usePomodoroTimers>;

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

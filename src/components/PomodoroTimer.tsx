import { Button, Chip } from "@heroui/react";

import {
  formatClock,
  type UsePomodoroTimersReturn,
} from "@/hooks/usePomodoroTimers";
import { PauseIcon, PlayIcon, RefreshIcon } from "@/components/icons";

interface PomodoroTimerProps {
  id: string;
  budgetMinutes: number;
  pomodoro: UsePomodoroTimersReturn;
}

const PHASE_LABEL = {
  work: "Работа",
  break: "Перерыв",
  done: "Готово",
} as const;

const PHASE_COLOR = {
  work: "accent",
  break: "success",
  done: "default",
} as const;

export function PomodoroTimer({
  id,
  budgetMinutes,
  pomodoro,
}: PomodoroTimerProps) {
  const state = pomodoro.get(id, budgetMinutes);
  const isDone = state.phase === "done";

  return (
    <div className="flex items-center gap-2 rounded-lg bg-default/50 px-2 py-1.5">
      <Button
        isIconOnly
        aria-label={state.isRunning ? "Поставить на паузу" : "Запустить таймер"}
        isDisabled={isDone}
        size="sm"
        variant="ghost"
        onPress={() => pomodoro.toggle(id, budgetMinutes)}
      >
        {state.isRunning ? <PauseIcon /> : <PlayIcon />}
      </Button>

      <span className="w-12 font-mono text-sm tabular-nums">
        {formatClock(state.remainingSeconds)}
      </span>

      <Chip color={PHASE_COLOR[state.phase]} size="sm" variant="soft">
        <Chip.Label>{PHASE_LABEL[state.phase]}</Chip.Label>
      </Chip>

      {state.sessions.length > 1 && (
        <span className="text-xs text-muted">
          {Math.min(state.sessionIndex + 1, state.sessions.length)}/
          {state.sessions.length}
        </span>
      )}

      <Button
        isIconOnly
        aria-label="Сбросить таймер"
        className="ml-auto"
        size="sm"
        variant="ghost"
        onPress={() => pomodoro.reset(id, budgetMinutes)}
      >
        <RefreshIcon size={14} />
      </Button>
    </div>
  );
}

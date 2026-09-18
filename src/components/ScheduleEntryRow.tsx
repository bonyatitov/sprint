import type { ScheduleEntry, Subject } from "@/lib/types";
import type { UsePomodoroTimersReturn } from "@/hooks/usePomodoroTimers";

import { Button, Checkbox } from "@heroui/react";

import { formatMinutes } from "@/lib/schedule";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { NoteIcon } from "@/components/icons";

interface ScheduleEntryRowProps {
  date: string;
  entry: ScheduleEntry;
  subject: Subject;
  pomodoro: UsePomodoroTimersReturn;
  hasNote: boolean;
  onToggleDone: (done: boolean) => void;
  onOpenNote: () => void;
}

export function ScheduleEntryRow({
  date,
  entry,
  subject,
  pomodoro,
  hasNote,
  onToggleDone,
  onOpenNote,
}: ScheduleEntryRowProps) {
  const timerId = `${date}:${entry.subjectId}`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <Checkbox
          className="min-w-0 flex-1"
          isSelected={entry.done}
          onChange={onToggleDone}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <span
              className={
                entry.done ? "text-muted line-through" : "text-foreground"
              }
            >
              {subject.name} — {formatMinutes(entry.minutes)}
            </span>
          </Checkbox.Content>
        </Checkbox>

        <Button
          isIconOnly
          aria-label={hasNote ? "Открыть заметку" : "Добавить заметку"}
          size="sm"
          variant={hasNote ? "secondary" : "ghost"}
          onPress={onOpenNote}
        >
          <NoteIcon size={14} />
        </Button>
      </div>

      {entry.minutes > 0 && (
        <PomodoroTimer
          budgetMinutes={entry.minutes}
          id={timerId}
          pomodoro={pomodoro}
        />
      )}
    </div>
  );
}

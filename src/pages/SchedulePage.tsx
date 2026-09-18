import type { ScheduleDay, Subject } from "@/lib/types";
import type { UsePomodoroTimersReturn } from "@/hooks/usePomodoroTimers";

import { ScheduleView } from "@/components/ScheduleView";
import { ProgressSummary } from "@/components/ProgressSummary";

interface SchedulePageProps {
  schedule: ScheduleDay[] | null;
  subjects: Subject[];
  weeksCount: number;
  pomodoro: UsePomodoroTimersReturn;
  notes: Record<string, string>;
  onToggleEntry: (date: string, subjectId: string, done: boolean) => void;
  onToggleWorkDay: (date: string) => void;
  onOpenNote: (date: string, subjectId: string) => void;
}

export function SchedulePage({
  schedule,
  subjects,
  weeksCount,
  pomodoro,
  notes,
  onToggleEntry,
  onToggleWorkDay,
  onOpenNote,
}: SchedulePageProps) {
  return (
    <div className="flex flex-col gap-6">
      <ProgressSummary schedule={schedule} subjects={subjects} />

      {schedule && schedule.length > 0 ? (
        <ScheduleView
          notes={notes}
          pomodoro={pomodoro}
          schedule={schedule}
          subjects={subjects}
          weeksCount={weeksCount}
          onOpenNote={onOpenNote}
          onToggleEntry={onToggleEntry}
          onToggleWorkDay={onToggleWorkDay}
        />
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-separator text-center text-sm text-muted">
          Откройте «Настройки и планирование», заполните занятия и параметры
          спринта, затем нажмите «Сформировать расписание»
        </div>
      )}
    </div>
  );
}

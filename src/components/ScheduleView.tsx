import type { ScheduleDay, Subject } from "@/lib/types";
import type { UsePomodoroTimersReturn } from "@/hooks/usePomodoroTimers";

import { useMemo, useState } from "react";
import { Button, Card, ProgressBar, Tabs } from "@heroui/react";

import { formatDayLabel, formatMinutes } from "@/lib/schedule";
import { ScheduleEntryRow } from "@/components/ScheduleEntryRow";
import { BriefcaseIcon } from "@/components/icons";

interface ScheduleViewProps {
  schedule: ScheduleDay[];
  subjects: Subject[];
  weeksCount: number;
  pomodoro: UsePomodoroTimersReturn;
  notes: Record<string, string>;
  onToggleEntry: (date: string, subjectId: string, done: boolean) => void;
  onToggleWorkDay: (date: string) => void;
  onOpenNote: (date: string, subjectId: string) => void;
}

export function ScheduleView({
  schedule,
  subjects,
  weeksCount,
  pomodoro,
  notes,
  onToggleEntry,
  onToggleWorkDay,
  onOpenNote,
}: ScheduleViewProps) {
  const [week, setWeek] = useState("0");
  const subjectById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );

  const weeks = Array.from({ length: weeksCount }, (_, i) =>
    schedule.filter((day) => day.weekIndex === i),
  );

  return (
    <Tabs selectedKey={week} onSelectionChange={(k) => setWeek(String(k))}>
      <Tabs.ListContainer>
        <Tabs.List aria-label="Недели спринта">
          {weeks.map((_, i) => (
            <Tabs.Tab key={i} id={String(i)}>
              Неделя {i + 1}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>

      {weeks.map((days, i) => (
        <Tabs.Panel key={i} className="pt-4" id={String(i)}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {days.map((day) => (
              <DayCard
                key={day.date}
                day={day}
                notes={notes}
                pomodoro={pomodoro}
                subjectById={subjectById}
                onOpenNote={onOpenNote}
                onToggleEntry={onToggleEntry}
                onToggleWorkDay={onToggleWorkDay}
              />
            ))}
          </div>
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

interface DayCardProps {
  day: ScheduleDay;
  subjectById: Map<string, Subject>;
  pomodoro: UsePomodoroTimersReturn;
  notes: Record<string, string>;
  onToggleEntry: (date: string, subjectId: string, done: boolean) => void;
  onToggleWorkDay: (date: string) => void;
  onOpenNote: (date: string, subjectId: string) => void;
}

function DayCard({
  day,
  subjectById,
  pomodoro,
  notes,
  onToggleEntry,
  onToggleWorkDay,
  onOpenNote,
}: DayCardProps) {
  const dayTotal = day.entries.reduce((sum, e) => sum + e.minutes, 0);
  const dayDone = day.entries.reduce(
    (sum, e) => sum + (e.done ? e.minutes : 0),
    0,
  );

  const workDayToggle = (
    <Button
      isIconOnly
      aria-label={
        day.isWorkDay
          ? "Сделать этот день учебным"
          : "Отметить как рабочий день"
      }
      size="sm"
      variant={day.isWorkDay ? "secondary" : "ghost"}
      onPress={() => onToggleWorkDay(day.date)}
    >
      <BriefcaseIcon size={16} />
    </Button>
  );

  if (day.isWorkDay) {
    return (
      <Card variant="secondary">
        <Card.Header>
          <div className="flex items-start justify-between gap-2">
            <Card.Title className="text-base">
              {formatDayLabel(day.date)}
            </Card.Title>
            {workDayToggle}
          </div>
          <Card.Description>Рабочий день — занятий нет</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col items-center gap-2 py-8 text-center">
          <BriefcaseIcon className="text-muted" size={28} />
          <p className="text-sm text-muted">
            Смена. Часы остальных занятий перераспределены на свободные дни.
          </p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-start justify-between gap-2">
          <Card.Title className="text-base">
            {formatDayLabel(day.date)}
          </Card.Title>
          {workDayToggle}
        </div>
        <Card.Description>Итого: {formatMinutes(dayTotal)}</Card.Description>
        {dayTotal > 0 && (
          <ProgressBar
            className="mt-2"
            color={dayDone >= dayTotal ? "success" : "accent"}
            maxValue={dayTotal}
            minValue={0}
            size="sm"
            value={dayDone}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        )}
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {day.entries.map((entry) => {
          const subject = subjectById.get(entry.subjectId);

          if (!subject) return null;

          const noteKey = `${day.date}:${entry.subjectId}`;

          return (
            <ScheduleEntryRow
              key={entry.subjectId}
              date={day.date}
              entry={entry}
              hasNote={Boolean(notes[noteKey])}
              pomodoro={pomodoro}
              subject={subject}
              onOpenNote={() => onOpenNote(day.date, entry.subjectId)}
              onToggleDone={(done) =>
                onToggleEntry(day.date, entry.subjectId, done)
              }
            />
          );
        })}
      </Card.Content>
    </Card>
  );
}

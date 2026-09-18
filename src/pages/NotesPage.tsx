import type { ScheduleDay, Subject } from "@/lib/types";

import { Button, Card } from "@heroui/react";

import { formatDayLabel, formatMinutes } from "@/lib/schedule";
import { NoteIcon } from "@/components/icons";

interface NotesPageProps {
  schedule: ScheduleDay[] | null;
  subjects: Subject[];
  notes: Record<string, string>;
  onOpenNote: (date: string, subjectId: string) => void;
}

interface NoteRow {
  date: string;
  subject: Subject;
  minutes: number;
  text: string;
}

export function NotesPage({
  schedule,
  subjects,
  notes,
  onOpenNote,
}: NotesPageProps) {
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const rows: NoteRow[] = [];

  if (schedule) {
    for (const day of schedule) {
      for (const entry of day.entries) {
        const text = notes[`${day.date}:${entry.subjectId}`];

        if (!text) continue;

        const subject = subjectById.get(entry.subjectId);

        if (!subject) continue;

        rows.push({ date: day.date, subject, minutes: entry.minutes, text });
      }
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-separator text-center text-sm text-muted">
        <NoteIcon size={24} />
        Пока нет ни одной заметки. Добавьте её через иконку заметки на карточке
        занятия в расписании.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <Card key={`${row.date}:${row.subject.id}`}>
          <Card.Header>
            <div className="flex items-start justify-between gap-2">
              <div>
                <Card.Title className="text-base">
                  {row.subject.name}
                </Card.Title>
                <Card.Description>
                  {formatDayLabel(row.date)} · {formatMinutes(row.minutes)}
                </Card.Description>
              </div>
              <Button
                isIconOnly
                aria-label="Редактировать заметку"
                size="sm"
                variant="ghost"
                onPress={() => onOpenNote(row.date, row.subject.id)}
              >
                <NoteIcon size={14} />
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {row.text}
            </p>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

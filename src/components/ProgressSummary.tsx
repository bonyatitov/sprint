import type { ScheduleDay, Subject } from "@/lib/types";

import { Card, ProgressBar } from "@heroui/react";

import { computeProgress, formatMinutes } from "@/lib/schedule";

interface ProgressSummaryProps {
  schedule: ScheduleDay[] | null;
  subjects: Subject[];
}

export function ProgressSummary({ schedule, subjects }: ProgressSummaryProps) {
  const { overallTotal, overallDone, bySubject } = computeProgress(
    schedule,
    subjects,
  );
  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  if (overallTotal === 0) return null;

  return (
    <Card>
      <Card.Header>
        <Card.Title>Прогресс</Card.Title>
        <Card.Description>
          {formatMinutes(overallDone)} из {formatMinutes(overallTotal)}
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <ProgressBar maxValue={overallTotal} minValue={0} value={overallDone}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>

        {bySubject.map((p) => {
          const subject = subjectById.get(p.subjectId);

          if (!subject || p.totalMinutes === 0) return null;

          return (
            <div key={p.subjectId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span>{subject.name}</span>
                <span className="text-muted">
                  {formatMinutes(p.doneMinutes)} /{" "}
                  {formatMinutes(p.totalMinutes)}
                </span>
              </div>
              <ProgressBar
                color={subject.category === "extra" ? "default" : "accent"}
                maxValue={p.totalMinutes}
                minValue={0}
                size="sm"
                value={p.doneMinutes}
              >
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
            </div>
          );
        })}
      </Card.Content>
    </Card>
  );
}

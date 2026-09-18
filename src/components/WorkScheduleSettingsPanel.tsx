import type { WorkSchedulePattern, WorkScheduleSettings } from "@/lib/types";

import { Button, Card } from "@heroui/react";

import { WORK_SCHEDULE_CYCLES } from "@/lib/schedule";

export interface WorkScheduleSettingsPanelProps {
  settings: WorkScheduleSettings;
  workDaysCount: number;
  lightDaysCount: number;
  onChange: (patch: Partial<WorkScheduleSettings>) => void;
}

const PATTERN_ORDER: WorkSchedulePattern[] = ["manual", "1/3", "5/2", "2/2"];

export function WorkScheduleSettingsPanel({
  settings,
  workDaysCount,
  lightDaysCount,
  onChange,
}: WorkScheduleSettingsPanelProps) {
  const isManual = settings.pattern === "manual";
  const isFixedWeek = settings.pattern === "5/2";
  const blocksStudy =
    settings.pattern === "manual"
      ? true
      : WORK_SCHEDULE_CYCLES[settings.pattern].blocksStudy;

  return (
    <Card>
      <Card.Header>
        <Card.Title>Рабочий график</Card.Title>
        <Card.Description>
          {isManual
            ? "Отмечайте рабочие дни прямо на карточках дней — иконкой портфеля"
            : "Рабочие дни для выбранного графика подставляются автоматически на весь спринт"}
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {PATTERN_ORDER.map((pattern) => (
            <Button
              key={pattern}
              size="sm"
              variant={settings.pattern === pattern ? "secondary" : "ghost"}
              onPress={() => onChange({ pattern })}
            >
              {pattern === "manual"
                ? "Вручную"
                : WORK_SCHEDULE_CYCLES[pattern].label}
            </Button>
          ))}
        </div>

        {!isManual && (
          <>
            {isFixedWeek ? (
              <p className="text-sm text-muted">
                Рабочие дни: понедельник–пятница. Субботу и воскресенье график
                не трогает — это отдельно решают «Выходные дни» в параметрах
                спринта.
              </p>
            ) : (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">
                  Дата первого рабочего дня цикла
                </span>
                <input
                  className="rounded-lg border border-separator bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
                  type="date"
                  value={settings.cycleStartDate}
                  onChange={(e) => onChange({ cycleStartDate: e.target.value })}
                />
              </label>
            )}
            <p className="text-sm text-muted">
              {blocksStudy
                ? `Рабочих дней в спринте по этому графику: ${workDaysCount}`
                : `Дней с занятиями по вечерам: ${lightDaysCount}`}
            </p>
          </>
        )}

        {blocksStudy ? (
          <p className="text-xs text-muted">
            В эти дни занятия пропадают с карточек, а их часы перераспределяются
            на остальные дни спринта. Можно в любой момент кликнуть по иконке
            портфеля на карточке дня — это переключит график на «Вручную» и
            сохранит вашу правку.
          </p>
        ) : (
          <p className="text-xs text-muted">
            Смена короткая — вечер свободен, поэтому занятия с карточки не
            пропадают. В эти дни доступен только основной курс (без доп. тем),
            чтобы не наваливать всё после рабочего дня.
          </p>
        )}
      </Card.Content>
    </Card>
  );
}

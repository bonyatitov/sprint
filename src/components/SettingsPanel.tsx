import type { SprintSettings } from "@/lib/types";

import {
  Button,
  Card,
  Label,
  NumberField,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";

import { WEEKDAY_LABELS } from "@/lib/schedule";
import { RefreshIcon } from "@/components/icons";

export interface SettingsPanelProps {
  settings: SprintSettings;
  onChange: (patch: Partial<SprintSettings>) => void;
  onGenerate: () => void;
  studyDaysCount: number;
  workDaysCount: number;
}

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function SettingsPanel({
  settings,
  onChange,
  onGenerate,
  studyDaysCount,
  workDaysCount,
}: SettingsPanelProps) {
  const daysOffKeys = new Set(settings.daysOff.map(String));
  const allDaysOff = settings.daysOff.length >= 7;

  return (
    <Card>
      <Card.Header>
        <Card.Title>Параметры спринта</Card.Title>
        <Card.Description>
          {settings.weeksCount} недели, по {7 - settings.daysOff.length} учебных
          дней в неделю — всего {studyDaysCount} учебных дней
          {workDaysCount > 0 &&
            ` (из них ${workDaysCount} отмечено как рабочие смены)`}
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Дата начала</span>
          <input
            className="rounded-lg border border-separator bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            type="date"
            value={settings.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </label>

        <NumberField
          maxValue={12}
          minValue={1}
          value={settings.weeksCount}
          onChange={(value) => onChange({ weeksCount: value ?? 1 })}
        >
          <Label>Длительность спринта, недель</Label>
          <NumberField.Group>
            <NumberField.DecrementButton>−</NumberField.DecrementButton>
            <NumberField.Input />
            <NumberField.IncrementButton>+</NumberField.IncrementButton>
          </NumberField.Group>
        </NumberField>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Выходные дни
          </span>
          <ToggleButtonGroup
            selectedKeys={daysOffKeys}
            selectionMode="multiple"
            onSelectionChange={(keys) => {
              const next = Array.from(keys as Set<string>).map(Number);

              onChange({ daysOff: next });
            }}
          >
            {WEEKDAY_ORDER.map((day) => (
              <ToggleButton key={day} id={String(day)}>
                {WEEKDAY_LABELS[day]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {allDaysOff && (
            <p className="text-xs text-danger">
              Оставьте хотя бы один учебный день в неделе.
            </p>
          )}
        </div>
      </Card.Content>
      <Card.Footer className="border-t border-separator pt-4">
        <Button
          fullWidth
          isDisabled={allDaysOff}
          variant="primary"
          onPress={onGenerate}
        >
          <RefreshIcon />
          Сформировать расписание
        </Button>
      </Card.Footer>
    </Card>
  );
}

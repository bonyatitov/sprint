import type { PomodoroSettings } from "@/lib/types";

import { Card, Label, NumberField } from "@heroui/react";

export interface PomodoroSettingsPanelProps {
  settings: PomodoroSettings;
  onChange: (patch: Partial<PomodoroSettings>) => void;
}

export function PomodoroSettingsPanel({
  settings,
  onChange,
}: PomodoroSettingsPanelProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Настройки Помодоро</Card.Title>
        <Card.Description>
          Длительность цикла работы и отдыха для таймеров в расписании
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex gap-4">
        <NumberField
          className="flex-1"
          maxValue={180}
          minValue={1}
          value={settings.workMinutes}
          onChange={(value) => onChange({ workMinutes: value ?? 1 })}
        >
          <Label>Время цикла, мин</Label>
          <NumberField.Group>
            <NumberField.DecrementButton>−</NumberField.DecrementButton>
            <NumberField.Input />
            <NumberField.IncrementButton>+</NumberField.IncrementButton>
          </NumberField.Group>
        </NumberField>

        <NumberField
          className="flex-1"
          maxValue={60}
          minValue={1}
          value={settings.breakMinutes}
          onChange={(value) => onChange({ breakMinutes: value ?? 1 })}
        >
          <Label>Время отдыха, мин</Label>
          <NumberField.Group>
            <NumberField.DecrementButton>−</NumberField.DecrementButton>
            <NumberField.Input />
            <NumberField.IncrementButton>+</NumberField.IncrementButton>
          </NumberField.Group>
        </NumberField>
      </Card.Content>
    </Card>
  );
}

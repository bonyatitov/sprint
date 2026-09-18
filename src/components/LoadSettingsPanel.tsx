import type { SmartLoadSettings } from "@/lib/types";

import { Card, Chip, Label, NumberField, Switch } from "@heroui/react";

import { maxSubjectsPerDayForAge } from "@/lib/schedule";

export interface LoadSettingsPanelProps {
  settings: SmartLoadSettings;
  onChange: (patch: Partial<SmartLoadSettings>) => void;
}

export function LoadSettingsPanel({
  settings,
  onChange,
}: LoadSettingsPanelProps) {
  const cap = maxSubjectsPerDayForAge(settings.age);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Умное распределение нагрузки</Card.Title>
        <Card.Description>
          Разносит доп. темы по разным дням вместо того, чтобы наваливать всё
          сразу — и делает день после смены совсем лёгким
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <Switch
          isSelected={settings.enabled}
          onChange={(enabled) => onChange({ enabled })}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <span className="text-sm">Включить умное распределение</span>
          </Switch.Content>
        </Switch>

        <NumberField
          isDisabled={!settings.enabled}
          maxValue={100}
          minValue={10}
          value={settings.age}
          onChange={(value) => onChange({ age: value ?? 10 })}
        >
          <Label>Возраст</Label>
          <NumberField.Group>
            <NumberField.DecrementButton>−</NumberField.DecrementButton>
            <NumberField.Input />
            <NumberField.IncrementButton>+</NumberField.IncrementButton>
          </NumberField.Group>
        </NumberField>

        {settings.enabled && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>Не больше предметов в день:</span>
            <Chip color="accent" size="sm" variant="soft">
              <Chip.Label>{cap}</Chip.Label>
            </Chip>
          </div>
        )}

        <p className="text-xs text-muted">
          Основной курс приоритетнее и почти всегда в расписании, доп. темы
          подключаются по очереди. День сразу после смены — только курс, без
          доп. тем. Это упрощённая эвристика для распределения нагрузки, а не
          медицинский расчёт.
        </p>
      </Card.Content>
    </Card>
  );
}

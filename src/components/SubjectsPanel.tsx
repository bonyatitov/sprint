import type { Subject } from "@/lib/types";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  NumberField,
  Switch,
  TextField,
} from "@heroui/react";

import { PlusIcon, TrashIcon } from "@/components/icons";

export interface SubjectsPanelProps {
  subjects: Subject[];
  onAdd: (subject: Subject) => void;
  onUpdate: (id: string, patch: Partial<Subject>) => void;
  onRemove: (id: string) => void;
}

export function SubjectsPanel({
  subjects,
  onAdd,
  onUpdate,
  onRemove,
}: SubjectsPanelProps) {
  const [newName, setNewName] = useState("");
  const [newHours, setNewHours] = useState(4);
  const [newIsExtra, setNewIsExtra] = useState(false);

  const totalHours = subjects.reduce((sum, s) => sum + s.hours, 0);
  const courseHours = subjects
    .filter((s) => s.category === "course")
    .reduce((sum, s) => sum + s.hours, 0);
  const extraHours = subjects
    .filter((s) => s.category === "extra")
    .reduce((sum, s) => sum + s.hours, 0);

  const handleAdd = () => {
    const trimmed = newName.trim();

    if (!trimmed) return;
    onAdd({
      id: crypto.randomUUID(),
      name: trimmed,
      hours: newHours,
      category: newIsExtra ? "extra" : "course",
    });
    setNewName("");
    setNewHours(4);
    setNewIsExtra(false);
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Занятия</Card.Title>
        <Card.Description>
          Курс и дополнительные темы, суммарно {totalHours} ч за спринт
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {subjects.length === 0 && (
          <p className="text-sm text-muted">
            Список пуст — добавьте занятие ниже.
          </p>
        )}
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="flex flex-col gap-2 rounded-xl border border-separator p-3"
          >
            <TextField
              aria-label="Название занятия"
              value={subject.name}
              onChange={(value) => onUpdate(subject.id, { name: value })}
            >
              <Input placeholder="Название занятия" />
            </TextField>

            <div className="flex items-center gap-2">
              <NumberField
                aria-label="Часы"
                className="w-20 shrink-0"
                minValue={0}
                step={0.5}
                value={subject.hours}
                onChange={(value) =>
                  onUpdate(subject.id, { hours: value ?? 0 })
                }
              >
                <NumberField.Group>
                  <NumberField.Input />
                </NumberField.Group>
              </NumberField>
              <span className="text-sm text-muted">ч</span>

              <Switch
                className="ml-auto"
                isSelected={subject.category === "extra"}
                onChange={(isSelected) =>
                  onUpdate(subject.id, {
                    category: isSelected ? "extra" : "course",
                  })
                }
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <span className="text-sm whitespace-nowrap">Доп. тема</span>
                </Switch.Content>
              </Switch>

              <Button
                isIconOnly
                aria-label="Удалить занятие"
                variant="ghost"
                onPress={() => onRemove(subject.id)}
              >
                <TrashIcon />
              </Button>
            </div>
          </div>
        ))}
      </Card.Content>
      <Card.Footer className="flex flex-col gap-3 border-t border-separator pt-4">
        <TextField value={newName} onChange={setNewName}>
          <Label>Новое занятие</Label>
          <Input placeholder="Например, TypeScript" />
        </TextField>

        <div className="flex items-end gap-2">
          <NumberField
            className="w-20 shrink-0"
            minValue={0}
            step={0.5}
            value={newHours}
            onChange={(value) => setNewHours(value ?? 0)}
          >
            <Label>Часы</Label>
            <NumberField.Group>
              <NumberField.Input />
            </NumberField.Group>
          </NumberField>

          <Switch
            className="ml-auto"
            isSelected={newIsExtra}
            onChange={setNewIsExtra}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <span className="text-sm whitespace-nowrap">Доп. тема</span>
            </Switch.Content>
          </Switch>
        </div>

        <Button fullWidth variant="primary" onPress={handleAdd}>
          <PlusIcon />
          Добавить занятие
        </Button>
      </Card.Footer>
      <div className="flex flex-wrap gap-2 px-6 pb-6">
        <Chip color="accent" variant="soft">
          <Chip.Label>Курс: {courseHours} ч</Chip.Label>
        </Chip>
        <Chip color="default" variant="soft">
          <Chip.Label>Доп. темы: {extraHours} ч</Chip.Label>
        </Chip>
      </div>
    </Card>
  );
}

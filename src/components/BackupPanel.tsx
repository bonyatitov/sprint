import type { ChangeEvent } from "react";

import { useRef } from "react";
import { Button, Card } from "@heroui/react";

import { DownloadIcon, UploadIcon } from "@/components/icons";

export interface BackupPanelProps {
  error: string | null;
  onExport: () => void;
  onFileSelected: (file: File) => void;
}

export function BackupPanel({
  error,
  onExport,
  onFileSelected,
}: BackupPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = "";
    if (file) onFileSelected(file);
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Резервная копия</Card.Title>
        <Card.Description>
          Все данные хранятся только в этом браузере — при очистке кеша они
          пропадут без следа. Сохраните копию на компьютер, чтобы всегда можно
          было восстановить прогресс.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        <Button variant="primary" onPress={onExport}>
          <DownloadIcon size={16} />
          Сохранить резервную копию
        </Button>
        <Button
          variant="secondary"
          onPress={() => fileInputRef.current?.click()}
        >
          <UploadIcon size={16} />
          Восстановить из файла
        </Button>
        <input
          ref={fileInputRef}
          accept="application/json"
          className="hidden"
          type="file"
          onChange={handleFileChange}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <p className="text-xs text-muted">
          Восстановление полностью заменит текущие занятия, расписание, заметки
          и настройки данными из файла.
        </p>
      </Card.Content>
    </Card>
  );
}

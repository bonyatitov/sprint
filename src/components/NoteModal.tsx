import { useEffect, useRef, useState } from "react";
import { Button, Modal } from "@heroui/react";

const NOTE_SAVE_DELAY_MS = 400;

interface NoteModalProps {
  isOpen: boolean;
  dateLabel: string;
  subjectName: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export function NoteModal({
  isOpen,
  dateLabel,
  subjectName,
  value,
  onChange,
  onClose,
}: NoteModalProps) {
  const [draft, setDraft] = useState(value);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isOpen) setDraft(value);
  }, [isOpen, value]);

  const scheduleSave = (next: string) => {
    setDraft(next);
    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(
      () => onChange(next),
      NOTE_SAVE_DELAY_MS,
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    window.clearTimeout(saveTimeoutRef.current);
    onChange(draft);
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{subjectName}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-2 text-sm text-muted">{dateLabel}</p>
            <textarea
              className="w-full resize-none rounded-lg border border-separator bg-default/50 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              placeholder="Заметка по занятию…"
              rows={6}
              value={draft}
              onChange={(e) => scheduleSave(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="primary">
              Готово
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

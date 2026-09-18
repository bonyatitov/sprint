import { Button, Modal, type UseOverlayStateReturn } from "@heroui/react";

interface ConfirmRegenerateModalProps {
  state: UseOverlayStateReturn;
  onConfirm: () => void;
}

export function ConfirmRegenerateModal({
  state,
  onConfirm,
}: ConfirmRegenerateModalProps) {
  return (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[400px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Пересобрать расписание?</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p>
              Уже отмеченный прогресс по текущему расписанию будет сброшен.
              Продолжить?
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="secondary">
              Отмена
            </Button>
            <Button slot="close" variant="primary" onPress={onConfirm}>
              Пересобрать
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

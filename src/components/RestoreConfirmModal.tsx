import { Button, Modal, type UseOverlayStateReturn } from "@heroui/react";

interface RestoreConfirmModalProps {
  state: UseOverlayStateReturn;
  onConfirm: () => void;
}

export function RestoreConfirmModal({
  state,
  onConfirm,
}: RestoreConfirmModalProps) {
  return (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[420px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Восстановить резервную копию?</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p>
              Текущие занятия, расписание, заметки и настройки будут заменены
              данными из файла. Отменить это будет нельзя.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="secondary">
              Отмена
            </Button>
            <Button slot="close" variant="primary" onPress={onConfirm}>
              Восстановить
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

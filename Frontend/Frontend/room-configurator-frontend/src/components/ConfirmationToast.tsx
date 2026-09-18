import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface ConfirmationToastProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationToast = ({
  isOpen,
  title = "Confirmation",
  message,
  onConfirm,
  onCancel,
}: ConfirmationToastProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      placement="center"
      hideCloseButton
    >
      <ModalContent>
        <>
          <ModalHeader>{title}</ModalHeader>

          <ModalBody>
            <p>{message}</p>
          </ModalBody>

          <ModalFooter>
            <Button variant="flat" onPress={onCancel}>
              Cancel
            </Button>

            <Button color="primary" onPress={onConfirm}>
              Ok
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationToast;
import { Modal, Button } from "react-bootstrap";

/**
 * Styled replacement for window.confirm.
 * Used for destructive admin actions (delete user / doctor / appointment).
 */
export default function ConfirmModal({
  show,
  title = "Are you sure?",
  children,
  confirmLabel = "Delete",
  confirmVariant = "danger",
  busy = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      show={show}
      onHide={busy ? undefined : onCancel}
      centered
      backdrop={busy ? "static" : true}
      keyboard={!busy}
      enforceFocus={false}
    >
      <Modal.Header closeButton={!busy}>
        <Modal.Title className="d-flex align-items-center gap-2">
          <span aria-hidden="true">⚠️</span>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={busy}>
          {busy ? "Working…" : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
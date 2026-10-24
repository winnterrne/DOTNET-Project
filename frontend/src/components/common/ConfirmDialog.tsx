import type { ReactNode } from 'react';
import { Modal } from '../ui';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: ReactNode;
  message?: ReactNode;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  children,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDanger = false,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </button>
          <button
            className={`btn ${isDanger ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmText}
          </button>
        </>
      }
    >
      {message && <p className="muted mb16">{message}</p>}
      {children}
    </Modal>
  );
}

export default ConfirmDialog;

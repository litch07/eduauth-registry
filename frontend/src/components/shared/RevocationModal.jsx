import Modal from './Modal';
import Button from './Button';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function RevocationModal({ certificate, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
    } else {
      toast.error('Please provide a reason for revocation.');
    }
  };

  return (
    <Modal open={!!certificate} onClose={onClose} title="Revoke Certificate">
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          You are about to revoke the certificate with serial number{' '}
          <span className="font-bold text-[var(--text-primary)]">{certificate?.serial}</span>. This action is irreversible.
        </p>
        <div>
          <label htmlFor="revocation-reason" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Reason for Revocation
          </label>
          <textarea
            id="revocation-reason"
            name="reason"
            rows="3"
            className="input-field"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the reason for revoking this certificate..."
            required
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            Revoke Certificate
          </Button>
        </div>
      </div>
    </Modal>
  );
}

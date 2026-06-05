import Modal from './Modal';
import Button from './Button';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';

export default function RestoreModal({ certificate, onClose, onConfirm, loading = false }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for restoring the certificate.');
      return;
    }
    if (reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters long.');
      return;
    }
    onConfirm(reason);
  };

  return (
    <Modal open={!!certificate} onClose={onClose} title="Restore Certificate">
      <div className="space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              Restore Certificate
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
              Serial:{' '}
              <span className="font-mono font-bold">{certificate?.serial}</span>
              <br />
              This will set the certificate back to <strong>active</strong> status and make it verifiable again.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="restore-reason"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Reason for Restoration <span className="text-red-500">*</span>
          </label>
          <textarea
            id="restore-reason"
            name="reason"
            rows="3"
            className="input-field"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why this certificate is being restored (min. 10 characters)..."
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            {reason.length} / 1000 characters
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleConfirm} loading={loading}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Restore Certificate
          </Button>
        </div>
      </div>
    </Modal>
  );
}

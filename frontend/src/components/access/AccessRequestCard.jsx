import { CalendarDays, Building2, FileText } from 'lucide-react';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import Button from '../shared/Button';

function formatDate(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function AccessRequestCard({ request, onApprove, onReject, loading }) {
  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4 text-[var(--brand)]" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {request.verifier?.name ? `${request.verifier.name} — ` : ''}{request.verifier?.company_name || 'Unknown company'}
          </h3>
          <Badge variant="warning">Pending</Badge>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {request.purpose}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Requested: {formatDate(request.created_at)}
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onApprove(request)} disabled={loading}>
          Approve
        </Button>
        <Button size="sm" variant="danger" onClick={() => onReject(request)} disabled={loading}>
          Reject
        </Button>
      </div>
    </Card>
  );
}

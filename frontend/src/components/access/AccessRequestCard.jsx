import { CalendarDays, Building2, FileText } from 'lucide-react';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import Button from '../shared/Button';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString();
}

export default function AccessRequestCard({ request, onApprove, onReject, loading }) {
  return (
    <Card className="space-y-4 border border-gray-200/80 shadow-sm dark:border-gray-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-600" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {request.verifier?.company_name || 'Unknown company'}
            </h3>
          </div>
          <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span className="whitespace-pre-line leading-relaxed">{request.purpose}</span>
          </p>
          <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <CalendarDays className="h-4 w-4" />
            Requested {formatDate(request.created_at)}
          </p>
        </div>
        <Badge variant="warning">Pending</Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => onApprove(request)} disabled={loading}>
          Approve
        </Button>
        <Button variant="secondary" onClick={() => onReject(request)} disabled={loading}>
          Reject
        </Button>
      </div>
    </Card>
  );
}

import { CalendarDays, User2, FileText, Building2 } from 'lucide-react';
import Card from '../shared/Card';
import Badge from '../shared/Badge';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString();
}

export default function MyAccessRequestCard({ request }) {
  const variant = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }[request.status] || 'default';

  const isVerifierView = !!request.student;

  const displayName = isVerifierView
    ? [request.student.first_name, request.student.middle_name, request.student.last_name]
        .filter(Boolean)
        .join(' ') || request.student.full_name || request.student.user?.name || 'Unknown student'
    : request.verifier?.company_name || 'Unknown company';

  const Icon = isVerifierView ? User2 : Building2;

  return (
    <Card className="space-y-4 border border-gray-200/80 shadow-sm dark:border-gray-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary-600" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {displayName}
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
        <Badge variant={variant}>{request.status}</Badge>
      </div>
    </Card>
  );
}

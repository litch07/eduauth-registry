import { CalendarDays, Building2, ShieldCheck, ShieldX, Clock3 } from 'lucide-react';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import Button from '../shared/Button';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString();
}

export default function GrantedAccessCard({ access, onRevoke, loading }) {
  const isExpired = !access.is_active && !access.revoked_at && new Date(access.expires_at) <= new Date();

  return (
    <Card className="space-y-4 border border-gray-200/80 shadow-sm dark:border-gray-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-600" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {access.company_name || access.verifier?.company_name || 'Unknown company'}
            </h3>
          </div>
          <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Granted on {formatDate(access.granted_at)}
          </p>
          <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Clock3 className="h-4 w-4 text-gray-500" />
            Expires on {formatDate(access.expires_at)}
          </p>
          {access.revoked_at ? (
            <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <ShieldX className="h-4 w-4" />
              Revoked on {formatDate(access.revoked_at)}
            </p>
          ) : null}
        </div>
        <Badge variant={access.revoked_at ? 'danger' : isExpired ? 'default' : 'success'}>
          {access.revoked_at ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
        </Badge>
      </div>

      {!access.revoked_at && !isExpired ? (
        <Button variant="danger" onClick={() => onRevoke(access)} disabled={loading}>
          Revoke Access
        </Button>
      ) : null}
    </Card>
  );
}

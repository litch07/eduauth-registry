import { CalendarDays, Building2, Clock3 } from 'lucide-react';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import Button from '../shared/Button';

function formatDate(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function GrantedAccessCard({ access, onRevoke, loading }) {
  const expiresAt = new Date(access.expires_at);
  const now = new Date();

  const isExpired = !access.is_active && !access.revoked_at && expiresAt <= now;
  const isRevoked = !!access.revoked_at;
  const isActive = !isExpired && !isRevoked;

  const diffTime = expiresAt - now;
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return (
    <Card className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between relative">
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between sm:justify-start gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--brand)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {access.verifier?.name ? `${access.verifier.name} — ` : ''}{access.company_name || access.verifier?.company_name || 'Unknown company'}
            </h3>
          </div>
          <Badge variant={isRevoked ? 'danger' : isExpired ? 'default' : 'success'}>
            {isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
          </Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />
            <span>Granted: {formatDate(access.granted_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock3 className="h-4 w-4 text-[var(--text-muted)]" />
            <span>Expires: {formatDate(access.expires_at)}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 sm:pt-0 flex flex-col items-start sm:items-end gap-2">
        {isActive && (
          <span className={`text-sm font-semibold ${daysLeft <= 3 ? 'text-[var(--danger)]' : daysLeft <= 7 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
          </span>
        )}
        {isActive ? (
          <Button size="sm" variant="danger" onClick={() => onRevoke(access)} disabled={loading} className="w-full sm:w-auto !bg-transparent !text-[var(--danger)] !border-[var(--danger)] hover:!bg-[var(--danger)] hover:!text-white transition-colors mt-1">
            Revoke Access
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

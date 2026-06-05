import { CheckCircle, XCircle, ShieldCheck, Clock } from 'lucide-react';

/**
 * StatusTimeline
 *
 * Renders a chronological audit trail of a certificate's status changes.
 *
 * Props:
 *   history    {Array}  revocation_history array from the certificate
 *   issueDate  {string} ISO date string — used to synthesize the "Issued" entry
 */
export default function StatusTimeline({ history = [], issueDate }) {
  // Build a unified, sorted list of events.
  // The "Issued" entry is always first.
  const events = [];

  if (issueDate) {
    events.push({
      action: 'issued',
      performed_by_name: 'System',
      role: 'system',
      reason: 'Certificate issued and recorded in EduAuth Registry.',
      timestamp: issueDate,
    });
  }

  // Append all history entries
  if (Array.isArray(history)) {
    history.forEach((entry) => events.push(entry));
  }

  // Sort chronologically (oldest first)
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (events.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Status Timeline
      </h3>
      <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-2 space-y-0">
        {events.map((event, idx) => {
          const isLast = idx === events.length - 1;
          const cfg = ACTION_CONFIG[event.action] ?? ACTION_CONFIG.default;

          return (
            <li key={idx} className={`relative pl-6 ${isLast ? 'pb-0' : 'pb-5'}`}>
              {/* Connector dot */}
              <span
                className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-900 ${cfg.dotBg}`}
              >
                <cfg.Icon className={`h-3 w-3 ${cfg.iconColor}`} />
              </span>

              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
                {/* Action label + timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cfg.labelColor}`}>
                    {cfg.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>

                {/* Performed by */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {event.performed_by_name || 'System'}
                  </span>
                  {event.role && event.role !== 'system' && (
                    <span className="ml-1 text-gray-400">({capitalise(event.role)})</span>
                  )}
                </p>

                {/* Reason */}
                {event.reason && (
                  <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {event.reason}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const ACTION_CONFIG = {
  issued: {
    label: 'Issued',
    dotBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    labelColor: 'text-blue-700 dark:text-blue-400',
    Icon: CheckCircle,
  },
  revoked: {
    label: 'Revoked',
    dotBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-400',
    labelColor: 'text-red-700 dark:text-red-400',
    Icon: XCircle,
  },
  restored: {
    label: 'Restored',
    dotBg: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600 dark:text-green-400',
    labelColor: 'text-green-700 dark:text-green-400',
    Icon: ShieldCheck,
  },
  default: {
    label: 'Status Change',
    dotBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-500',
    labelColor: 'text-gray-600 dark:text-gray-400',
    Icon: Clock,
  },
};

function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

function capitalise(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

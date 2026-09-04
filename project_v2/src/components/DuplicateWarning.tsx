import { Copy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DuplicateWarningProps {
  duplicateOfTicketId: string;
  nearbySimilarCount?: number;
  /** If provided, the original ticket ID is rendered as a link to this path (e.g. `/track/CIV-1042`). */
  linkTo?: string;
  className?: string;
}

/**
 * Warning banner shown when a report was flagged by the backend as a likely
 * duplicate/near-duplicate of an existing nearby report of the same category
 * (see backend/app/services/priority.py: find_nearby_similar).
 */
export function DuplicateWarning({
  duplicateOfTicketId,
  nearbySimilarCount,
  linkTo,
  className = '',
}: DuplicateWarningProps) {
  return (
    <div
      className={`p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 ${className}`}
    >
      <Copy className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-amber-700 mb-0.5">Possible duplicate report</p>
        <p className="text-xs text-navy-700">
          This looks similar to an existing nearby report,{' '}
          {linkTo ? (
            <Link to={linkTo} className="underline font-medium">
              {duplicateOfTicketId}
            </Link>
          ) : (
            <span className="font-medium">{duplicateOfTicketId}</span>
          )}
          {typeof nearbySimilarCount === 'number' && nearbySimilarCount > 1
            ? ` (${nearbySimilarCount} similar reports found nearby).`
            : '.'}
        </p>
      </div>
    </div>
  );
}

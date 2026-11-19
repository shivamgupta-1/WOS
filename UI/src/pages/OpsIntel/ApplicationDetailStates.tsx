import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';

export function ApplicationDetailLoading() {
  return (
    <div className="detail-v2-loading" role="status" aria-label="Loading application details">
      <Skeleton variant="text" className="detail-v2-loading-breadcrumb" />
      <Skeleton variant="text" className="detail-v2-loading-title" />
      <Skeleton variant="text" className="detail-v2-loading-description" />
      <div className="detail-v2-loading-summary">
        {Array.from({ length: 5 }, (_, index) => <Skeleton variant="block" key={index} />)}
      </div>
      <Skeleton variant="block" className="detail-v2-loading-history" />
      <Skeleton variant="block" className="detail-v2-loading-tabs" />
    </div>
  );
}

interface ApplicationDetailErrorProps {
  onRetry: () => void;
}

export function ApplicationDetailError({ onRetry }: ApplicationDetailErrorProps) {
  return (
    <div className="detail-v2">
      <ErrorState
        title="Application details unavailable"
        description="The application may have been removed or the connection is unavailable."
        retryLabel="Retry"
        onRetry={onRetry}
        className="detail-v2-page-error"
      />
      <Link className="detail-v2-back-dashboard" to="/">
        <ArrowLeft aria-hidden="true" size={16} /> Back to dashboard
      </Link>
    </div>
  );
}

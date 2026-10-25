import { GrievanceTrackerView } from './GrievanceTrackerView';

export interface LiveGrievanceTrackerProps {
  onNewIssueClick?: () => void;
  onClose?: () => void;
  initialTicketId?: string;
  className?: string;
}

/**
 * Backward-compatible adapter for LiveGrievanceTracker.
 * Delegates rendering to the modular GrievanceTrackerView.
 */
export function LiveGrievanceTracker({
  onNewIssueClick,
  onClose,
  initialTicketId,
  className = '',
}: LiveGrievanceTrackerProps) {
  return (
    <div className={`w-full h-full flex flex-col min-h-0 relative ${className}`}>
      <GrievanceTrackerView
        initialTicketId={initialTicketId}
        onNewIssueClick={onNewIssueClick}
        onClose={onClose}
      />
    </div>
  );
}

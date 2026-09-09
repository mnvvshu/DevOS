import 'react';
import { Shield } from 'lucide-react';
import type { ApprovalDecision } from '@devos/shared';

interface ApprovalDialogProps {
  request: {
    id: string;
    action: string;
    description: string;
    risk: 'low' | 'medium' | 'high';
    details: Record<string, unknown>;
  };
  onDecision: (decision: ApprovalDecision) => void;
}

export function ApprovalDialog({ request, onDecision }: ApprovalDialogProps) {
  const riskColors = {
    low: 'text-devos-success',
    medium: 'text-devos-warning',
    high: 'text-devos-error',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-devos-surface border border-devos-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-devos-warning/10 flex items-center justify-center shrink-0">
            <Shield size={20} className="text-devos-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Permission Required</h3>
            <p className="text-sm text-devos-text-secondary mt-1">{request.description}</p>
          </div>
        </div>

        <div className="bg-devos-bg rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-devos-text-secondary">Action:</span>
            <code className="text-xs font-mono text-devos-accent">{request.action}</code>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-devos-text-secondary">Risk:</span>
            <span className={`text-xs font-medium uppercase ${riskColors[request.risk]}`}>
              {request.risk}
            </span>
          </div>
          {Object.keys(request.details).length > 0 && (
            <pre className="text-xs font-mono text-devos-text-secondary mt-2 overflow-auto max-h-32">
              {JSON.stringify(request.details, null, 2)}
            </pre>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onDecision('allow_once')}
            className="flex-1 px-4 py-2 text-sm bg-devos-accent text-white rounded-lg hover:bg-devos-accent-hover transition-colors"
          >
            Allow Once
          </button>
          <button
            onClick={() => onDecision('allow_session')}
            className="flex-1 px-4 py-2 text-sm bg-devos-surface border border-devos-border text-devos-text rounded-lg hover:bg-devos-surface-hover transition-colors"
          >
            Allow for Session
          </button>
          <button
            onClick={() => onDecision('deny')}
            className="px-4 py-2 text-sm bg-devos-error/10 text-devos-error rounded-lg hover:bg-devos-error/20 transition-colors"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}

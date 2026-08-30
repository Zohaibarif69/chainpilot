import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon && <div className="text-[#98A2B3] mb-1">{icon}</div>}
      <p className="text-[14px] font-medium text-[#111827]">{title}</p>
      {description && <p className="text-[13px] text-[#667085] max-w-xs">{description}</p>}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ title, description, onRetry }: { title: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-[14px] font-medium text-[#111827]">{title}</p>
      {description && <p className="text-[13px] text-[#667085] max-w-xs">{description}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">Retry</Button>
      )}
    </div>
  );
}

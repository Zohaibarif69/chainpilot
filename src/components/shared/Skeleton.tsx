export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-4 py-3 border-b border-[#F1F3F5]">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-3.5 w-16" />
      <Skeleton className="h-3.5 w-24" />
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-[#667085]">
      <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#3157D5] rounded-full animate-spin" />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

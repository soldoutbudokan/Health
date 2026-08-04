"use client";

export function UndoToast({
  label,
  onUndo,
  onDismiss,
}: {
  label: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rise fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-2.5 shadow-lg"
    >
      <span className="max-w-[45vw] truncate text-sm">
        Removed <span className="font-medium">{label}</span>
      </span>
      <button
        onClick={onUndo}
        className="rounded-lg px-2 py-1 text-sm font-semibold text-protein hover:bg-surface-2"
      >
        Undo
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded-lg px-1.5 py-1 text-muted hover:bg-surface-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

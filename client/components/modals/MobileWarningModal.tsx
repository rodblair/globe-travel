"use client";

interface MobileWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileWarningModal({
  isOpen,
  onClose,
}: MobileWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-paper-raised/85 p-8">
      <div className="max-w-md text-center bg-paper border border-rule rounded-2xl p-8">
        <h1 className="text-foreground text-2xl font-bold mb-4">Larger Screen Recommended</h1>
        <p className="text-foreground/70 mb-6">
          Globe.travel has a richer map workspace on wider screens. You can keep
          planning here, or switch to a tablet or laptop for more room.
        </p>
        <p className="text-foreground/40 text-sm mb-6">
          Minimum recommended: 1024px width
        </p>
        <button
          onClick={onClose}
          className="touch-target rounded-full bg-paper-recessed px-6 py-2 text-foreground transition-colors hover:bg-paper-recessed"
        >
          Close
        </button>
      </div>
    </div>
  );
}

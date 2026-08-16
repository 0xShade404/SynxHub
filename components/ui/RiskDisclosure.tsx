import { AlertTriangle } from "lucide-react";
import { RISK_DISCLOSURE_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function RiskDisclosure({ className }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="Risk disclosure"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-warning-soft bg-warning-soft/60 px-4 py-3 text-sm text-foreground",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <p>{RISK_DISCLOSURE_SHORT}</p>
    </div>
  );
}

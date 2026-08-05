import { readLog } from "@/lib/logFile";
import { readGoals } from "@/lib/goalsFile";
import { toDateKey } from "@/lib/nutrition";
import { History } from "@/components/History";

/** Server component — same build-time read as the dashboard. */
export default function Page() {
  return (
    <History entries={readLog()} goals={readGoals()} builtOn={toDateKey()} />
  );
}

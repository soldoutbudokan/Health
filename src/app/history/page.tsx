import { readLog } from "@/lib/logFile";
import { readGoals } from "@/lib/goalsFile";
import { readBreaks } from "@/lib/trainingFile";
import { toDateKey } from "@/lib/nutrition";
import { dietBreaks } from "@/lib/training";
import { History } from "@/components/History";

export const metadata = { title: "History · Health" };

/** Server component — same build-time read as the dashboard. */
export default function Page() {
  return (
    <History
      entries={readLog()}
      goals={readGoals()}
      builtOn={toDateKey()}
      breaks={dietBreaks(readBreaks())}
    />
  );
}

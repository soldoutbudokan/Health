"use client";

import { useState } from "react";
import type { Goals, LogEntry } from "@/lib/types";
import type {
  Checkin,
  Session,
  TrainingBreak,
  WorkoutSet,
} from "@/lib/trainingTypes";
import { loggedDates } from "@/lib/nutrition";
import { bodyweightSeries } from "@/lib/training";
import { Dashboard } from "@/components/Dashboard";
import { TrainingDay } from "@/components/TrainingDay";

/**
 * The two halves of the day, side by side, sharing one piece of state: which
 * day you are looking at. Stepping the dashboard back to yesterday moves the
 * training column with it, so each column shows the same day's record — food
 * on the left, the session on the right, blank when nothing was logged.
 */
export function TodayView({
  entries,
  goals,
  builtOn,
  builtHour,
  streak,
  sets,
  sessions,
  breaks,
  checkins,
}: {
  entries: LogEntry[];
  goals: Goals;
  builtOn: string;
  builtHour: number;
  streak: number;
  sets: WorkoutSet[];
  sessions: Session[];
  breaks: TrainingBreak[];
  checkins: Checkin[];
}) {
  // Open on the newest day that has food in it. On a snapshot that is almost
  // always the build day, and when it isn't — a rebuild triggered by a code
  // change rather than a meal — landing on data beats landing on an empty day.
  const [date, setDate] = useState(() => loggedDates(entries)[0] ?? builtOn);

  // Rendered in the food column, fed by the training files: bodyweight follows
  // diet more than it follows any single session, so the chart lives on the
  // left even though its readings come from check-ins and session rows.
  const bodyweight = bodyweightSeries(checkins, sessions);

  // `min-w-0` on each column is load-bearing, not tidying. A grid item defaults
  // to `min-width: auto`, so it refuses to shrink below its widest unbreakable
  // content — a set chip like "260 × 5", a week-strip tick — and instead widens
  // its track. On a 430 px phone that made both columns 466 px and scrolled the
  // whole page sideways, including the header.
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="min-w-0">
        <Dashboard
          entries={entries}
          goals={goals}
          builtOn={builtOn}
          builtHour={builtHour}
          streak={streak}
          bodyweight={bodyweight}
          date={date}
          onDateChange={setDate}
        />
      </div>
      <div className="min-w-0">
        <TrainingDay
          sets={sets}
          sessions={sessions}
          breaks={breaks}
          checkins={checkins}
          date={date}
          today={builtOn}
        />
      </div>
    </div>
  );
}

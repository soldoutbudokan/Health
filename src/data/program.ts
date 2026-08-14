import type { SessionType, SetKind } from "@/lib/trainingTypes";

/**
 * The program, transcribed from `docs/training-plan.md`.
 *
 * It lives in code rather than staying prose because it does two jobs the
 * document can't: it renders the plan on `/program`, and it gives the training
 * page something to check a logged session *against*. A log that only says
 * what you did is a record; a log that knows what you were supposed to do is
 * feedback. `prescription` is the human string, and the structured `sets` /
 * `reps` fields beside it are what the comparison actually reads.
 *
 * The document remains the source of truth for the reasoning. If the two ever
 * disagree, the document is right and this file is stale.
 */

export interface PlannedExercise {
  name: string;
  kind: SetKind;
  /** Human-readable, e.g. "2 × 5" or "5–10 min". Always rendered verbatim. */
  prescription: string;
  /** Structured minimum, for comparing a session against the plan. */
  sets?: number;
  /** Upper end when the plan gives a range ("3–4 × 5"). */
  setsMax?: number;
  reps?: number;
  repsMax?: number;
  /** Skipping it is following the plan, not deviating from it. */
  optional?: boolean;
  /** An accepted substitute, e.g. seated row *or* lat pulldown. */
  alternative?: string;
  note?: string;
}

export interface PlannedSession {
  id: SessionType;
  name: string;
  place: "gym" | "home";
  blurb: string;
  exercises: PlannedExercise[];
}

export const PROGRAM: PlannedSession[] = [
  {
    id: "heavy-lower",
    name: "Heavy Lower",
    place: "gym",
    blurb:
      "The trap bar sets are the two most important sets of the week. Jumps come first, fresh and low-dose, to prime the nervous system rather than drain it.",
    exercises: [
      {
        name: "Sled push + pull",
        kind: "warmup",
        prescription: "5–10 min",
        note: "Full-body blood flow with no eccentric, so no added soreness.",
      },
      { name: "Seated pancakes", kind: "warmup", prescription: "~5 min", note: "Lower back." },
      {
        name: "Jumps",
        kind: "jump",
        prescription: "2 × 4",
        sets: 2,
        reps: 4,
        note: "Bodyweight only. No kettlebell, no box, no drop. Quick dip to about a quarter squat, under a second, arms swinging. Full rest between sets.",
      },
      {
        name: "Trap bar deadlift",
        kind: "compound",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        note: "Add 2.5–5 lbs when both sets move well.",
      },
      { name: "Smith machine squat", kind: "compound", prescription: "2 × 5", sets: 2, reps: 5 },
      {
        name: "Lying leg curl",
        kind: "isolation",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        note: "Hamstrings drive both the deadlift and the jump.",
      },
      {
        name: "Sled",
        kind: "finisher",
        prescription: "To tolerance",
        optional: true,
        note: "Skip if the deadlifts were rough.",
      },
    ],
  },
  {
    id: "light-lower",
    name: "Light Lower",
    place: "gym",
    blurb:
      "Light means the bar moves quick, not loafing. Every jump rep is fast; if one feels slow, the set is over.",
    exercises: [
      { name: "Sled push + pull", kind: "warmup", prescription: "5–10 min" },
      { name: "Seated pancakes", kind: "warmup", prescription: "~5 min" },
      {
        name: "Depth jumps",
        kind: "jump",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        note: "Step off, land, explode up immediately. Long rests. Past ~5 reps quality collapses and you are only absorbing landings.",
      },
      {
        name: "Weighted jumps",
        kind: "jump",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        note: "After depth jumps, never supersetted. Every rep fast.",
      },
      {
        name: "Approach jumps at a rim",
        kind: "jump",
        prescription: "~5 min",
        optional: true,
        note: "Only with rim access. Skill practice, like shooting practice — not conditioning.",
      },
      {
        name: "Trap bar deadlift",
        kind: "compound",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        note: "80–85% of heavy-day weight. Crisp bar speed.",
      },
      { name: "Smith machine squat", kind: "compound", prescription: "2 × 5", sets: 2, reps: 5 },
      { name: "Lying leg curl", kind: "isolation", prescription: "2 × 5", sets: 2, reps: 5 },
      { name: "Sled", kind: "finisher", prescription: "To tolerance", optional: true },
    ],
  },
  {
    id: "heavy-upper",
    name: "Heavy Upper",
    place: "gym",
    blurb:
      "Bench is the one exception to the two-set cap, because total flat pressing volume is the bench bottleneck.",
    exercises: [
      { name: "Sled", kind: "warmup", prescription: "5–10 min" },
      {
        name: "Shoulder warmup",
        kind: "warmup",
        prescription: "~5 min",
        note: "External rotations and similar.",
      },
      {
        name: "Pullups",
        kind: "compound",
        prescription: "2 × 4–5",
        sets: 2,
        reps: 4,
        repsMax: 5,
        note: "Clean reps only, no grinding.",
      },
      {
        name: "Bench press",
        kind: "compound",
        prescription: "3–4 × 5",
        sets: 3,
        setsMax: 4,
        reps: 5,
        // Aug 5, 2026 revision: incline pressed on this day counts toward the
        // prescription — the plan check pools it with flat bench.
        alternative: "Incline bench press",
        note: "Shoulder blades pinned, stop short of hard lockout, don't sink the bar so deep the shoulders roll forward. Add 2.5–5 lbs when all sets move well. Incline sets count toward the 3–4.",
      },
      {
        name: "Cable row",
        kind: "compound",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        alternative: "Lat pulldown",
        note: "Pick one; can alternate week to week.",
      },
      {
        name: "Preacher curl",
        kind: "isolation",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        note: "Protects the elbows as pullup volume grows.",
      },
      {
        name: "Seated Y raise",
        kind: "isolation",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        note: "Shoulder insurance.",
      },
      {
        name: "Dips",
        kind: "isolation",
        prescription: "1 × 10",
        sets: 1,
        reps: 10,
        note: "Stop just short of lockout.",
      },
    ],
  },
  {
    id: "light-upper",
    name: "Light Upper",
    place: "gym",
    blurb:
      "Both pulls fit today because the bench is lighter. Smooth bar speed on every press, no grinding.",
    exercises: [
      { name: "Sled", kind: "warmup", prescription: "5–10 min" },
      { name: "Shoulder warmup", kind: "warmup", prescription: "~5 min" },
      {
        name: "Pullups",
        kind: "compound",
        prescription: "2 sets",
        sets: 2,
        note: "Every few weeks make one set an all-out test, to track the path to 10.",
      },
      {
        name: "Bench press",
        kind: "compound",
        prescription: "3 × 8 @ 135–145 lbs",
        sets: 3,
        reps: 8,
      },
      { name: "Lat pulldown", kind: "compound", prescription: "2 × 5", sets: 2, reps: 5 },
      { name: "Cable row", kind: "compound", prescription: "2 × 5", sets: 2, reps: 5 },
      { name: "Preacher curl", kind: "isolation", prescription: "2 × 5", sets: 2, reps: 5 },
      { name: "Seated Y raise", kind: "isolation", prescription: "2 × 5", sets: 2, reps: 5 },
      {
        name: "Cable fly",
        kind: "isolation",
        prescription: "2 sets",
        sets: 2,
        optional: true,
        note: "This day only. Cut from the heavy day as redundant pressing.",
      },
      { name: "Dips", kind: "isolation", prescription: "1 × 10", sets: 1, reps: 10 },
    ],
  },
  {
    id: "off-a",
    name: "Off Day A — Jump Support",
    place: "home",
    blurb: "About 15 minutes at home. Low intensity by design — this is support, not a session.",
    exercises: [
      {
        name: "Pogo hops",
        kind: "jump",
        prescription: "2 × 20",
        sets: 2,
        reps: 20,
        note: "Stiff ankles, minimal knee bend, quick off the ground. Springy, not high — tendon stiffness without soreness.",
      },
      {
        name: "Knee-to-wall drill",
        kind: "mobility",
        prescription: "2 × 10 slow per side",
        sets: 2,
        reps: 10,
        optional: true,
        note: "Conditional — only if the wall test fails. See the open item on /program.",
      },
      {
        name: "Two-leg slow calf raises",
        kind: "isolation",
        prescription: "2 × 10",
        sets: 2,
        reps: 10,
        note: "Off a step holding the 35 lb bell. Three seconds down, pause at the top.",
      },
      {
        name: "Copenhagen plank",
        kind: "core",
        prescription: "2 × 15 sec/side",
        sets: 2,
        note: "Bent knee, on a couch or bench. Groin strength protects against injury as jump volume climbs.",
      },
    ],
  },
  {
    id: "off-b",
    name: "Off Day B — Upper Support",
    place: "home",
    blurb: "About 15 minutes at home. Free bench volume without a gym visit.",
    exercises: [
      {
        name: "Pushups",
        kind: "compound",
        prescription: "2 sets",
        sets: 2,
        note: "Stop a few reps short of failure.",
      },
      {
        name: "Band pull-aparts",
        kind: "isolation",
        prescription: "2 × 20",
        sets: 2,
        reps: 20,
        note: "Slow and controlled.",
      },
      {
        name: "Kettlebell overhead hold",
        kind: "isolation",
        prescription: "2 × 30 sec/arm",
        sets: 2,
        note: "25 lb bell. Ribs down, elbow soft but not locked. Shoulder stability matters more given the hypermobility.",
      },
      {
        name: "Dead bugs",
        kind: "core",
        prescription: "2 × 10",
        sets: 2,
        reps: 10,
        note: "Lower back glued to the mat.",
      },
    ],
  },
  {
    id: "stretch",
    name: "Stretch Under Tension",
    place: "home",
    blurb:
      "About 20 minutes. Loaded stretching only — the muscle under tension protects the joint, which is why this is fine while passive stretching is not. Stop at the first real stretch, never max range.",
    exercises: [
      {
        name: "Goblet squat pry",
        kind: "mobility",
        prescription: "2 × 45 sec",
        sets: 2,
        note: "25 lb. Hips and ankles, for squatting.",
      },
      {
        name: "Long lunge hold",
        kind: "mobility",
        prescription: "2 × 30 sec/side",
        sets: 2,
        note: "Hip flexors, for jumping. Add the bell if it feels easy.",
      },
      {
        name: "Slow single-leg RDL",
        kind: "mobility",
        prescription: "5/side, 5 sec down",
        sets: 2,
        reps: 5,
        note: "35 lb. Hamstrings for the deadlift. Pause at the bottom stretch.",
      },
      {
        name: "Bent-knee calf stretch on step",
        kind: "mobility",
        prescription: "2 × 8/side, 3 sec pause",
        sets: 2,
        reps: 8,
        note: "Achilles, for the jump.",
      },
      {
        name: "Kettlebell pullover",
        kind: "mobility",
        prescription: "2 × 8, 3 sec down",
        sets: 2,
        reps: 8,
        note: "25 lb. Lats and chest — hits pullups, bench and dips at once.",
      },
      {
        name: "Deep pushup hold",
        kind: "mobility",
        prescription: "2 × 15–20 sec",
        sets: 2,
        note: "The bottom of bench and dips. Kneel if needed.",
      },
      {
        name: "Prying floor press stretch",
        kind: "mobility",
        prescription: "20 sec/side",
        sets: 1,
        note: "Chest opener.",
      },
    ],
  },
];

export function plannedSession(id: SessionType): PlannedSession | undefined {
  return PROGRAM.find((s) => s.id === id);
}

/**
 * What to do on a trip, with no gym and usually no equipment.
 *
 * Deliberately NOT a `PROGRAM` entry and deliberately not a `SessionType`. Two
 * reasons. A PROGRAM entry is a thing `comparePlan()` grades a logged session
 * against, and grading a maintenance week would be scoring a week whose whole
 * point is that it does not count. And a SessionType is something you can write
 * in `data/workouts.csv`; days away are recorded by a row in `data/breaks.csv`,
 * which is what that file is for. So this renders on `/program` as reference and
 * touches nothing else — no comparison, no session chip, no frequency count.
 *
 * It lives here rather than only in the trip's break note because it is not
 * about one trip. Added August 13, 2026 for the August 14–19 trip; the dates
 * stay in `data/breaks.csv` and only the protocol is here, so the next trip
 * reads the same page instead of re-deriving it.
 */
export const AWAY_FROM_THE_GYM: {
  blurb: string;
  substitutions: { programmed: string; away: string }[];
  days: { when: string; work: string }[];
  avoid: { title: string; body: string }[];
  returning: string;
} = {
  blurb:
    "A trip is not a deload and not a layoff — it is a maintenance week. Six days costs essentially nothing: the August 5–13 gap ended with the trap bar moving better at the same 260. The goal is to come home unstiff and unhurt, not to have trained. Four short sessions across a six-day trip is the dose, and travel days get walking and nothing else. Where a session calls for the 25 or 35 lb bell, a backpack with 20–25 lbs of books or a bag of rice usually solves it — a house normally has the makings and a hotel normally does not, in which case drop to bodyweight and accept the smaller stimulus.",
  substitutions: [
    {
      programmed: "Goblet squat pry (25 lb)",
      away: "Loaded backpack held at the chest, or grip a door frame and let it be the counterweight",
    },
    {
      programmed: "Kettlebell pullover (25 lb)",
      away: "Loaded backpack in both hands; a dead hang if there is a bar",
    },
    {
      programmed: "Slow single-leg RDL (35 lb)",
      away: "Same movement, backpack or bodyweight, still 5 sec down",
    },
    {
      programmed: "Two-leg calf raises (35 lb)",
      away: "Single-leg, bodyweight, off a stair — one leg roughly doubles the load, which is what the bell was for",
    },
    {
      programmed: "Band pull-aparts",
      away: "Skip it. Shoulder insurance is the one item a week without costs nothing",
    },
    {
      programmed: "Kettlebell overhead hold",
      away: "Plank shoulder taps, 10/side, hips still",
    },
    {
      programmed: "Bench press",
      away: "Feet-elevated pushups — feet on a chair shifts load to the upper chest and raises the share of bodyweight pressed, which is what makes it a substitute rather than a warmup",
    },
    { programmed: "Dips", away: "Diamond pushups" },
    {
      programmed: "Pullups",
      away: "A bar if one exists — park, tree branch, garage beam: 2 × 3–4 easy reps, twice in the week. Otherwise accept the gap",
    },
  ],
  days: [
    {
      when: "Travel day",
      work: "Walking. Long lunge hold and deep squat hold on arrival if stiff",
    },
    {
      when: "Day 1",
      work: "Feet-elevated pushups 3 sets · dead bugs 2 × 10 · side plank 2 × 20 sec/side",
    },
    {
      when: "Day 2",
      work: "Pogo hops 2 × 20 · single-leg calf raises 2 × 12/side · single-leg RDL 2 × 5/side · Copenhagen plank 2 × 15 sec/side",
    },
    { when: "Day 3", work: "The full Stretch Under Tension day, with the substitutions above" },
    {
      when: "Day 4",
      work: "Diamond pushups 3 sets · plank shoulder taps 2 × 10/side · dead bugs 2 × 10",
    },
    { when: "Travel day", work: "Nothing" },
  ],
  avoid: [
    {
      title: "Bench dips off a chair or a bed edge",
      body: "The obvious dip substitute and a bad one here: hands behind the body force the shoulder into extension plus internal rotation at end range, which is exactly the position the hypermobility rules exist to keep it out of. Diamond pushups reach the same tissue without going there.",
    },
    {
      title: "High-rep circuits to failure",
      body: "Sets of 50 pushups are not a bench substitute; they are soreness that follows you home and blunts the first session back. Stop a few reps short on every set, the same as in the gym.",
    },
  ],
  returning:
    "Coming back, the first session is a normal one rather than a make-up session, and the weights resume where they left off rather than backing down.",
};

/** Scheduling constraints. Only two, deliberately — the days float otherwise. */
export const SCHEDULING_RULES = [
  "Don't stack heavy lower right after light lower.",
  "Give bench a day or two between sessions.",
];

export const PROGRESSION_RULES: { title: string; body: string }[] = [
  {
    title: "Main lifts",
    body: "Add 2.5–5 lbs to the deadlift, squat and heavy-day bench whenever all work sets move well. Target pace on deadlift and squat is about 2 lbs a week.",
  },
  {
    title: "Pullups",
    body: "Progress through frequency, not grinding. Most sets stay at 4–5 clean reps; an all-out test set every few weeks tracks the path to 10. Optionally add two easy sets at the start of lower days if the elbows feel good.",
  },
  {
    title: "Deload",
    body: "Every 4–5 weeks take a lighter week — same exercises, weight dropped 10–15%. Hypermobile joints need it more than most, and the bar usually moves faster the week after.",
  },
  {
    title: "Basketball",
    body: "Counts as fatigued jump work. On a day you play, drop that day's off-day session.",
  },
  {
    title: "November option",
    body: "Once the base is built, a few jumps at the end of one session a week practises expressing power while tired. A finishing touch, not main work.",
  },
];

export const HYPERMOBILITY_RULES = [
  "Stop just short of full lockout on bench, dips and any pressing.",
  "On bench: shoulder blades pinned, and don't sink the bar so deep the shoulders roll forward. If the front of the shoulder starts complaining as volume climbs, check this bottom position first.",
  "No long passive stretching. Loaded stretching only.",
  "When stretching, stop at the first real stretch, never max range. Sharp or pinchy joint sensation means it has drifted past muscle into joint range — back off an inch.",
  "Controlled tempos throughout.",
  "Carries, overhead holds and Copenhagen planks double as joint-stability work.",
  "Deload weeks matter more here than they would for most lifters.",
];

export const RATIONALE: { title: string; body: string }[] = [
  {
    title: 'What "stretch under tension" means',
    body: "The muscle is working while it is at length — the opposite of sinking into a position and relaxing there. In a passive stretch the muscle switches off and the load transfers at end range to the joint capsule and ligaments, which here means loading the exact tissue that is already too lax and buying range there is no strength in. Under load the working muscle is an active brake protecting the joint, and any range gained is range that can be controlled. Every movement on the stretch day is built that way: the goblet pry holds the bottom of a squat rather than being pushed into it, the single-leg RDL is a five-second eccentric rather than a hamstring stretch, the deep pushup hold keeps the arms working while the chest sits at length. Hence the three rules — move slow, stop at the first real stretch rather than max range, and read sharp or pinchy as the signal it has left muscle range for joint range.",
  },
  {
    title: "Jumps moved to the start of lower days",
    body: "The old routine had 2×10 weighted jumps supersetted with 2×10 depth jumps at the end, after deadlifts, squats and machine work. Jumping tired teaches slow mechanics, and tired reps don't raise a vertical. Total jump volume dropped by more than half, but every rep is now done fresh, which is the only kind that raises a vertical.",
  },
  {
    title: "Why not train jumping fatigued, if the goal is an in-game dunk?",
    body: "Fresh training raises the ceiling, and the ceiling is what carries into games. If a dunk needs a 32-inch jump and the fresh max is 33, the in-game jump is about 29 — rim grabs. Raise the fresh max to 37 and the tired jump is about 33 — dunks. Fatigued athleticism comes free from playing basketball.",
  },
  {
    title: "Depth jump dose cut hard",
    body: "They are the most demanding jump variant. Past about 5 reps a set the quality collapses and you are only absorbing landings, which is where the injury risk sits — especially with hypermobility.",
  },
  {
    title: "Bench is the volume exception",
    body: "2×5 twice a week cannot move a bench from 165 to 225. Heavy day went to 3–4×5, light day to 3×8, plus pushups at home. The bottleneck was total flat volume, not a missing angle — which is why incline was rejected: it carries over less than rep-for-rep, and dips plus pushups already give pressing variety. If flat sets feel stale around October, one light-day set can become incline at 8 reps.",
  },
  {
    title: "Cuts made",
    body: "Cable flies off the heavy day (a third or fourth exercise hitting the same tissue as bench, dips and pushups), one of row/pulldown off the heavy day, and leg extensions entirely. The routine wasn't bloated, it was spread thin — the cuts freed time and energy for the lifts being chased.",
  },
  {
    title: "Kept on purpose",
    body: "Preacher curls for elbow protection under rising pullup volume, Y raises for shoulder health, leg curls because hamstrings drive both the deadlift and the jump, and the sled — full-body blood flow with no eccentric, so no added soreness, plus free work capacity.",
  },
  {
    title: "Never superset explosive work",
    body: "Every rep must be fresh and fast. Supersetting defeats the purpose.",
  },
];

export const OPEN_ITEMS: { title: string; body: string }[] = [
  {
    title: "The ankle drill",
    body: "Knee-to-wall replaced single-leg calf raises, but the two train different things: knee-to-wall trains range, the calf raises trained strength — and with hypermobility, range is usually already in surplus. Test: stand facing a wall, foot about four inches away, drive the knee over the toes without the heel lifting. Touches easily → the ankles aren't stiff and the drill won't do much, so skip it. Can't touch → do it, 2×10 slow per side. Either way the two-leg loaded calf raise stays, because the Achilles is a big part of the jump and pogos only cover part of it.",
  },
  {
    title: "Bodyweight owns the fall",
    body: "Two goals trade off: gaining bodyweight helps the bench and hurts the dunk. Pick which one owns the autumn rather than splitting the difference by accident.",
  },
  {
    title: "Bench reality check, late October",
    body: "Around late October, check whether the pace supports 225×5 by December or the realistic 195–205, so expectations adjust early instead of in December.",
  },
];

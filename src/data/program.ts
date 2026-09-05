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
        // Sep 5, 2026: the belt and the neck cue, after the second back
        // episode. Both are argued in docs/training-plan.md section 9.
        note: "Add 5 lbs when both sets move well, and never 10 — the 10 lb step is the working suspect for the September back soreness. Belt on for these two sets only; the ramp before them is beltless. Chin packed, eyes on the floor a couple of metres ahead: the belt holds the trunk, the eyes hold the neck.",
      },
      {
        name: "Smith machine squat",
        kind: "compound",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        note: "Belt on for the work sets, off for the ramp. Add 5 lbs when both sets move well.",
      },
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
        note: "80–85% of heavy-day weight. Crisp bar speed. Beltless — this day is what keeps the unbelted brace trained.",
      },
      {
        name: "Smith machine squat",
        kind: "compound",
        prescription: "2 × 5",
        sets: 2,
        reps: 5,
        note: "Beltless, as above.",
      },
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
      {
        name: "Bird dog",
        kind: "core",
        prescription: "2 × 8/side, 3 sec hold",
        sets: 2,
        reps: 8,
        note: "Lower back stability without taking the spine anywhere. Added September 5, 2026, after the second back episode.",
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
        name: "Side plank",
        kind: "core",
        prescription: "2 × 20–30 sec/side",
        sets: 2,
        note: "From the knees if the hip complains. Lateral trunk stiffness for the lower back; with the dead bugs, the off-day half of the trunk block. Added September 5, 2026.",
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
  daily: { goal: string; movement: string; dose: string; loading: string }[];
  /**
   * For the lower back, added September 5, 2026 after the second episode.
   * Stability, not stretching: none of these takes the spine anywhere, all of
   * them make it stiffer, which is what a hypermobile back that has strained
   * twice needs and what it can do daily. See docs/training-plan.md section 9.
   */
  trunk: { name: string; dose: string; note: string }[];
  feet: { name: string; dose: string; note: string }[];
  avoid: { title: string; body: string }[];
  returning: string;
} = {
  blurb:
    "A trip is not a deload and not a layoff — it is a maintenance week. Six days should cost little, but the log does not yet show that and this section used to claim it did: it cited the August 5–13 gap ending with the trap bar moving better at the same 260. The 260 was a typo, corrected on August 14 — the session was 240, the re-entry load the plan itself prescribed, and it was never pushed past that. An easy set at a deliberately conservative weight measures the prescription, not the layoff. The claim is withdrawn rather than restated more softly, and the first heavy lower session after a break is the only thing that will settle it. So this is not a substitute program, it is one loaded-stretch movement per goal lift, done daily, in about twelve minutes. Daily works precisely because nothing here goes near failure — the moment something is sore, drop that item for the day rather than pushing it. ASSUME NO EQUIPMENT AT ALL: no weights, no bands, no improvised load. A floor, a chair, a step and a doorway is the whole kit.",
  daily: [
    {
      goal: "Trap bar deadlift",
      movement: "Slow single-leg RDL — bodyweight, 5 sec down, free arm reaching forward, pause at the bottom",
      dose: "2 × 5/side",
      loading: "Hamstring at length. The reach lengthens the lever and takes back some of the load the 35 lb bell was providing",
    },
    {
      goal: "Smith machine squat",
      movement: "Deep squat hold — grip a door frame or doorknob and lean back into the bottom",
      dose: "2 × 45 sec",
      loading: "Hips and ankles at the bottom position. The grip is the counterweight the goblet pry used the bell for, and it does that job better",
    },
    {
      goal: "Bench press",
      movement: "Deep pushup hold — kneel if needed",
      dose: "2 × 15–20 sec",
      loading: "Chest and front shoulder at the bottom of a press",
    },
    {
      goal: "Dips",
      movement: "Nothing of its own — the deep pushup hold above is already the bottom of a dip as well as a bench",
      dose: "shared",
      loading: "Deliberately shared rather than left blank. The position a dip would add is deeper shoulder extension, which is the one place the hypermobility rules say not to go looking",
    },
    {
      goal: "Pullups",
      movement: "Active hang if there is a bar — shoulders pulled down away from the ears, never a passive dangle. No bar: kneel at a chair, elbows on the seat, hips back, chest sinking, then drive the elbows down into the seat and hold",
      dose: "2 × 20–30 sec",
      loading: "Lats at length. The active part is the whole point — a relaxed hang hands the load to the shoulder capsule, which is the tissue already too lax",
    },
    {
      goal: "Jumps",
      movement: "Pogo hops, then slow single-leg calf raises off a step — 3 sec down, pause in the stretch",
      dose: "2 × 20, then 2 × 10/side",
      loading: "Tendon stiffness, then the Achilles at length. The slow lowering is what makes the calf raise a loaded stretch and not just a calf raise",
    },
    {
      goal: "Jumps and squat, shared",
      movement: "Reverse Nordic — kneel upright with a cushion under the knees, hips straight and ribs down, lean back under control and come back. Go shallow at first",
      dose: "2 × 5, 3–5 sec down",
      loading: "Quads and hip flexors eccentrically at length. This is the eccentric hip-flexor slot: it sits here rather than under the deadlift, because the deadlift's tissue at length is hamstring and the hip flexors are what the plan already assigns to jumping",
    },
  ],
  trunk: [
    {
      name: "Bird dog",
      dose: "2 × 8/side, 3 sec hold",
      note: "Opposite arm and leg, hips level, nothing else moves. The hold is the work.",
    },
    {
      name: "Side plank",
      dose: "2 × 20–30 sec/side",
      note: "From the knees if the hip complains. Lateral trunk stiffness, the direction a hinge does not train.",
    },
    {
      name: "Dead bugs",
      dose: "2 × 10",
      note: "Lower back glued to the floor throughout. If it lifts, shorten the reach.",
    },
    {
      name: "Bracing drill",
      dose: "10 × 5 sec",
      note: "On the back first: breathe into the belly and the sides, not the chest. Then standing, the same breath pushed hard against a hand on the stomach and held five seconds. This is the skill the belt amplifies — a belt braced into with a chest breath is a leather accessory. If the belt travelled, finish with a few bodyweight hinges and squats in it, so nothing about it is new when there is a bar in hand.",
    },
  ],
  feet: [
    {
      name: "Short foot (arch doming)",
      dose: "2 × 10/side, 3 sec holds",
      note: "Barefoot, foot flat. Draw the ball of the foot toward the heel to raise the arch WITHOUT curling the toes — the toes staying long is what separates this from a toe scrunch.",
    },
    {
      name: "Single-leg barefoot balance",
      dose: "30 sec/side, then try it with eyes closed",
      note: "Trains the foot to stabilise actively rather than collapsing onto its ligaments — the same principle as everything else here, applied to the arch.",
    },
    {
      name: "Supinated calf raise",
      dose: "folded into the 2 × 10/side above",
      note: "Bias the weight to the outside edge of the foot on the way up. Supination is what makes the foot a rigid lever at takeoff, so this is jump work as much as foot work.",
    },
  ],
  avoid: [
    {
      title: "Dips off a bed, a chair or a bath edge",
      body: "The obvious dip substitute and the worst option in the house. Hands behind the body force the shoulder into extension plus internal rotation at end range, which is precisely the position the hypermobility rules exist to keep it out of, and a mattress adds an unstable surface under a bodyweight load. There is no version of this worth the risk for six days of maintenance — the deep pushup hold reaches the same tissue from a safe direction.",
    },
    {
      title: "Passive hanging, and passive anything",
      body: "A dead hang with the shoulders relaxed up around the ears is the single most tempting mistake available on this list, because it feels like a great stretch. It is load transferred straight to the shoulder capsule. If the shoulders cannot stay actively depressed, the hang is over — do the chair version instead.",
    },
    {
      title: "High-rep circuits to failure",
      body: "Sets of 50 pushups are not a bench substitute; they are soreness that follows you home and blunts the first session back. Every item here stops well short, which is also what makes doing them daily safe.",
    },
  ],
  returning:
    "Coming back, the first session is a normal one rather than a make-up session, and the weights resume where they left off rather than backing down. The one exception is a new piece of equipment: the first session with the belt runs at the last settled working weight rather than the last step up, so the belt is learned before it is loaded.",
};

/**
 * The belt and the lower back. Written September 5, 2026, after the second
 * back episode and the purchase of a weightlifting belt; the reasoning is in
 * docs/training-plan.md section 9. Rendered on /program beside the progression
 * rules because that is what the belt is — a progression tool with rules about
 * when it may be used — and not a hypermobility rule, though hypermobility is
 * why the beltless sets in it are not negotiable.
 */
export const BELT_AND_BACK: { title: string; body: string }[] = [
  {
    title: "What the belt does",
    body: "The abdominal wall braces against the belt instead of against nothing, so the same breath makes more pressure inside the trunk, and pressure is what holds a spine stiff under a bar. The August 28 trap bar sets were tired and five sore mornings followed; tired is what a trunk that has run out of stiffness feels like. That is what the belt supplies. It does not hold the spine up — worn loose, or braced into with a chest breath, it is a leather accessory — and it does not build trunk strength, it borrows it.",
  },
  {
    title: "How to wear it",
    body: "Around the narrowest part of the waist, over the navel or a little below; move it down or loosen a notch if it digs into the ribs at the bottom of the squat. Tight enough that a full belly breath pushes hard against it, loose enough that the breath can be taken at all — a flat hand fits between belt and stomach before the breath and not after, and it usually runs a notch looser for the deadlift than the squat. The rep: stand tall, big breath into the belly and the sides, push out into the belt, hold through the rep, exhale at the top. Re-brace every rep at first.",
  },
  {
    title: "When it goes on",
    body: "Heavy lower, and only the work sets of the trap bar deadlift and the Smith squat. The ramp sets before them are beltless. Light lower is beltless throughout: 80–85% at crisp bar speed is well inside what the unbelted trunk can hold, and that day is what keeps the trunk trained. Not on the leg curl, the jumps, the sled or any upper day. A lifter with lax ligaments and two back episodes must not end up with a trunk that only works in a belt, and the beltless sets are the answer to that.",
  },
  {
    title: "What to expect from it",
    body: "A few percent on the top sets once the brace is learned — 270 in the belt should feel closer to the August 20 260 than to the August 28 270 — and that is the whole gain on day one. The number rises afterwards by the plan's own rule, 5 lbs when both sets move well; what the belt changes is that 5 becomes the normal step and that each step lands more often. It does not make 10 lb steps safe. Five is the cap.",
  },
  {
    title: "The lower back",
    body: "The gate stands: fine if the back warms up and stays dull and two-sided, a flag if anything is sharp or one-sided, and sharp stops the session. Report the two mornings after every heavy lower; soreness not fading by the third morning is a flag, and a fourth sore morning means the next heavy lower repeats its weight. The trunk block — bird dog, side plank, dead bugs — runs daily on trips and is split across the two off days at home. Never stretch the lower back: a forward fold or a twist feels like relief and loads the ligaments that already give too much. The neck goes with this: chin packed, eyes on the floor a couple of metres ahead, and the head never leads the bar.",
  },
];

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

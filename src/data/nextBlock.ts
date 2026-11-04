/**
 * The next block: the routine from November 30, 2026, after the last stretch
 * and Mexico, to June 27, 2027. Rendered at `/next-block`.
 *
 * Drafted October 27 – November 4, 2026, and audited on November 4. It is a
 * plan document, not a calendar: it says what a week is made of and the rules
 * for moving the pieces around a hectic schedule. The only dated rows are the
 * heavy days that close the last two strength goals, and those live in
 * `data/last-stretch.csv` with the rest of the stretch. Section 11 of
 * `docs/training-plan.md` has the reasoning behind the shape.
 *
 * Nothing in `program.ts` knows about these sessions yet. They get program
 * entries, and the starting weights get numbers, after Mexico.
 */

export type PieceId = "H" | "B2" | "B3" | "J" | "J2" | "I" | "Z" | "knees" | "hips";

/** Drives the chip colour: the four session hues the week strip already validates. */
export type PieceKind = "heavy" | "bench" | "jump" | "cardio" | "joint";

export interface Item {
  name: string;
  dose: string;
  /** Warmups print muted and unnumbered. */
  warmup?: boolean;
}

export interface Piece {
  id: PieceId;
  /** Chip text where space is short. */
  short: string;
  name: string;
  /** The big word on a week tile, and the line under it. */
  tile: { big: string; sub?: string };
  kind: PieceKind;
  when: string;
  time: string;
  items: Item[];
  note?: string;
}

export const PIECES: Piece[] = [
  {
    id: "H",
    tile: { big: "Heavy", sub: "full body" },
    short: "Heavy",
    name: "Heavy full body",
    kind: "heavy",
    when: "Once a week, on a weekday, fed",
    time: "~90 min with warmups",
    items: [
      { name: "Bike or sled, pancakes, shoulder warmup with band pull-aparts", dose: "10 min", warmup: true },
      { name: "Bench press", dose: "T × 5, then 2 × 5 at T − 15" },
      { name: "Trap bar deadlift, belted, after a beltless ramp", dose: "1 × 3" },
      { name: "Pullups", dose: "2 × 5" },
      { name: "Smith squat, belted, after a ramp", dose: "1 × 3" },
      { name: "Dips", dose: "1 × 10" },
    ],
    note: "Bench goes first because it's the only lift here meant to climb. The trap bar and squat take a set of 3 on ordinary weeks and a set of 5 on the last heavy day of a block, which is the test. If 300 × 3 grinds two weeks running, drop to 285 and climb back.",
  },
  {
    id: "B2",
    tile: { big: "Bench", sub: "volume" },
    short: "Bench volume",
    name: "Bench volume",
    kind: "bench",
    when: "A weekday, two or more days after the heavy day",
    time: "45 min",
    items: [
      { name: "Bench press", dose: "3 × 8 at T − 30" },
      { name: "Pullups", dose: "2 × 5" },
      { name: "Incline chest press machine", dose: "2 × 8" },
      { name: "Cable row", dose: "2 × 5" },
      { name: "Cable triceps pushdown", dose: "2 × 10" },
    ],
    note: "The pullups and row keep pulling close to pressing, which keeps a hypermobile shoulder centred while the bench climbs.",
  },
  {
    id: "B3",
    tile: { big: "Bench", sub: "light, paused" },
    short: "Light bench",
    name: "Light paused bench",
    kind: "bench",
    when: "Sunday",
    time: "25 min",
    items: [
      { name: "Shoulder warmup with band pull-aparts", dose: "5 min", warmup: true },
      { name: "Deep pushup hold", dose: "2 × 15–20 s", warmup: true },
      { name: "Paused bench, 1 s on the chest", dose: "3 × 5 at T − 25" },
      { name: "Pullups", dose: "2 × 5" },
      { name: "Seated Y raise", dose: "2 × 5 at 20" },
    ],
    note: "Blades pinned. The bar touches and stops; the chest doesn't sink to meet it.",
  },
  {
    id: "J",
    tile: { big: "Jumps" },
    short: "Jumps",
    name: "Jumps",
    kind: "jump",
    when: "Saturday",
    time: "40 min",
    items: [
      { name: "Bike or sled", dose: "5–10 min", warmup: true },
      { name: "Pogo hops", dose: "2 × 20" },
      { name: "Depth jumps", dose: "2 × 5" },
      { name: "Approach jumps to the wall target, one foot and two", dose: "~10 min" },
      { name: "Weighted jumps", dose: "2 × 5 at 20s" },
      { name: "Bulgarian split squat", dose: "2 × 6 a leg" },
      { name: "Lying leg curl", dose: "2 × 5" },
    ],
    note: "Stop the approach jumps when two touches in a row land 2 inches below the day's best, and keep the one-foot jumps about even between the legs. A hoop, when there is one, replaces the wall.",
  },
  {
    id: "J2",
    tile: { big: "Jumps", sub: "short" },
    short: "Short jumps",
    name: "Short jumps",
    kind: "jump",
    when: "Before bench volume",
    time: "10 min",
    items: [
      { name: "Easy bike", dose: "5 min", warmup: true },
      { name: "Approach jumps to the wall target", dose: "3 × 3" },
    ],
    note: "The week's second jump session, two days from Saturday's. It goes when bench volume goes.",
  },
  {
    id: "I",
    tile: { big: "Intervals" },
    short: "Intervals",
    name: "Intervals",
    kind: "cardio",
    when: "After bench volume",
    time: "25 min",
    items: [
      { name: "Bike, hard enough for only a few words", dose: "4 × 4 min" },
      { name: "Easy between", dose: "3 min" },
    ],
    note: "Starts as 4 × 2 min. Sled pushes, heavy bag rounds or the rower can stand in, and basketball will once you're playing again.",
  },
  {
    id: "Z",
    tile: { big: "Zone 2" },
    short: "Zone 2",
    name: "Zone 2",
    kind: "cardio",
    when: "Anywhere, about 2 hours a week",
    time: "20–60 min a go",
    items: [
      { name: "Bike or elliptical", dose: "first choice" },
      { name: "Treadmill", dose: "~10% incline" },
      { name: "Sled", dose: "when it's free" },
    ],
    note: "Easy enough to hold a conversation in full sentences. A flat walk rarely gets there. Half the amount the first week, the full amount by the third.",
  },
  {
    id: "knees",
    tile: { big: "Knees" },
    short: "Knees",
    name: "Knees and shins",
    kind: "joint",
    when: "With the jumps",
    time: "12 min",
    items: [
      { name: "Backwards sled, or backwards treadmill walk", dose: "5 min" },
      { name: "Wall tibialis raise", dose: "2 × 20" },
      { name: "Slow step-up, knee over toe", dose: "2 × 10 a leg" },
    ],
    note: "For the tib raise, stand with your back to a wall, heels a foot out and legs straight, and lift the toes toward the shins.",
  },
  {
    id: "hips",
    tile: { big: "Hips" },
    short: "Hips",
    name: "Hips and calves",
    kind: "joint",
    when: "With the light bench",
    time: "12 min",
    items: [
      { name: "Knee raises on the roman chair", dose: "2 × 10" },
      { name: "Slow straight-knee calf raise, leg press or a step", dose: "2 × 12" },
      { name: "Reverse hyper on a flat bench", dose: "2 × 12" },
    ],
    note: "For the reverse hyper, lie face down with your hips at the end of the bench and raise straight legs until they're level with the body, never higher.",
  },
];

export const pieceById = (id: PieceId): Piece => PIECES.find((p) => p.id === id)!;

/** Which piece names a day when several share it: the heavy day, then bench, jumps, cardio. */
export const KIND_RANK: Record<PieceKind, number> = { heavy: 0, bench: 1, jump: 2, cardio: 3, joint: 4 };

/** One piece of a day, with minutes where the piece is Zone 2. */
export interface Slot {
  id: PieceId;
  minutes?: number;
}

export interface WeekDay {
  day: string;
  slots: Slot[];
}

/** Five sessions, two rest days. */
export const NORMAL_WEEK: WeekDay[] = [
  { day: "Mon", slots: [] },
  { day: "Tue", slots: [{ id: "H" }] },
  { day: "Wed", slots: [{ id: "Z", minutes: 50 }] },
  { day: "Thu", slots: [{ id: "J2" }, { id: "B2" }, { id: "I" }] },
  { day: "Fri", slots: [] },
  { day: "Sat", slots: [{ id: "J" }, { id: "Z", minutes: 30 }, { id: "knees" }] },
  { day: "Sun", slots: [{ id: "B3" }, { id: "Z", minutes: 40 }, { id: "hips" }] },
];

export const RULES: { rule: string; detail: string }[] = [
  {
    rule: "Five sessions a week at most.",
    detail: "Saturday and Sunday are two of them.",
  },
  {
    rule: "The heavy day goes on a weekday, once every 5–9 days.",
    detail: "Fed, and never the day after jumps or intervals. A week with no free weekday skips it, which costs nothing once in a while.",
  },
  {
    rule: "The day after the heavy day is Zone 2 or rest.",
    detail: "No jumps and no bench.",
  },
  {
    rule: "Leave a day between bench days.",
    detail: "The heavy day counts as one.",
  },
  {
    rule: "Jumps come first and fresh.",
    detail: "First in their session, and never the day after intervals or the heavy day.",
  },
  {
    rule: "Cardio and the joint blocks ride along.",
    detail: "Zone 2 and the two joint blocks attach to any session and never need a day of their own.",
  },
];

/** The order within one visit. A short bike or sled warmup is the one exception. */
export const VISIT_ORDER = ["Jumps", "Heavy or bench", "Helpers", "Intervals", "Zone 2", "Joint blocks"];

export interface ShortWeek {
  free: string;
  weekdays: Slot[][];
  saturday: Slot[];
  sunday: Slot[];
  note?: string;
}

/** The weekend always happens, so a short week is a question of free weekdays. */
export const SHORT_WEEKS: ShortWeek[] = [
  {
    free: "3",
    weekdays: [[{ id: "H" }], [{ id: "Z", minutes: 50 }], [{ id: "J2" }, { id: "B2" }, { id: "I" }]],
    saturday: [{ id: "J" }, { id: "Z", minutes: 30 }, { id: "knees" }],
    sunday: [{ id: "B3" }, { id: "Z", minutes: 40 }, { id: "hips" }],
  },
  {
    free: "2",
    weekdays: [[{ id: "H" }], [{ id: "J2" }, { id: "B2" }, { id: "I" }]],
    saturday: [{ id: "J" }, { id: "Z", minutes: 45 }, { id: "knees" }],
    sunday: [{ id: "B3" }, { id: "Z", minutes: 45 }, { id: "hips" }],
    note: "If the two days are back to back, the second is Zone 2, and Sunday takes bench volume in place of the light bench.",
  },
  {
    free: "1",
    weekdays: [[{ id: "H" }, { id: "Z", minutes: 15 }]],
    saturday: [{ id: "J" }, { id: "Z", minutes: 45 }, { id: "knees" }],
    sunday: [{ id: "B2" }, { id: "Z", minutes: 45 }, { id: "hips" }],
    note: "If that day is Friday, Saturday becomes Zone 2 and the knees block, and Sunday opens with the jumps.",
  },
  {
    free: "0",
    weekdays: [],
    saturday: [{ id: "J" }, { id: "Z", minutes: 45 }, { id: "knees" }],
    sunday: [{ id: "B2" }, { id: "Z", minutes: 45 }, { id: "hips" }],
    note: "No heavy day. It goes on the first free weekday after.",
  },
];

export type GoalState = "open" | "done" | "climbing" | "new";

export const GOALS: { name: string; target: string; plan: string; state: GoalState }[] = [
  {
    name: "Trap bar deadlift",
    target: "300 × 5",
    plan: "Triples at 295 and 300 after Mexico, the test on Dec 15, then 300 × 3 to hold.",
    state: "open",
  },
  {
    name: "Smith squat",
    target: "225 × 5",
    plan: "Triples at 220 and 225, the test on Dec 15, then 225 × 3 to hold.",
    state: "open",
  },
  {
    name: "Pullups",
    target: "10 reps",
    plan: "Done Oct 25. Six sets of 5 a week hold it, and a max set at each block's end.",
    state: "done",
  },
  {
    name: "Dips",
    target: "10 reps",
    plan: "At target since August. One set of 10 a week holds it.",
    state: "done",
  },
  {
    name: "Bench press",
    target: "225 × 5",
    plan: "About 185–190 by the end of March and 200 by the end of June, as estimates. 225 is a fall 2027 number.",
    state: "climbing",
  },
  {
    name: "Resting heart rate",
    target: "low-to-mid 50s",
    plan: "From one reading of 60 on Sep 5. An estimate; genetics moves it a lot.",
    state: "new",
  },
  {
    name: "Abs",
    target: "visible",
    plan: "No cut for now and no date. The weekly average and the waist will show whether they're coming.",
    state: "new",
  },
  {
    name: "Dunk",
    target: "touch 6–8 in over the rim",
    plan: "You touch the rim and just about palm the ball. The wall target measures it this winter; a first dunk in April–June, if a hoop turns up.",
    state: "new",
  },
];

export const CALENDAR: { when: string; what: string; detail: string; travel?: boolean }[] = [
  {
    when: "Nov 5 – 20",
    what: "The last stretch, as drawn",
    detail: "Trap bar 290 then 295, squat 215 then 220. The Nov 12 and 19 heavy uppers set the bench top set, T.",
  },
  { when: "Nov 21 – 29", what: "Mexico", detail: "The away routine if you feel like it, and a lot of walking.", travel: true },
  { when: "Mon Nov 30", what: "The new week starts", detail: "The last stretch's Block 2 finishes on it, through Dec 15. Food as now; no cut." },
  { when: "Tue Dec 1", what: "First heavy day", detail: "Trap bar 295 × 3, squat 220 × 3, bench at T." },
  { when: "Tue Dec 8", what: "Up to the goal weights", detail: "Trap bar 300 × 3, squat 225 × 3." },
  {
    when: "Tue Dec 15",
    what: "The test",
    detail: "300 × 5 and 225 × 5, which closes the last stretch. It's the last heavy day before BC, so it moves with the BC dates.",
  },
  {
    when: "BC, dates TBD",
    what: "Two or three weeks away, still training",
    detail: "Same week at a BC gym, the first heavy day there at the last settled weights. One of the weeks is the deload.",
    travel: true,
  },
  {
    when: "After BC – Jun 27",
    what: "Blocks of 4–5 weeks",
    detail: "A deload after each. Each block's last heavy day is a test: 300 × 5, 225 × 5, a max set of pullups and the wall target.",
  },
];

/**
 * The bench backups. The Life Fitness chest press moves in 10s and reads about
 * 90% of the barbell: it went 150 × 5 on September 17, a short night after 18
 * days off, when the bench was about 160–165, so the ratio may run a little
 * low. Dumbbells at 40% a hand is a common rule of thumb, untested here.
 */
export const CHEST_PRESS_RATIO = 0.9;
export const DUMBBELL_RATIO = 0.4;

const nearest = (x: number, step: number) => Math.floor(x / step + 0.5) * step;

export function benchBackups(barbell: number): { press: number; dumbbell: number } {
  return {
    press: nearest(barbell * CHEST_PRESS_RATIO, 10),
    dumbbell: nearest(barbell * DUMBBELL_RATIO, 5),
  };
}

/** The example top set the backup lines are drawn for: the Dec 1 row in the plan file. */
export const EXAMPLE_T = 180;

export const BENCH_LINES: { line: string; offset: number; reps: string }[] = [
  { line: "Heavy top set", offset: 0, reps: "× 5" },
  { line: "Heavy back-offs", offset: -15, reps: "2 × 5" },
  { line: "Bench volume", offset: -30, reps: "3 × 8" },
  { line: "Paused", offset: -25, reps: "3 × 5" },
];

export const STARTING_WEIGHTS: { group: string; rows: { name: string; start: string; then: string }[] }[] = [
  {
    group: "Heavy full body",
    rows: [
      { name: "Bench top set, T", start: "The best clean 5 from the Nov 12 or Nov 19 heavy upper", then: "+5 when every set is clean" },
      { name: "Bench back-offs", start: "T − 15", then: "Follows T" },
      { name: "Trap bar", start: "295 × 3 on Dec 1", then: "300 × 3, the test of 5, then hold" },
      { name: "Smith squat", start: "220 × 3 on Dec 1", then: "225 × 3, the test of 5, then hold" },
      { name: "Pullups, dips", start: "2 × 5 and 1 × 10, bodyweight", then: "Hold" },
    ],
  },
  {
    group: "Bench days",
    rows: [
      { name: "Bench 3 × 8", start: "T − 30", then: "Follows T" },
      { name: "Paused bench", start: "T − 25", then: "Follows T" },
      { name: "Incline chest press machine", start: "Near two-thirds of the 3 × 8 weight, settled where 8 leaves 2 reps", then: "A step when both sets reach 10" },
      { name: "Cable row", start: "140, the last clean 2 × 5 (Oct 25)", then: "About 82% of T; a 5 lb step is the pin below for one more rep" },
      { name: "Triceps pushdown", start: "Where 10 leaves 2–3 reps", then: "A step when both sets reach 12" },
      { name: "Seated Y raise", start: "20", then: "Hold" },
    ],
  },
  {
    group: "Jumps",
    rows: [
      { name: "Pogos, depth and approach jumps", start: "Bodyweight, the same box as now", then: "Hold" },
      { name: "Weighted jumps", start: "20 a hand", then: "Hold" },
      { name: "Bulgarian split squat", start: "30 a hand (5 on Oct 10, not close to failure)", then: "Hold" },
      { name: "Lying leg curl", start: "130 (2 × 6 on Nov 3)", then: "Hold" },
    ],
  },
  {
    group: "Joint blocks and cardio",
    rows: [
      { name: "Backwards sled or treadmill", start: "Steady steps for 5 min", then: "Hold" },
      { name: "Wall tibialis raise", start: "Bodyweight, heels a foot out", then: "Heels further out at 20, then one leg" },
      { name: "Slow step-up", start: "Bodyweight, a low step", then: "A higher step, then dumbbells" },
      { name: "Knee raises", start: "Bodyweight", then: "Slower, then a light dumbbell between the feet" },
      { name: "Straight-knee calf raise", start: "Where 12 leaves 2 reps", then: "A step when both sets reach 15" },
      { name: "Reverse hyper", start: "Bodyweight", then: "A 2-second hold at level" },
      { name: "Intervals", start: "The bike level where the fourth interval is barely held", then: "A level up when the fourth is comfortable" },
    ],
  },
];

export const CUT: { what: string; why: string }[] = [
  { what: "The stretch day and the two home off days", why: "None serves a goal directly. Pogos moved to the jump day and calf raises to the hips-and-calves block." },
  { what: "Direct ab work", why: "Abs show when the fat comes off, and the crunch machine flexes the spine under load. The knee raise stays, for the hip flexors." },
  { what: "The trunk block, Copenhagen plank and overhead hold", why: "Left out by choice on Nov 4." },
  { what: "Bayesian curl", why: "It protected the elbows while pullup volume grew. Pullup volume now holds." },
  { what: "Lat pulldown", why: "Pullups do its job, and most of the pulling is pullups by choice." },
  { what: "Cable fly", why: "A fourth press on the same tissue as the bench, dips and the machine." },
  { what: "Light trap bar and squat, and the back-off sets", why: "One heavy set a week holds them." },
];

export const HYPERMOBILITY: string[] = [
  "Every rule on the program page still stands, and still no leg extensions.",
  "A jump set ends when a landing gets loud or a knee drifts in.",
  "Joint blocks run slow and stop at the first real stretch. No full-depth ATG work, Jefferson curls, couch stretch or elephant walks.",
  "Dumbbell bench stops where the bar would, with the upper arms about level with the torso.",
  "Heavy bag with wraps and gloves, punching through the bag, never into the air. The rower only while the back is quiet.",
  "Deloads every 4–5 weeks from BC on: same sessions, weights down 10–15%, intervals out.",
];

export const BEFORE: string[] = [
  "Tape a strip on a wall from 9'6\" to 11' with inch marks, and take your best touch of five off one foot and off two.",
  "Resting heart rate on waking, a full 60-second count at the wrist, three mornings a week. None has been logged since Sep 5.",
  "Weigh in on at least four mornings a week, and tape the waist at the navel once a week.",
  "The Nov 12 and Nov 19 heavy uppers set T, so there's no separate bench test.",
];

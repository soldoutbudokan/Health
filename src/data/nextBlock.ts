/**
 * The next block: the routine from January 4, 2027, after the last stretch,
 * to June 27, 2027. Rendered at `/next-block`. It was to start November 30,
 * 2026, until the owner kept the last stretch's week running through December
 * on November 5.
 *
 * Drafted October 27 – November 4, 2026, and audited on November 4. Audited
 * again on November 9, which brought in the cut, the climbing split squat, the
 * Monday week, the run and the half marathon, and took out the wall target the
 * gym won't allow. It is a
 * plan document, not a calendar: it says what a week is made of and the rules
 * for moving the pieces around a hectic schedule. The only dated rows are the
 * heavy days that close the last two strength goals, and those live in
 * `data/last-stretch.csv` with the rest of the stretch. Section 11 of
 * `docs/training-plan.md` has the reasoning behind the shape.
 *
 * Nothing in `program.ts` knows about these sessions yet. They get program
 * entries, and the starting weights get numbers, before January 4.
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
    when: "Sunday, or Saturday after the jumps when the heavy day is Monday",
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
      { name: "Approach jumps, one foot and two, at the same high mark each week", dose: "~10 min" },
      { name: "Weighted jumps", dose: "2 × 5 at 20s" },
      { name: "Bulgarian split squat, climbing", dose: "2 × 6 a leg" },
      { name: "Lying leg curl", dose: "2 × 5" },
    ],
    note: "The gym won't take a taped wall, so reach for one fixed thing every week, a beam or the top of the rig. Stop the approach jumps when two in a row come up short of the day's best, and keep the one-foot jumps about even between the legs. The split squat is the leg lift that climbs here, since it spares the back. A hoop, when there is one, is the real measure.",
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
      { name: "Approach jumps at the same high mark", dose: "3 × 3" },
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
      { name: "Easy run-walk, from February", dose: "one a week, 20–30 min" },
    ],
    note: "Easy enough to hold a conversation in full sentences. A flat walk rarely gets there. It starts in December in BC at two or three short goes a week, and reaches the full amount by Jan 18. The run-walk counts toward the two hours and goes on a weekend after the session, never the day before jumps.",
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
    when: "Sunday",
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

/** The same five sessions when Monday is the best day for the heavy one. */
export const MONDAY_WEEK: WeekDay[] = [
  { day: "Mon", slots: [{ id: "H" }] },
  { day: "Tue", slots: [{ id: "Z", minutes: 50 }] },
  { day: "Wed", slots: [] },
  { day: "Thu", slots: [{ id: "J2" }, { id: "B2" }, { id: "I" }] },
  { day: "Fri", slots: [] },
  { day: "Sat", slots: [{ id: "J" }, { id: "B3" }, { id: "knees" }] },
  { day: "Sun", slots: [{ id: "Z", minutes: 70 }, { id: "hips" }] },
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
    detail: "The heavy day counts as one. When the heavy day is Monday, Sunday's bench moves to Saturday, after the jumps.",
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
    plan: "Closes in the last stretch: 295 × 5 on Dec 1, 300 × 5 on Dec 8, with Dec 15 and 22 as tries at home. Then 300 × 3 to hold.",
    state: "open",
  },
  {
    name: "Smith squat",
    target: "225 × 5",
    plan: "Closes in the last stretch: 220 × 5 on Dec 1, 225 × 5 on Dec 8, with Dec 15 and 22 as tries at home. Then 225 × 3 to hold.",
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
    plan: "175 × 5 on Nov 5. About 195–200 by the end of March and 205–210 by the end of June, as estimates; it's the main lift now, but the cut will slow it. 225 is a fall 2027 number.",
    state: "climbing",
  },
  {
    name: "Resting heart rate",
    target: "low-to-mid 50s",
    plan: "From one reading of 60 on Sep 5. Counted by hand on waking, when you can. An estimate; genetics moves it a lot.",
    state: "new",
  },
  {
    name: "Abs",
    target: "visible",
    plan: "A cut: 2,400 kcal from Jan 18 to the end of May, protein at 180, about half a pound a week toward 175–178. Then back to 2,800.",
    state: "new",
  },
  {
    name: "Dunk",
    target: "touch 6–8 in over the rim",
    plan: "You touch the rim and just about palm the ball. Nothing at the gym can measure a touch, so progress shows at a hoop: wrist over the rim first, and a dunk in April–June at the earliest.",
    state: "new",
  },
  {
    name: "Half marathon",
    target: "October 2027",
    plan: "One easy run-walk a week from February, inside the Zone 2 hours. The 16-week build starts in July, after this block, with the jumps down to one session.",
    state: "new",
  },
];

export const CALENDAR: { when: string; what: string; detail: string; travel?: boolean }[] = [
  {
    when: "Nov 5 – 20",
    what: "The last stretch, as drawn",
    detail: "Trap bar 290 then 295, squat 215 then 220.",
  },
  { when: "Nov 21 – 29", what: "Mexico", detail: "The away routine if you feel like it, and a lot of walking.", travel: true },
  {
    when: "Nov 30 – Dec 8",
    what: "The last stretch, same week",
    detail: "Heavy lower Tuesday, heavy upper Thursday, the light days on the weekend. 295 and 220 for 5 on Dec 1, with back-offs.",
  },
  {
    when: "Tue Dec 8",
    what: "The goals",
    detail: "300 × 5 and 225 × 5, then the back-offs.",
  },
  {
    when: "Dec 9 – Jan 3",
    what: "Buffer",
    detail: "Tries at home on Dec 15 and 22 for whichever lift is still open, triples for one that closed, then Dec 29 in BC. The Dec 23 and 31 heavy uppers set the bench top set, T.",
  },
  {
    when: "Dec 24 – about Jan 15",
    what: "BC, still training",
    detail: "Same week at a BC gym, the first heavy day there at the last settled weights. Zone 2 starts here, two or three short goes a week. One of the January weeks is the deload.",
    travel: true,
  },
  {
    when: "Mon Jan 4",
    what: "The next block starts, in BC",
    detail: "Two ramp weeks on whatever the gym there has. Bench at T, the trap bar and squat at 300 × 3 and 225 × 3. Food as now.",
  },
  {
    when: "Mon Jan 18",
    what: "The full week, and the cut",
    detail: "Home. All five sessions, and 2,400 kcal with protein at 180 until the end of May.",
  },
  {
    when: "February",
    what: "The first run-walk",
    detail: "One a week on a weekend, 20 minutes to start.",
  },
  {
    when: "After BC – Jun 27",
    what: "Blocks of 4–5 weeks",
    detail: "A deload after each. Each block's last heavy day is a test: 300 × 5, 225 × 5 and a max set of pullups. The jump gets tested at a hoop whenever one is near.",
  },
  {
    when: "Jun 1",
    what: "The cut ends",
    detail: "Back to 2,800, sooner if the scale reaches 175–178 or the bench stalls for a whole block.",
  },
  {
    when: "Jul – Oct",
    what: "Half marathon build",
    detail: "Sixteen weeks to an October race, planned in June. Outside this block.",
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

/**
 * The example top set the backup lines are drawn for. The plan file's
 * all-goes-well line reaches 200 on Dec 31; 190 is nearer where a 175 on
 * Nov 5 is likely to leave it.
 */
export const EXAMPLE_T = 190;

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
      { name: "Bench top set, T", start: "The best clean 5 from the Dec 23 or Dec 31 heavy upper", then: "+5 when every set is clean" },
      { name: "Bench back-offs", start: "T − 15", then: "Follows T" },
      { name: "Trap bar", start: "300 × 3, once the goal closes", then: "Hold, and 300 × 5 on a block's last heavy day" },
      { name: "Smith squat", start: "225 × 3, once the goal closes", then: "Hold, and 225 × 5 on a block's last heavy day" },
      { name: "Pullups, dips", start: "2 × 5 and 1 × 10, bodyweight", then: "Hold" },
    ],
  },
  {
    group: "Bench days",
    rows: [
      { name: "Bench 3 × 8", start: "T − 30", then: "Follows T" },
      { name: "Paused bench", start: "T − 25", then: "Follows T" },
      { name: "Incline chest press machine", start: "Near two-thirds of the 3 × 8 weight, settled where 8 leaves 2 reps", then: "A step when both sets reach 10" },
      { name: "Cable row", start: "The last clean 2 × 5 in December", then: "About 82% of T; a 5 lb step is the pin below for one more rep" },
      { name: "Triceps pushdown", start: "Where 10 leaves 2–3 reps", then: "A step when both sets reach 12" },
      { name: "Seated Y raise", start: "20", then: "Hold" },
    ],
  },
  {
    group: "Jumps",
    rows: [
      { name: "Pogos, depth and approach jumps", start: "Bodyweight, the same box as now", then: "Hold" },
      { name: "Weighted jumps", start: "20 a hand", then: "Hold" },
      { name: "Bulgarian split squat", start: "30 a hand (5 on Oct 10, not close to failure)", then: "+5 a hand when both sets of 6 are clean on both legs" },
      { name: "Lying leg curl", start: "The last clean heavy-lower weight in December", then: "Hold" },
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
      { name: "Run-walk, from February", start: "1 min running, 2 walking, for 20 min", then: "Longer runs between the walks, to 30 min unbroken by June" },
    ],
  },
];

export const CUT: { what: string; why: string }[] = [
  { what: "The stretch day and the two home off days", why: "None serves a goal directly. Pogos moved to the jump day and calf raises to the hips-and-calves block." },
  { what: "Direct ab work", why: "Abs show when the fat comes off, which is the cut's job, and the crunch machine flexes the spine under load. The knee raise stays, for the hip flexors." },
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
  "The run-walk grows by a few minutes a week at most, and stops for a sore joint, not for hard breathing.",
];

export const BEFORE: string[] = [
  "Pick the fixed mark the approach jumps will reach for, since the gym won't take tape on a wall.",
  "Resting heart rate on waking, a full 60-second count at the wrist, when you can. None has been logged since Sep 5.",
  "Zone 2 starts in BC in December: two or three easy goes of 20–30 minutes a week.",
  "Weigh in on at least four mornings a week, and tape the waist at the navel once a week.",
  "The Dec 23 and Dec 31 heavy uppers set T, so there's no separate bench test.",
];

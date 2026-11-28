/**
 * The next block: the routine from January 4, 2027, after the last stretch,
 * to June 27, 2027. Rendered at `/next-block`. It was to start November 30,
 * 2026, until the owner kept the last stretch's week running through December
 * on November 5.
 *
 * Drafted October 27 – November 4, 2026, and audited on November 4. Audited
 * again on November 9, which brought in the cut, the climbing split squat, the
 * Monday week, the run and the half marathon, and took out the wall target the
 * gym won't allow. Audited a third time on November 28: cardio was put ahead
 * of lifting, so the bench went to two days a week and the light paused day
 * came out; the bench top set became a rep range and the volume day got its
 * own count; every bench line got its two stand-ins with a weight; the Smith
 * squat gave way to the split squat on the heavy day; the trap bar got its
 * ramp; and its set-of-5 test went from every block to one in June. It is a
 * plan document, not a calendar: it says what a week is made of and the rules
 * for moving the pieces around a hectic schedule. The only dated rows are the
 * heavy days that close the last two strength goals, and those live in
 * `data/last-stretch.csv` with the rest of the stretch. Section 11 of
 * `docs/training-plan.md` has the reasoning behind the shape.
 *
 * Nothing in `program.ts` knows about these sessions yet. They get program
 * entries, and the starting weights get numbers, before January 4.
 */

export type PieceId = "H" | "B2" | "J" | "J2" | "I" | "Z" | "knees" | "hips";

/** Drives the chip colour: the four session hues the week strip already validates. */
export type PieceKind = "heavy" | "bench" | "jump" | "cardio" | "joint";

/** One line under a lift: the bar's own number, or what stands in when it's taken. */
export interface Alt {
  when: string;
  /** The stand-in and its setting. Blank on the barbell's own line. */
  tool?: string;
  dose: string;
}

export interface Item {
  name: string;
  dose: string;
  /** Warmups print muted and unnumbered. */
  warmup?: boolean;
  /** Printed under the dose. On a bench line, the numbers are for `EXAMPLE_T`. */
  alts?: Alt[];
}

/**
 * The bench stand-ins. The Life Fitness lying chest press, with the handles
 * on the top of their three notches for a flat press, moves in 10s and reads about 90% of the barbell: 150 × 5 on
 * September 17 against a bench near 165, and 150 × 6 to failure on November 12,
 * a week after 175 × 5, which is 0.91 and 0.88 by Epley. It rounds down to the
 * pin, since a pin too low costs a rep or two and one too high misses the set.
 * Dumbbells are 35% a hand, rounded down to 5: nothing is logged behind it, and
 * it sits under the usual 40% because a low first guess is fixed in one set and
 * a high one fails over the face.
 */
export const CHEST_PRESS_RATIO = 0.9;
export const DUMBBELL_RATIO = 0.35;

const down = (x: number, step: number) => Math.floor(x / step + 1e-9) * step;

export function benchBackups(barbell: number): { press: number; dumbbell: number } {
  return {
    press: down(barbell * CHEST_PRESS_RATIO, 10),
    dumbbell: down(barbell * DUMBBELL_RATIO, 5),
  };
}

/**
 * The example top set every bench number on the page is drawn for. December's
 * bench is 155 to max reps, and 155 × 10 works out to 175 for 5, so 175 is the
 * example until a real T exists.
 */
export const EXAMPLE_T = 175;

const PRESS = "Life Fitness press, handles on the top notch";
const T = EXAMPLE_T;

/** The three rows under a bench line: the bar, the machine, the dumbbells. */
function benchAlts(dose: (w: number, unit: string) => string, backupDose = dose): Alt[] {
  return [
    { when: `If T is ${T}`, dose: dose(0, "") },
    { when: "Bench taken", tool: PRESS, dose: backupDose(1, "") },
    { when: "Both taken", tool: "Dumbbells", dose: backupDose(2, " a hand") },
  ];
}

/** A barbell weight on tool 0, 1 or 2: the bar, the press, a dumbbell. */
function on(tool: number, barbell: number): number {
  if (tool === 0) return barbell;
  const b = benchBackups(barbell);
  return tool === 1 ? b.press : b.dumbbell;
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
    when: "Monday, or the first free weekday after it, fed",
    time: "~90 min with warmups",
    items: [
      { name: "Bike or sled, pancakes, shoulder warmup with band pull-aparts", dose: "10 min", warmup: true },
      {
        name: "Bench press",
        dose: "T for 5 to 7, then 2 × 5 at T − 20 with a 1 s stop on the chest",
        alts: benchAlts(
          (t, u) => `${on(t, T)}${u}, then 2 × 5 at ${on(t, T - 20)}`,
          (t, u) => `${on(t, T)}${u} for 5 to 8, then 2 × 5 at ${on(t, T - 20)}`,
        ),
      },
      { name: "Trap bar deadlift, belted, after the ramp below", dose: "300 × 3" },
      { name: "Pullups", dose: "2 × 5" },
      { name: "Bulgarian split squat", dose: "2 × 6 a leg, climbing. About 60 a hand is the Smith's 225 × 5" },
      { name: "Dips", dose: "1 × 10" },
    ],
    note: "Bench goes first because it's the only lift here meant to climb, and this is the one day that is always fed. The top set is as many clean reps as go, up to 7: seven puts T up 5 next week, and two weeks under 5 bring it down 10. The trap bar takes a set of 3 every week, and its set of 5 is tested once, on the last heavy day in June. If 300 × 3 grinds two weeks running, drop to 290 and climb back. The Smith squat is gone, to spare the spine, and the split squat has its slot.",
  },
  {
    id: "B2",
    tile: { big: "Bench", sub: "volume" },
    short: "Bench volume",
    name: "Bench volume",
    kind: "bench",
    when: "Thursday, or any weekday two or more days after the heavy day",
    time: "50 min",
    items: [
      { name: "Shoulder warmup with band pull-aparts", dose: "5 min", warmup: true },
      {
        name: "Bench press",
        dose: "3 × 8 to 10, starting at T − 30",
        alts: benchAlts((t, u) => `3 × 8 to 10 at ${on(t, T - 30)}${u}`),
      },
      { name: "Pullups", dose: "2 × 5" },
      {
        name: "Incline chest press, Life Fitness on its incline setting",
        dose: "2 × 8 to 10, 90 to start",
        alts: [{ when: "Machine taken", tool: "Incline dumbbell press, bench at about 30°", dose: "2 × 8 to 10, 35 a hand to start" }],
      },
      { name: "Cable row", dose: "2 × 5" },
      { name: "Cable triceps pushdown", dose: "2 × 10" },
      { name: "Seated Y raise", dose: "2 × 5 at 20" },
    ],
    note: "The 3 × 8 keeps its own count: when all three sets reach 10, add 5 and go back to 8s, whatever T is doing. The pullups and row keep pulling close to pressing, which keeps a hypermobile shoulder centred while the bench climbs.",
  },
  {
    id: "J",
    tile: { big: "Jumps" },
    short: "Jumps",
    name: "Jumps",
    kind: "jump",
    when: "Saturday",
    time: "30 min",
    items: [
      { name: "Bike or sled", dose: "5–10 min", warmup: true },
      { name: "Pogo hops", dose: "2 × 20" },
      { name: "Depth jumps", dose: "2 × 5" },
      { name: "Approach jumps, one foot and two, at the same high mark each week", dose: "~10 min" },
      { name: "Weighted jumps", dose: "2 × 5 at 20s" },
      { name: "Lying leg curl", dose: "2 × 5" },
    ],
    note: "The gym won't take a taped wall, so reach for the same spot on the wall every week. Stop the approach jumps when two in a row come up short of the day's best, and keep the one-foot jumps about even between the legs. A hoop, when there is one, is the real measure.",
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
    note: "Easy enough to hold a conversation in full sentences. A flat walk rarely gets there. One go a week floats to whichever weekday is free; the rest rides on the weekend. It starts in December in BC at two or three short goes a week, and reaches the full amount by Jan 18. The run-walk counts toward the two hours and goes on Sunday.",
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
  /** A line under the tile, for a session that can move. */
  note?: string;
}

/**
 * Four fixed sessions and one that floats. The heavy day is Monday, when the
 * machines are freest, bench volume follows midweek, and the weekend is jumps
 * and cardio. Asked for on November 28, 2026, in two passes: the first had
 * the bench on Monday, Wednesday and Friday, which made four days running
 * from Friday to Monday, so the bench went to two days and the Friday session
 * came out. No run of days is longer than three.
 */
export const NORMAL_WEEK: WeekDay[] = [
  { day: "Mon", slots: [{ id: "H" }] },
  { day: "Tue", slots: [] },
  { day: "Wed", slots: [{ id: "Z", minutes: 40 }], note: "any free weekday" },
  { day: "Thu", slots: [{ id: "J2" }, { id: "B2" }, { id: "I" }] },
  { day: "Fri", slots: [] },
  { day: "Sat", slots: [{ id: "J" }, { id: "Z", minutes: 30 }, { id: "knees" }] },
  { day: "Sun", slots: [{ id: "Z", minutes: 60 }, { id: "hips" }] },
];

export const RULES: { rule: string; detail: string }[] = [
  {
    rule: "Five sessions a week at most.",
    detail: "Saturday and Sunday are two of them, for the jumps and the cardio. No run of days is longer than three.",
  },
  {
    rule: "The heavy day goes on a weekday, once every 5–9 days.",
    detail: "Monday when it's free, since the machines are. Fed, and never the day after jumps or intervals. A week with no free weekday skips it, which costs nothing once in a while.",
  },
  {
    rule: "The day after the heavy day is Zone 2 or rest.",
    detail: "No jumps and no bench.",
  },
  {
    rule: "Leave a day between bench days.",
    detail: "There are two: the heavy day, and bench volume two or more days after it. In a week the weekdays can't carry it, bench volume goes on Saturday after the jumps, never on Sunday, the day before the heavy day.",
  },
  {
    rule: "Jumps come first and fresh.",
    detail: "First in their session, and never the day after intervals or the heavy day.",
  },
  {
    rule: "Cardio and the joint blocks ride along.",
    detail: "Zone 2 and the two joint blocks attach to any session. One Zone 2 go floats to whichever weekday is free, and goes on the weekend when none is.",
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
    weekdays: [[{ id: "H" }], [{ id: "Z", minutes: 40 }], [{ id: "J2" }, { id: "B2" }, { id: "I" }]],
    saturday: [{ id: "J" }, { id: "Z", minutes: 30 }, { id: "knees" }],
    sunday: [{ id: "Z", minutes: 60 }, { id: "hips" }],
    note: "The normal week.",
  },
  {
    free: "2",
    weekdays: [[{ id: "H" }], [{ id: "J2" }, { id: "B2" }, { id: "I" }]],
    saturday: [{ id: "J" }, { id: "Z", minutes: 45 }, { id: "knees" }],
    sunday: [{ id: "Z", minutes: 75 }, { id: "hips" }],
    note: "If the two days are back to back, the second is Zone 2, and Saturday takes bench volume after the jumps.",
  },
  {
    free: "1",
    weekdays: [[{ id: "H" }, { id: "Z", minutes: 15 }]],
    saturday: [{ id: "J" }, { id: "B2" }, { id: "knees" }],
    sunday: [{ id: "Z", minutes: 75 }, { id: "hips" }],
    note: "If that day is Friday, Saturday is Zone 2 and the knees block, Sunday opens with the jumps and then bench volume, and the next heavy day waits for Tuesday.",
  },
  {
    free: "0",
    weekdays: [],
    saturday: [{ id: "J" }, { id: "B2" }, { id: "knees" }],
    sunday: [{ id: "Z", minutes: 75 }, { id: "hips" }],
    note: "No heavy day. It goes on the first free weekday after.",
  },
];

export type GoalState = "open" | "done" | "climbing" | "new";

export const GOALS: { name: string; target: string; plan: string; state: GoalState }[] = [
  {
    name: "Trap bar deadlift",
    target: "300 × 5",
    plan: "Closes in the last stretch: 290 × 5 on Dec 1, 290 × 6 on Dec 8, since the plates can't make 295, and 300 × 5 on Dec 15, with Dec 22 as the try at home. Then 300 × 3 to hold, and one set of 5 in June.",
    state: "open",
  },
  {
    name: "Smith squat",
    target: "225 × 5",
    plan: "Closes in the last stretch: 220 × 5 on Dec 1, 225 × 5 on Dec 8, with Dec 15 and 22 as tries at home. Then the Smith is done, to spare the spine, and the Bulgarian split squat takes its slot: about 60 a hand for 6 a leg is the same work.",
    state: "open",
  },
  {
    name: "Pullups",
    target: "10 reps",
    plan: "Done Oct 25. Four sets of 5 a week hold it, and a max set at each block's end.",
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
    plan: "175 × 5 on Nov 5. Two bench days a week, since cardio comes first in this block. About 180–185 when the cut ends and 190–200 by the end of June, as estimates. 225 × 5 is more likely 2028, since the half marathon build takes July to October.",
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
    plan: "A cut: 2,400 kcal from Jan 18, protein at 180, about a pound a week, which reaches 175–178 around early April; the end of May is the limit. The scale figure is a guess, so the mirror and the waist tape decide. Then back to 2,800.",
    state: "new",
  },
  {
    name: "Dunk",
    target: "touch 6–8 in over the rim",
    plan: "You're 6 ft 4, could nearly graze one in before August, and just about palm the ball. The approach jumps reach for a spot on the gym wall, and a hoop, when one is near, is the test. The cut and the jumps both move it.",
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
    detail: "Trap bar 290, squat 215 then 220.",
  },
  { when: "Nov 21 – 29", what: "Mexico", detail: "The away routine if you feel like it, and a lot of walking.", travel: true },
  {
    when: "Nov 30 – Dec 15",
    what: "The last stretch, same week",
    detail: "Heavy lower Tuesday, heavy upper Thursday, the light days on the weekend. 290 and 220 for 5 on Dec 1, with back-offs.",
  },
  {
    when: "Tue Dec 8",
    what: "The squat goal",
    detail: "225 × 5, with the trap bar at 290 for 6, then the back-offs. The Smith is done once this goes.",
  },
  {
    when: "Tue Dec 15",
    what: "The trap bar goal",
    detail: "300 × 5, then the back-off. It takes every plate at the bar, the 5s included.",
  },
  {
    when: "Dec 16 – Jan 3",
    what: "Buffer",
    detail: "A try at home on Dec 22 for whichever lift is still open, then Dec 29 in BC. A closed trap bar takes a triple, and a closed squat gives way to split squats. The bench is 155 to max reps on every bench day, and the best set on Dec 23 or 31 sets the top set, T.",
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
    detail: "Two ramp weeks on whatever the gym there has. Bench at T, the trap bar at 300 × 3, split squats where the Smith was. Food as now.",
  },
  {
    when: "Mon Jan 18",
    what: "The full week, and the cut",
    detail: "Home. The four fixed sessions and the floating one, and 2,400 kcal with protein at 180, which works out to about a pound a week.",
  },
  {
    when: "February",
    what: "The first run-walk",
    detail: "One a week on a weekend, 20 minutes to start.",
  },
  {
    when: "After BC – Jun 27",
    what: "Blocks of 4–5 weeks",
    detail: "A deload after each. Each block ends with a max set of pullups. The jump gets tested at a hoop whenever one is near.",
  },
  {
    when: "About early April",
    what: "The cut ends",
    detail: "Back to 2,800 when the scale reaches 175–178 or the abs show. A stalled bench doesn't end it. Jun 1 is the limit.",
  },
  {
    when: "Late June",
    what: "The one test",
    detail: "The trap bar's 300 × 5, on the block's last heavy day. Every other week it takes a set of 3.",
  },
  {
    when: "Jul – Oct",
    what: "Half marathon build",
    detail: "Sixteen weeks to an October race, planned in June. Outside this block.",
  },
];

export const BENCH_LINES: { line: string; offset: number; reps: string }[] = [
  { line: "Heavy top set", offset: 0, reps: "5 to 7" },
  { line: "Heavy back-offs, paused", offset: -20, reps: "2 × 5" },
  { line: "Bench volume, to start", offset: -30, reps: "3 × 8 to 10" },
];

export const STARTING_WEIGHTS: { group: string; rows: { name: string; start: string; then: string }[] }[] = [
  {
    group: "Heavy full body",
    rows: [
      { name: "Bench top set, T", start: "From the best 155 set on Dec 23 or Dec 31: the weight Epley gives for 5 at that many reps, rounded down to 5 (155 × 10 makes 175)", then: "+5 when the top set reaches 7 clean reps; −10 after two heavy days under 5" },
      { name: "Bench back-offs", start: "T − 20, with a 1 s stop on the chest", then: "Follows T" },
      { name: "Trap bar", start: "300 × 3, closed or not: 290 × 5 on Nov 17 already covers it by Epley. 290 × 4 on a day the 5s are gone", then: "Hold. One set of 5 on the last heavy day in June, which is the next try if the goal is still open" },
      { name: "Bulgarian split squat", start: "Where December leaves it: 45 a hand on Dec 5, up 5 each clean light lower. About 60 a hand for 6 a leg matches the Smith's 225 × 5, give or take 10: 40 × 6 on Nov 7 felt like that day's 175", then: "+5 a hand when both sets of 6 are clean on both legs" },
      { name: "Pullups, dips", start: "2 × 5 and 1 × 10, bodyweight", then: "Hold" },
    ],
  },
  {
    group: "Bench volume",
    rows: [
      { name: "Bench 3 × 8 to 10", start: "T − 30, where 145 × 8 × 3 was hard on the third set with the bench at 175", then: "Its own count: +5 when all three sets reach 10, then back to 8s" },
      { name: "Incline chest press, Life Fitness", start: "90, a first guess at two-thirds of the 3 × 8 weight; settle where 8 leaves 2 reps. The dumbbell stand-in starts at 35 a hand, also a guess", then: "The next pin, or 5 a hand, when both sets reach 10" },
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
  { what: "The Smith squat", why: "Out once 225 × 5 closes, by choice on Nov 28: too much load on the spine. The split squat takes its slot on the heavy day, and came off Saturday to make room." },
  { what: "The light paused bench day", why: "Cardio comes first in this block, so the bench gets two days. The pause moved to the heavy day's back-offs." },
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
  "The approach jumps reach for a spot on the gym wall. Measure its height once, so a touch there reads against a 10 ft rim.",
  "Resting heart rate on waking, a full 60-second count at the wrist, when you can. None has been logged since Sep 5.",
  "Zone 2 starts in BC in December: two or three easy goes of 20–30 minutes a week.",
  "Weigh in on at least four mornings a week, and tape the waist at the navel once a week.",
  "The Dec 23 and Dec 31 heavy uppers set T, so there's no separate bench test.",
  "The flat press is the top of the Life Fitness machine's three handle notches. Note which notch the incline press uses.",
];

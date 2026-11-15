import type { SetupCue } from "@/lib/lastStretch";

/**
 * The trap bar's setup checklist, shown under the ramp on a heavy lower's
 * card. Asked for on November 14, 2026, after film of Nov 3's 290 × 3 showed
 * the bar set about 4 in behind mid-foot and rolling forward as the first rep
 * started.
 *
 * The owner's edits, which bind: no step about the arms, no roll check,
 * Breath and Push the floor away are the two loud ones, and the last is never
 * called a pull.
 *
 * It is built to be remembered and to wind the lifter up, by request:
 *  - six cues in two groups of three, because three is easy to hold and six
 *    is not. The first group climbs the body, feet then hands then head; the
 *    second is the sequence that fires the rep.
 *  - each cue is the words said in the head, so reading the titles top to
 *    bottom is the whole routine.
 *  - the type gets heavier toward the last cue, which is the only one on
 *    chalk. It is worded as a push at the floor, an outside target, which is
 *    the kind of cue that produces force.
 *  - the line above it is a set already in the log, as proof.
 *
 * Nothing here is clickable or saves anything: this page's ticks are derived
 * from the log, and a checklist that kept its own ticks would be a second
 * writer. The colours are the nav's iron and chalk, so no macro or status
 * colour is borrowed.
 */

const SET: { cue: string; detail: string }[] = [
  {
    cue: "Laces on the line",
    detail:
      "Feet hip width, the same gap to each handle. The middle of your laces level with the middle of the handles. Not your ankles: that is too far forward.",
  },
  { cue: "Squeeze", detail: "The middle of each handle, both hands the same. Crush them." },
  { cue: "Chin tucked", detail: "Eyes on the floor, two metres ahead." },
];

const iron = "var(--nav-bg)";
const chalk = "var(--nav-on-bg)";
const dust = "var(--nav-ink)";

/** Looking down at the bar: hands and laces on one line. */
function Stance() {
  return (
    <svg
      viewBox="0 0 300 200"
      role="img"
      aria-label="The hex bar from above. Both feet inside it, hip width, toes forward, with the middle of each foot on the line that runs through the middle of both handles and both sleeves."
      className="mx-auto block w-full max-w-[340px]"
    >
      {/* plates and sleeves */}
      {[0, 1].map((side) => (
        <g key={side} transform={side ? "translate(300 0) scale(-1 1)" : undefined}>
          <rect x="5" y="58" width="11" height="84" rx="2" fill={dust} opacity="0.55" />
          <rect x="18" y="66" width="8" height="68" rx="2" fill={dust} opacity="0.4" />
          <line x1="26" y1="100" x2="62" y2="100" stroke={dust} strokeWidth="7" />
          {/* handle, with the part to hold */}
          <line x1="92" y1="62" x2="92" y2="138" stroke={dust} strokeWidth="4" strokeLinecap="round" />
          <line x1="92" y1="84" x2="92" y2="116" stroke={chalk} strokeWidth="9" strokeLinecap="round" />
        </g>
      ))}
      {/* the frame */}
      <polygon
        points="62,100 104,46 196,46 238,100 196,154 104,154"
        fill="none"
        stroke={dust}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* feet, toes up the page */}
      {[125, 175].map((x) => (
        <g key={x}>
          <path
            d={`M ${x - 8} 125 Q ${x - 8} 132 ${x} 132 Q ${x + 8} 132 ${x + 8} 125 L ${x + 11} 86 Q ${x + 12} 68 ${x} 68 Q ${x - 12} 68 ${x - 11} 86 Z`}
            fill={chalk}
            fillOpacity="0.16"
            stroke={chalk}
            strokeWidth="2"
          />
          {[90, 100, 110].map((y) => (
            <line
              key={y}
              x1={x - 5}
              y1={y}
              x2={x + 5}
              y2={y}
              stroke={chalk}
              strokeWidth={y === 100 ? 2.5 : 1.25}
              opacity={y === 100 ? 1 : 0.6}
            />
          ))}
        </g>
      ))}
      {/* the line, and the four points that sit on it */}
      <line x1="28" y1="100" x2="272" y2="100" stroke={chalk} strokeWidth="1.5" strokeDasharray="5 4" />
      {[92, 125, 175, 208].map((x) => (
        <circle key={x} cx={x} cy="100" r="4.5" fill={chalk} stroke={iron} strokeWidth="1.5" />
      ))}
      <g fill={dust} fontSize="10" fontWeight="600" letterSpacing="1.5" textAnchor="middle">
        <text x="150" y="30">FRONT</text>
        <path d="M 150 6 l 6 9 h -12 z" />
        <text x="84" y="176">HAND</text>
        <text x="150" y="176">LACES</text>
        <text x="216" y="176">HAND</text>
      </g>
      <text
        x="150"
        y="194"
        fill={chalk}
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        FOUR IN A ROW
      </text>
    </svg>
  );
}

function Group({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1" aria-hidden>
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: dust }}>
        {label}
      </span>
      <span className="h-px flex-1" style={{ background: dust, opacity: 0.35 }} />
    </div>
  );
}

function Num({ n, colour = dust }: { n: number; colour?: string }) {
  return (
    <span className="tnum w-5 shrink-0 font-display text-lg font-bold leading-none" style={{ color: colour }}>
      {n}
    </span>
  );
}

export function TrapBarSetup({ setup }: { setup: SetupCue }) {
  const { top, best } = setup;
  const proof = !best
    ? undefined
    : best.weight < top
      ? `${best.weight} × ${best.reps} is done.`
      : `You have done ${best.weight} × ${best.reps}.`;

  return (
    <div className="mt-2 overflow-hidden rounded-md" style={{ background: iron, color: chalk }}>
      <div className="px-3 pb-3 pt-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: dust }}>
          Before every set
        </p>
        <p className="mt-1 font-display text-[1.6rem] font-bold uppercase leading-[1.02] tracking-wide">
          {proof && <span className="block">{proof}</span>}
          <span className="block">
            On the bar: <span className="tnum">{top}</span>.
          </span>
        </p>

        <div className="mt-3">
          <Stance />
        </div>

        <ol className="mt-2 space-y-2.5">
          <li>
            <Group label="Set" />
          </li>
          {SET.map((s, i) => (
            <li key={s.cue} className="flex items-baseline gap-2">
              <Num n={i + 1} />
              <div>
                <p className="font-display text-xl font-medium uppercase leading-none tracking-wide">{s.cue}</p>
                <p className="mt-1 text-xs leading-snug" style={{ color: dust }}>
                  {s.detail}
                </p>
              </div>
            </li>
          ))}
          <li>
            <Group label="Go" />
          </li>
          <li className="flex items-baseline gap-2">
            <Num n={4} colour={chalk} />
            <div>
              <p className="font-display text-[2.1rem] font-bold uppercase leading-[0.9] tracking-wide">
                <strong>Breath</strong>
              </p>
              <p className="mt-1 text-xs leading-snug" style={{ color: dust }}>
                A big one, into the belt. Brace for a punch.
              </p>
            </div>
          </li>
          <li className="flex items-baseline gap-2">
            <Num n={5} />
            <div>
              <p className="font-display text-xl font-medium uppercase leading-none tracking-wide">Click. Click.</p>
              <p className="mt-1 text-xs leading-snug" style={{ color: dust }}>
                Take the slack out: lift gently through both clicks, chest up. Tight and quiet. Hold
                one second.
              </p>
            </div>
          </li>
        </ol>
      </div>

      <div className="flex items-baseline gap-2 px-3 py-3" style={{ background: chalk, color: "var(--nav-on-ink)" }}>
        <Num n={6} colour="var(--nav-on-ink)" />
        <div>
          <p className="font-display text-[2.35rem] font-bold uppercase leading-[0.88] tracking-wide">
            <strong>Push the floor away</strong>
          </p>
          <p className="mt-1.5 text-xs font-medium leading-snug">
            Everything you have, straight down. Hips and shoulders rise together. Stand tall, no lean
            back.
          </p>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <p className="font-display text-base font-bold uppercase leading-tight tracking-wide">
          <span style={{ color: dust }}>Every rep: </span>
          Breath <span style={{ color: dust }}>›</span> Click. Click. <span style={{ color: dust }}>›</span> Push
        </p>
        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: dust }}>
          Set it down on the same spot and let it settle first.
        </p>
      </div>
    </div>
  );
}

import { round, type MicroTotal } from "@/lib/nutrition";

/**
 * A single ratio against a limit is a meter, not a chart. Two of them lead the
 * dashboard: calories against a target, protein against a band.
 */

interface RingProps {
  /** 0–1+. Values over 1 keep filling a second, darker lap. */
  value: number;
  size?: number;
  stroke?: number;
  color: string;
  /**
   * Colour of the second lap once value passes 1. Defaults to critical, which
   * is right for a budget — but protein over its band is success, not a fault,
   * so that ring passes something benign instead.
   */
  overflowColor?: string;
  /**
   * Where a target *band* stops, as a fraction of the second lap. Only means
   * anything on a ring whose circumference is the band's floor: the first lap
   * is the target, and this tick marks how far past it the band runs, so the
   * overflow arc reads as "still inside the band" or "past the top of it".
   */
  overflowBandEnd?: number;
  children?: React.ReactNode;
  label: string;
}

function Ring({
  value,
  size = 148,
  stroke = 12,
  color,
  overflowColor = "var(--status-critical)",
  overflowBandEnd,
  children,
  label,
}: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(value, 1));
  const overflow = Math.max(0, Math.min(value - 1, 1));

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * clamped} ${c}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />

        {/* A second lap makes going over the target visible rather than capped. */}
        {overflow > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={overflowColor}
            strokeWidth={stroke / 2}
            strokeLinecap="round"
            strokeDasharray={`${c * overflow} ${c}`}
          />
        )}

        {/* The top of the band, ticked across the second lap. Green stopping
            short of it is "in the band"; green past it is "over", which is
            still success — hence the neutral tick rather than a warning. */}
        {overflowBandEnd !== undefined && overflow > 0 && (
          <Tick
            fraction={Math.min(overflowBandEnd, 1)}
            size={size}
            r={r}
            stroke={stroke}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** A radial mark on the ring at `fraction` of one lap. Drawn inside the parent
 *  svg, which is already rotated so that fraction 0 sits at twelve o'clock. */
function Tick({
  fraction,
  size,
  r,
  stroke,
}: {
  fraction: number;
  size: number;
  r: number;
  stroke: number;
}) {
  const a = 2 * Math.PI * fraction;
  const inner = r - stroke / 2;
  const outer = r + stroke / 2;
  return (
    <line
      x1={size / 2 + inner * Math.cos(a)}
      y1={size / 2 + inner * Math.sin(a)}
      x2={size / 2 + outer * Math.cos(a)}
      y2={size / 2 + outer * Math.sin(a)}
      stroke="var(--baseline)"
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}

export function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const remaining = goal - consumed;
  const pct = goal > 0 ? consumed / goal : 0;
  const over = remaining < 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <Ring
        value={pct}
        color="var(--series-carbs)"
        label={`Calories: ${round(consumed)} of ${goal} kcal`}
      >
        <div>
          <div className="text-[32px] font-semibold leading-none tracking-tight">
            {round(consumed).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted">
            of {goal.toLocaleString()} kcal
          </div>
        </div>
      </Ring>
      <p className="text-sm text-ink-2">
        {over ? (
          <>
            <span className="font-semibold text-critical">
              {round(Math.abs(remaining))} over
            </span>{" "}
            budget
          </>
        ) : (
          <>
            <span className="font-semibold text-ink">{round(remaining)}</span> kcal
            left
          </>
        )}
      </p>
    </div>
  );
}

export function ProteinRing({
  consumed,
  min,
  max,
}: {
  consumed: number;
  min: number;
  max: number;
}) {
  // The ring closes when the target is *met*, so its circumference is the
  // band's floor and everything above runs as a second lap. Scaling it to the
  // top of the band plus headroom — which it did until August 5, 2026 — meant
  // 182 g against a 160–180 g band drew an 88% arc: a cleared goal rendering
  // as a near miss, and near-identical to a calorie ring that really was
  // short. The band survives as a tick on the second lap rather than an arc
  // on the first.
  const pct = min > 0 ? consumed / min : 0;
  const status = consumed < min ? "under" : consumed > max ? "over" : "in";

  return (
    <div className="flex flex-col items-center gap-2">
      <Ring
        value={pct}
        color="var(--series-protein)"
        overflowColor="var(--status-good)"
        overflowBandEnd={min > 0 ? (max - min) / min : undefined}
        label={`Protein: ${round(consumed, 1)} g, target ${min} to ${max} g`}
      >
        <div>
          <div className="text-[32px] font-semibold leading-none tracking-tight">
            {round(consumed)}
            <span className="text-lg font-medium text-muted">g</span>
          </div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted">
            of {min}–{max} g
          </div>
        </div>
      </Ring>
      <p className="flex items-center gap-1.5 text-sm text-ink-2">
        {status === "under" ? (
          <>
            <span aria-hidden>↑</span>
            <span>
              <span className="font-semibold text-ink">{round(min - consumed)}g</span>{" "}
              to target
            </span>
          </>
        ) : status === "in" ? (
          <>
            <span aria-hidden className="text-good">
              ✓
            </span>
            <span className="font-semibold" style={{ color: "var(--success-text)" }}>
              In target band
            </span>
          </>
        ) : (
          <>
            <span aria-hidden className="text-good">
              ✓
            </span>
            <span>
              <span className="font-semibold" style={{ color: "var(--success-text)" }}>
                Target cleared
              </span>{" "}
              (+{round(consumed - max)}g)
            </span>
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Macro split as a stacked bar — part-to-whole, three categorical series.
 * Every segment carries a visible label, which is also what discharges the
 * relief rule for light-mode aqua (2.74:1 on the light surface).
 */
export function MacroSplit({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  const pKcal = protein * 4;
  const cKcal = carbs * 4;
  const fKcal = fat * 9;
  const total = pKcal + cKcal + fKcal;

  const rows = [
    { key: "Protein", grams: protein, kcal: pKcal, color: "var(--series-protein)" },
    { key: "Carbs", grams: carbs, kcal: cKcal, color: "var(--series-carbs)" },
    { key: "Fat", grams: fat, kcal: fKcal, color: "var(--series-fat)" },
  ];

  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-track">
        {total > 0 ? (
          rows.map((r) => (
            <div
              key={r.key}
              style={{
                width: `${(r.kcal / total) * 100}%`,
                background: r.color,
              }}
              className="first:rounded-l-full last:rounded-r-full"
            />
          ))
        ) : (
          <div className="w-full" />
        )}
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        {rows.map((r) => (
          <div key={r.key} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: r.color }}
              />
              <span className="truncate">{r.key}</span>
            </dt>
            <dd className="tnum mt-0.5 text-[15px] font-semibold">
              {round(r.grams)}
              <span className="text-xs font-normal text-muted">g</span>
              <span className="ml-1.5 text-xs font-normal text-muted">
                {total > 0 ? Math.round((r.kcal / total) * 100) : 0}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Fiber against its target, with sugar and sodium alongside. Quiet by design:
 * these are logged less reliably than the macros, so a total over partial data
 * is shown as a floor ("≥") and a day where nothing recorded a value shows a
 * dash — a blank is *not recorded*, which is not the same as zero.
 */
export function Micros({
  fiber,
  sugar,
  sodium,
  fiberGoal,
}: {
  fiber: MicroTotal;
  sugar: MicroTotal;
  sodium: MicroTotal;
  /** Undefined means the goals file sets no fiber target — shown unscored. */
  fiberGoal?: number;
}) {
  const cell = (m: MicroTotal, unit: string, places = 0) => {
    if (m.recordedRows === 0) return <span className="text-muted">—</span>;
    const partial = m.recordedRows < m.totalRows;
    return (
      <>
        {partial && <span className="text-muted">≥</span>}
        {round(m.total, places).toLocaleString()}
        <span className="text-xs font-normal text-muted">{unit}</span>
      </>
    );
  };

  const fiberMet =
    fiberGoal !== undefined && fiber.recordedRows > 0 && fiber.total >= fiberGoal;

  return (
    <dl className="grid grid-cols-3 gap-2">
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Fiber
        </dt>
        <dd
          className="tnum mt-0.5 text-[15px] font-semibold"
          style={fiberMet ? { color: "var(--success-text)" } : undefined}
        >
          {cell(fiber, "g")}
          {fiberGoal !== undefined && (
            <span className="ml-1.5 text-xs font-normal text-muted">
              of {fiberGoal}g
            </span>
          )}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Sugar
        </dt>
        <dd className="tnum mt-0.5 text-[15px] font-semibold">{cell(sugar, "g")}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Sodium
        </dt>
        <dd className="tnum mt-0.5 text-[15px] font-semibold">
          {cell(sodium, "mg")}
        </dd>
      </div>
    </dl>
  );
}

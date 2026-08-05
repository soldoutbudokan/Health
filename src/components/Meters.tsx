import { round } from "@/lib/nutrition";

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
  /** Second arc drawn as a band on the same track, e.g. the protein max. */
  bandStart?: number;
  bandEnd?: number;
  children?: React.ReactNode;
  label: string;
}

function Ring({
  value,
  size = 148,
  stroke = 12,
  color,
  bandStart,
  bandEnd,
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

        {/* Target band (protein min→max), drawn on the track itself. */}
        {bandStart !== undefined && bandEnd !== undefined && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--baseline)"
            strokeWidth={stroke}
            strokeDasharray={`${c * (bandEnd - bandStart)} ${c}`}
            strokeDashoffset={-c * bandStart}
            opacity={0.55}
          />
        )}

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
            stroke="var(--status-critical)"
            strokeWidth={stroke / 2}
            strokeLinecap="round"
            strokeDasharray={`${c * overflow} ${c}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
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
  // Scale the ring to the top of the band so the band is visible as an arc,
  // rather than to the minimum where it would sit off the end.
  const scale = max * 1.15;
  const pct = consumed / scale;
  const status = consumed < min ? "under" : consumed > max ? "over" : "in";

  return (
    <div className="flex flex-col items-center gap-2">
      <Ring
        value={pct}
        color="var(--series-protein)"
        bandStart={min / scale}
        bandEnd={max / scale}
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

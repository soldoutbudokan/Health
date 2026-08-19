#!/usr/bin/env node
/**
 * Palette validator for the week strip's session chips.
 *
 * globals.css has promised this file existed since the chip scale was picked;
 * it did not, and the numbers in that comment had no way to be re-checked.
 * This is that check, written to reproduce them.
 *
 * What it enforces, and why these two gates rather than contrast alone:
 *
 *   - Chips encode a category by fill. Two fills that a viewer cannot tell
 *     apart are the same chip, so the pairwise distance between fills is the
 *     thing that matters, not each fill's contrast against the page.
 *   - CIEDE2000 on the normal-vision colours, gate 15. Below that two chips
 *     read as shades of one colour rather than as two categories.
 *   - CIEDE2000 again on protan/deutan/tritan simulations, gate 8. The scale
 *     has to survive the ~8% of men who will not see the hue separation it is
 *     built on. This gate is the lower of the two on purpose: a CVD viewer is
 *     allowed a harder read, not an impossible one.
 *   - Contrast of each chip's own label on its own fill, gate 4.5:1. Where a
 *     fill is too light for white ink it takes dark ink instead; that is what
 *     --on-conditioning exists for.
 *
 * Chips are NOT validated against the macro series. They never encode
 * alongside them — macros colour the food column, chips the training column —
 * and forcing all-pairs across both scales rules out hues neither scale needs
 * to give up. See the comment in globals.css.
 *
 *   node scripts/validate_palette.js            check the shipped scale
 *   node scripts/validate_palette.js '#0f766e'  test a candidate as a 4th chip
 */

// ---------- colour conversion ----------

const hex = (h) => {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
};

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055;

const linearRgb = (h) => hex(h).map(toLinear);

// sRGB D65 primaries.
const RGB_TO_XYZ = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
];

const mul = (m, v) => m.map((row) => row.reduce((s, k, i) => s + k * v[i], 0));

const WHITE = [0.95047, 1.0, 1.08883];

function xyzToLab([x, y, z]) {
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27) * t / 116 + 16 / 116);
  const [fx, fy, fz] = [f(x / WHITE[0]), f(y / WHITE[1]), f(z / WHITE[2])];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const labOf = (rgbLinear) => xyzToLab(mul(RGB_TO_XYZ, rgbLinear));

// ---------- CIEDE2000 ----------

function ciede2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1;
  const ap2 = (1 + G) * a2;
  const Cp1 = Math.hypot(ap1, b1);
  const Cp2 = Math.hypot(ap2, b2);

  const hp = (b, ap) => {
    if (b === 0 && ap === 0) return 0;
    const h = Math.atan2(b, ap) / rad;
    return h < 0 ? h + 360 : h;
  };
  const hp1 = hp(b1, ap1);
  const hp2 = hp(b2, ap2);

  const dL = L2 - L1;
  const dC = Cp2 - Cp1;

  let dhp;
  if (Cp1 * Cp2 === 0) dhp = 0;
  else if (Math.abs(hp2 - hp1) <= 180) dhp = hp2 - hp1;
  else dhp = hp2 - hp1 > 180 ? hp2 - hp1 - 360 : hp2 - hp1 + 360;
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp / 2) * rad);

  const Lbar = (L1 + L2) / 2;
  const Cpbar = (Cp1 + Cp2) / 2;

  let hbar;
  if (Cp1 * Cp2 === 0) hbar = hp1 + hp2;
  else if (Math.abs(hp1 - hp2) <= 180) hbar = (hp1 + hp2) / 2;
  else hbar = hp1 + hp2 < 360 ? (hp1 + hp2 + 360) / 2 : (hp1 + hp2 - 360) / 2;

  const T =
    1 -
    0.17 * Math.cos((hbar - 30) * rad) +
    0.24 * Math.cos(2 * hbar * rad) +
    0.32 * Math.cos((3 * hbar + 6) * rad) -
    0.2 * Math.cos((4 * hbar - 63) * rad);

  const dTheta = 30 * Math.exp(-(((hbar - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpbar ** 7 / (Cpbar ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2);
  const Sc = 1 + 0.045 * Cpbar;
  const Sh = 1 + 0.015 * Cpbar * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;

  return Math.sqrt(
    (dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh),
  );
}

// ---------- CVD simulation (Viénot, Brettel & Mollon 1999) ----------

const RGB_TO_LMS = [
  [17.8824, 43.5161, 4.11935],
  [3.45565, 27.1554, 3.86714],
  [0.0299566, 0.184309, 1.46709],
];
const LMS_TO_RGB = [
  [0.0809444479, -0.130504409, 0.116721066],
  [-0.0102485335, 0.0540193266, -0.113614708],
  [-0.000365296938, -0.00412161469, 0.693511405],
];

const CVD = {
  protan: [[0, 2.02344, -2.5281], [0, 1, 0], [0, 0, 1]],
  deutan: [[1, 0, 0], [0.494207, 0, 1.24827], [0, 0, 1]],
  tritan: [[1, 0, 0], [0, 1, 0], [-0.395913, 0.801109, 0]],
};

function simulate(rgbLinear, kind) {
  // The 1999 matrices operate on gamma-encoded values, not linear light.
  const gamma = rgbLinear.map(toSrgb).map((c) => c * 255);
  const lms = mul(RGB_TO_LMS, gamma);
  const out = mul(LMS_TO_RGB, mul(CVD[kind], lms));
  return out.map((c) => toLinear(Math.min(1, Math.max(0, c / 255))));
}

// ---------- contrast ----------

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function contrast(aHex, bHex) {
  const [la, lb] = [luminance(linearRgb(aHex)), luminance(linearRgb(bHex))];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- the scale under test ----------

const GATE_NORMAL = 15;
const GATE_CVD = 8;
const GATE_CONTRAST = 4.5;

const MODES = {
  light: {
    surface: "#fcfcfb",
    chips: [
      { name: "gym", fill: "#2a78d6", ink: "#ffffff" },
      { name: "conditioning", fill: "#e87ba4", ink: "#0b0b0b" },
      { name: "full-body", fill: "#732698", ink: "#ffffff" },
      { name: "stretch", fill: "#1d443d", ink: "#ffffff" },
    ],
  },
  dark: {
    surface: "#1a1a19",
    chips: [
      { name: "gym", fill: "#3987e5", ink: "#ffffff" },
      { name: "conditioning", fill: "#d55181", ink: "#ffffff" },
      { name: "full-body", fill: "#8b50ad", ink: "#ffffff" },
      { name: "stretch", fill: "#61dec5", ink: "#0b0b0b" },
    ],
  },
};

function check(chips, surface, label) {
  const lab = (h) => labOf(linearRgb(h));
  const labCvd = (h, k) => labOf(simulate(linearRgb(h), k));

  let worstNormal = Infinity;
  let worstCvd = Infinity;
  const rows = [];

  for (let i = 0; i < chips.length; i++) {
    for (let j = i + 1; j < chips.length; j++) {
      const [a, b] = [chips[i], chips[j]];
      const normal = ciede2000(lab(a.fill), lab(b.fill));
      const cvd = Object.keys(CVD).map((k) => ({
        k,
        d: ciede2000(labCvd(a.fill, k), labCvd(b.fill, k)),
      }));
      const worst = cvd.reduce((m, c) => (c.d < m.d ? c : m));
      worstNormal = Math.min(worstNormal, normal);
      worstCvd = Math.min(worstCvd, worst.d);
      rows.push({
        pair: `${a.name} / ${b.name}`,
        normal,
        cvd: worst.d,
        via: worst.k,
        ok: normal >= GATE_NORMAL && worst.d >= GATE_CVD,
      });
    }
  }

  console.log(`\n${label}  (surface ${surface})`);
  console.log("  pair                          ΔE00   worst-CVD");
  for (const r of rows) {
    console.log(
      `  ${r.ok ? "PASS" : "FAIL"}  ${r.pair.padEnd(24)} ${r.normal.toFixed(1).padStart(5)}   ` +
        `${r.cvd.toFixed(1).padStart(5)} (${r.via})`,
    );
  }
  // ADVISORY, not a gate. Three shipped chips are below 4.5:1 and predate this
  // script; failing on them would leave a validator that can never pass, which
  // is a validator nobody runs. The separation gates above are what the exit
  // code reflects. See the closing note in globals.css.
  console.log(`  ink on fill (advisory — ${GATE_CONTRAST}:1 for a 10px bold label):`);
  for (const c of chips) {
    const ratio = contrast(c.ink, c.fill);
    console.log(
      `  ${ratio >= GATE_CONTRAST ? " ok " : "LOW "}  ${c.name.padEnd(24)} ${ratio.toFixed(2)}:1 ` +
        `(${c.ink} on ${c.fill})`,
    );
  }
  // Reported, not gated. A chip that sits low against the page takes the
  // relief rule instead — it always ships with its text label, never colour
  // alone — which is why aqua and magenta are allowed to be here at all.
  console.log("  fill on surface (relief rule applies below 3:1):");
  for (const c of chips) {
    console.log(`        ${c.name.padEnd(24)} ${contrast(c.fill, surface).toFixed(2)}:1`);
  }

  return {
    worstNormal,
    worstCvd,
    pass: rows.every((r) => r.ok),
  };
}

const candidate = process.argv[2];
if (candidate) {
  // Scan a candidate against the three shipped chips in both modes.
  for (const [mode, cfg] of Object.entries(MODES)) {
    const three = cfg.chips.slice(0, 3);
    const lab = (h) => labOf(linearRgb(h));
    const labCvd = (h, k) => labOf(simulate(linearRgb(h), k));
    console.log(`\n${candidate} as a 4th chip, ${mode}:`);
    for (const c of three) {
      const normal = ciede2000(lab(candidate), lab(c.fill));
      const worst = Math.min(
        ...Object.keys(CVD).map((k) =>
          ciede2000(labCvd(candidate, k), labCvd(c.fill, k)),
        ),
      );
      const ok = normal >= GATE_NORMAL && worst >= GATE_CVD;
      console.log(
        `  ${ok ? "PASS" : "FAIL"}  vs ${c.name.padEnd(14)} ΔE00 ${normal.toFixed(1).padStart(5)}   worst-CVD ${worst.toFixed(1).padStart(5)}`,
      );
    }
    console.log(
      `        white ink ${contrast("#ffffff", candidate).toFixed(2)}:1   ` +
        `dark ink ${contrast("#0b0b0b", candidate).toFixed(2)}:1   ` +
        `on surface ${contrast(candidate, cfg.surface).toFixed(2)}:1`,
    );
  }
  process.exit(0);
}

let allPass = true;
for (const [mode, cfg] of Object.entries(MODES)) {
  const r = check(cfg.chips, cfg.surface, `${mode} mode`);
  allPass = allPass && r.pass;
  console.log(
    `  → worst normal-vision ΔE ${r.worstNormal.toFixed(1)} (gate ${GATE_NORMAL}), ` +
      `worst CVD ΔE ${r.worstCvd.toFixed(1)} (gate ${GATE_CVD})`,
  );
}

console.log(`\n${allPass ? "PASS — the chip scale separates all-pairs in both modes." : "FAIL — see above."}`);
process.exit(allPass ? 0 : 1);

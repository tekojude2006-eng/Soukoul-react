"use client";

import { useState } from "react";
import type { Bootstrap, Grade } from "@/lib/types";
import { average } from "@/lib/utils";

export const PIGMENTS: Record<string, { main: string; soft: string; ink: string; label: string }> = {
  Mathématiques: { main: "#284b7a", soft: "#dde6f2", ink: "#183052", label: "Outremer" },
  Physique: { main: "#5e3c78", soft: "#eadff2", ink: "#3c2350", label: "Prune" },
  Littérature: { main: "#b54d32", soft: "#f5e1da", ink: "#752c19", label: "Terre de Sienne" },
  Économie: { main: "#26684e", soft: "#daece4", ink: "#154230", label: "Malachite" },
  Droit: { main: "#8f2436", soft: "#f2dce0", ink: "#59121e", label: "Carmin" },
  Anglais: { main: "#c87d20", soft: "#f7ead4", ink: "#7c4b0b", label: "Ocre" },
  Histoire: { main: "#6d523b", soft: "#ece3da", ink: "#433122", label: "Sépia" },
};

const FALLBACK_PIGMENTS = [
  PIGMENTS.Mathématiques,
  PIGMENTS.Littérature,
  PIGMENTS.Économie,
  PIGMENTS.Physique,
  PIGMENTS.Droit,
  PIGMENTS.Anglais,
];

export function pigmentFor(subject?: string | null, idx = 0) {
  if (subject && PIGMENTS[subject]) return PIGMENTS[subject];
  return FALLBACK_PIGMENTS[idx % FALLBACK_PIGMENTS.length];
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function sectorPath(cx: number, cy: number, rInner: number, rOuter: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    startOuter.x.toFixed(2),
    startOuter.y.toFixed(2),
    "A",
    rOuter,
    rOuter,
    0,
    largeArc,
    0,
    endOuter.x.toFixed(2),
    endOuter.y.toFixed(2),
    "L",
    endInner.x.toFixed(2),
    endInner.y.toFixed(2),
    "A",
    rInner,
    rInner,
    0,
    largeArc,
    1,
    startInner.x.toFixed(2),
    startInner.y.toFixed(2),
    "Z",
  ].join(" ");
}

/**
 * 1. ROSE DES VENTS ACADÉMIQUE (Nightingale Polar Rose + Orbital Evaluations)
 * Inspired by W.E.B. Du Bois & Florence Nightingale's polar area diagrams.
 */
export function PolarAcademicRose({ grades }: { grades: Grade[] }) {
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  const grouped = new Map<string, Grade[]>();
  for (const g of grades) {
    const list = grouped.get(g.subject) ?? [];
    list.push(g);
    grouped.set(g.subject, list);
  }

  const entries = [...grouped.entries()].map(([subject, list], i) => {
    const avg = average(list) ?? 0;
    const min = Math.min(...list.map((x) => x.score ?? avg));
    const max = Math.max(...list.map((x) => x.score ?? avg));
    return {
      subject,
      list,
      avg,
      min,
      max,
      pigment: pigmentFor(subject, i),
    };
  });

  if (entries.length === 0) return null;

  const cx = 165;
  const cy = 165;
  const rInner = 26;
  const rMax = 122;
  const count = entries.length;
  const step = 360 / count;
  const overall = average(grades) ?? 0;
  const active = entries.find((e) => e.subject === hoveredSubject) ?? entries[0];

  // Polygon connecting averages
  const polyPoints = entries
    .map((e, i) => {
      const midAngle = i * step + step / 2;
      const r = rInner + (Math.max(2, e.avg) / 20) * (rMax - rInner);
      const pt = polarToCartesian(cx, cy, r, midAngle);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="editorial-card relative overflow-hidden p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div>
          <span className="eyebrow-tag">Fig. 01 · Géométrie des acquis</span>
          <h3 className="serif m-0 mt-0.5 text-xl">Rose polaire &amp; orbites d&apos;évaluation</h3>
        </div>
        <span className="mono-badge">Échelle 0—20</span>
      </div>

      <div className="grid items-center gap-5 md:grid-cols-[310px_1fr]">
        <div className="relative mx-auto w-full max-w-[310px]">
          <svg viewBox="0 0 330 330" className="w-full overflow-visible select-none">
            <defs>
              <pattern id="hatch-ink" width="6" height="6" patternTransform="rotate(35 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#1c1915" strokeWidth="1" strokeOpacity="0.16" />
              </pattern>
            </defs>

            {/* Reference concentric rings: 5, 10 (validation), 15 (mention), 20 */}
            {[5, 10, 15, 20].map((val) => {
              const r = rInner + (val / 20) * (rMax - rInner);
              return (
                <g key={val}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={val === 10 ? "#8f2436" : "#c9bead"}
                    strokeWidth={val === 10 ? 1.1 : 0.8}
                    strokeDasharray={val === 10 ? "3 3" : val === 15 ? "1.5 3" : undefined}
                    opacity={val === 10 ? 0.65 : 0.7}
                  />
                  <text
                    x={cx + 4}
                    y={cy - r + 9}
                    fontSize="8.5"
                    fill={val === 10 ? "#8f2436" : "#6a6358"}
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Axis spokes */}
            {entries.map((e, i) => {
              const angle = i * step;
              const edge = polarToCartesian(cx, cy, rMax + 8, angle);
              return (
                <line
                  key={e.subject}
                  x1={cx}
                  y1={cy}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="#d9d0c2"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Rose petals (weighted by average score) */}
            {entries.map((e, i) => {
              const startA = i * step + 4;
              const endA = (i + 1) * step - 4;
              const rOuter = rInner + (Math.max(1.5, e.avg) / 20) * (rMax - rInner);
              const rMaxScore = rInner + (Math.max(1.5, e.max) / 20) * (rMax - rInner);
              const isSelected = active?.subject === e.subject;
              const midAngle = i * step + step / 2;
              const labelPos = polarToCartesian(cx, cy, rMax + 21, midAngle);

              return (
                <g
                  key={e.subject}
                  className="cursor-pointer transition-opacity duration-200"
                  onMouseEnter={() => setHoveredSubject(e.subject)}
                  onClick={() => setHoveredSubject(e.subject)}
                >
                  {/* Ghost envelope up to max score */}
                  <path
                    d={sectorPath(cx, cy, rInner, rMaxScore, startA, endA)}
                    fill={e.pigment.soft}
                    opacity={isSelected ? 0.95 : 0.55}
                    stroke={e.pigment.main}
                    strokeWidth="0.6"
                    strokeDasharray="2 2"
                  />
                  {/* Main average petal */}
                  <path
                    d={sectorPath(cx, cy, rInner, rOuter, startA, endA)}
                    fill={e.pigment.main}
                    fillOpacity={isSelected ? 0.88 : 0.72}
                    stroke="#1c1915"
                    strokeWidth={isSelected ? 1.4 : 0.8}
                  />
                  {/* Hatching overlay when selected */}
                  {isSelected ? (
                    <path d={sectorPath(cx, cy, rInner, rOuter, startA, endA)} fill="url(#hatch-ink)" />
                  ) : null}

                  {/* Individual evaluation satellites */}
                  {e.list.map((g, gi) => {
                    const spread = ((gi - (e.list.length - 1) / 2) / Math.max(1, e.list.length)) * (step * 0.52);
                    const satAngle = midAngle + spread;
                    const satR = rInner + ((g.score ?? 0) / 20) * (rMax - rInner);
                    const pt = polarToCartesian(cx, cy, satR, satAngle);
                    return (
                      <circle
                        key={g.id}
                        cx={pt.x}
                        cy={pt.y}
                        r={2.5 + g.coefficient * 1.1}
                        fill="#fcf8f1"
                        stroke="#1c1915"
                        strokeWidth="1.4"
                      >
                        <title>{`${g.evaluationTitle}: ${g.score}/20 (coef ${g.coefficient})`}</title>
                      </circle>
                    );
                  })}

                  {/* Outer Subject Label */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontWeight={isSelected ? "700" : "500"}
                    fill="#1c1915"
                  >
                    {e.subject.slice(0, 11)}
                  </text>
                </g>
              );
            })}

            {/* Constellation thread connecting averages */}
            {entries.length > 2 ? (
              <polygon
                points={polyPoints}
                fill="none"
                stroke="#1c1915"
                strokeWidth="1.2"
                strokeDasharray="3 2"
                pointerEvents="none"
              />
            ) : null}

            {/* Center hub */}
            <circle cx={cx} cy={cy} r={rInner} fill="#fcf8f1" stroke="#1c1915" strokeWidth="1.5" />
            <text
              x={cx}
              y={cy - 3}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="700"
              fill="#1c1915"
            >
              {overall.toFixed(1)}
            </text>
            <text
              x={cx}
              y={cy + 9}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7.5"
              fill="#6a6358"
              fontFamily="monospace"
            >
              MOY.
            </text>
          </svg>
        </div>

        {/* Right-hand editorial readout */}
        <div className="flex flex-col justify-between gap-4">
          {active ? (
            <div
              className="border-l-[3px] bg-[var(--paper-2)] p-4"
              style={{ borderLeftColor: active.pigment.main }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: active.pigment.main }}>
                  ● {active.subject}
                </span>
                <span className="mono-badge">Amplitude {active.min}–{active.max}/20</span>
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="serif text-4xl font-semibold leading-none">{active.avg.toFixed(2)}</span>
                <span className="text-xs text-[var(--muted)]">
                  sur 20 · {active.list.length} évaluation{active.list.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-3 grid gap-1.5 border-t border-[var(--line)] pt-2.5">
                {active.list.map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium">
                      {g.evaluationTitle}{" "}
                      <span className="text-[10px] text-[var(--muted)]">(×{g.coefficient})</span>
                    </span>
                    <span className="metric font-semibold" style={{ color: active.pigment.main }}>
                      {g.score}/20
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            {entries.map((e) => {
              const isAct = active?.subject === e.subject;
              return (
                <button
                  key={e.subject}
                  type="button"
                  onClick={() => setHoveredSubject(e.subject)}
                  className={`flex items-center justify-between border px-3 py-2 text-left transition-colors ${
                    isAct ? "border-[var(--ink)] bg-[var(--paper-2)]" : "border-[var(--line)] bg-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate text-xs font-medium">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: e.pigment.main }} />
                    <span className="truncate">{e.subject}</span>
                  </span>
                  <span className="metric ml-2 text-xs font-bold">{e.avg}</span>
                </button>
              );
            })}
          </div>

          <p className="m-0 text-[11px] leading-relaxed text-[var(--muted)]">
            <strong className="text-[var(--ink)]">Lecture :</strong> Le rayon plein indique la moyenne pondérée ; le halo en pointillés marque la note maximale atteinte et chaque point blanc représente un devoir (taille proportionnelle au coefficient).
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. TRAJECTOIRE D'ÉVALUATION (Connected Ribbon & Weighted Beeswarm)
 * Plots every evaluation chronologically with a smooth cubic Bézier curve and reference bands.
 */
export function GradeTrajectoryRibbon({ grades }: { grades: Grade[] }) {
  if (grades.length === 0) return null;

  const sorted = [...grades].reverse();
  const width = 620;
  const height = 210;
  const padL = 34;
  const padR = 20;
  const padT = 22;
  const padB = 38;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const points = sorted.map((g, idx) => {
    const x = padL + (sorted.length === 1 ? innerW / 2 : (idx / (sorted.length - 1)) * innerW);
    const score = g.score ?? 10;
    const y = padT + innerH - (Math.min(20, Math.max(0, score)) / 20) * innerH;
    return { x, y, g, pigment: pigmentFor(g.subject, idx) };
  });

  // Smooth catmull-rom / cubic bezier path
  let pathD = "";
  points.forEach((pt, i) => {
    if (i === 0) {
      pathD += `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    } else {
      const prev = points[i - 1];
      const cpx1 = prev.x + (pt.x - prev.x) * 0.45;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (pt.x - prev.x) * 0.55;
      const cpy2 = pt.y;
      pathD += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }
  });

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
      : "";

  const y10 = padT + innerH - (10 / 20) * innerH;
  const y15 = padT + innerH - (15 / 20) * innerH;

  return (
    <div className="editorial-card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div>
          <span className="eyebrow-tag">Fig. 02 · Sismographe des notes</span>
          <h3 className="serif m-0 mt-0.5 text-xl">Onde de progression &amp; pondérations</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#26684e]" /> Mention (≥15)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#8f2436]" /> Seuil (10/20)
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#284b7a" stopOpacity="0.22" />
            <stop offset="65%" stopColor="#c87d20" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#efe8dc" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[5, 10, 15, 20].map((v) => {
          const y = padT + innerH - (v / 20) * innerH;
          return (
            <g key={v}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke={v === 10 ? "#8f2436" : v === 15 ? "#26684e" : "#d9d0c2"}
                strokeDasharray={v === 10 || v === 15 ? "4 3" : undefined}
                strokeWidth={v === 10 ? 1.1 : 0.8}
                opacity={v === 10 || v === 15 ? 0.65 : 0.6}
              />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="9.5" fontFamily="monospace" fill="#6a6358">
                {v}
              </text>
            </g>
          );
        })}

        {/* Shaded zone between 15 and 20 */}
        <rect
          x={padL}
          y={padT}
          width={innerW}
          height={y15 - padT}
          fill="#26684e"
          opacity="0.045"
        />

        {/* Area under curve */}
        {areaD ? <path d={areaD} fill="url(#ribbonGrad)" /> : null}

        {/* Main curve */}
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="#1c1915"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ) : null}

        {/* Vertical drop-stems and pigment nodes */}
        {points.map((pt, i) => (
          <g key={pt.g.id}>
            <line
              x1={pt.x}
              y1={pt.y}
              x2={pt.x}
              y2={y10}
              stroke={pt.pigment.main}
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity="0.65"
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={4.5 + pt.g.coefficient * 1.8}
              fill={pt.pigment.main}
              stroke="#fcf8f1"
              strokeWidth="2"
            />
            <text
              x={pt.x}
              y={pt.y - (8 + pt.g.coefficient * 1.5)}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#1c1915"
            >
              {pt.g.score}
            </text>
            <text
              x={pt.x}
              y={height - 14}
              textAnchor="middle"
              fontSize="9"
              fill="#6a6358"
            >
              {pt.g.subject.slice(0, 5)}. #{i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * 3. RYTHME HEBDOMADAIRE & CODE-BARRES SOLAIRE (Weekly Horological Barcode)
 * Visualizes the density of hours across the 6 university days like an architectural sun-chart.
 */
export function WeeklyRhythmStrip({ schedules }: { schedules: Bootstrap["schedules"] }) {
  const days = [
    { id: 1, short: "LUN", full: "Lundi" },
    { id: 2, short: "MAR", full: "Mardi" },
    { id: 3, short: "MER", full: "Mercredi" },
    { id: 4, short: "JEU", full: "Jeudi" },
    { id: 5, short: "VEN", full: "Vendredi" },
    { id: 6, short: "SAM", full: "Samedi" },
  ];

  const totalHours = schedules.reduce((acc, s) => {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    return acc + Math.max(0, eh + em / 60 - (sh + sm / 60));
  }, 0);

  return (
    <div className="editorial-card p-5">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div>
          <span className="eyebrow-tag">Fig. 03 · Cadence horaire</span>
          <h3 className="serif m-0 mt-0.5 text-xl">Spectre solaire de la semaine</h3>
        </div>
        <span className="mono-badge">{totalHours}h de cours / sem.</span>
      </div>

      <div className="grid gap-2.5">
        {days.map((d) => {
          const daySlots = schedules.filter((s) => s.dayOfWeek === d.id);
          return (
            <div key={d.id} className="grid grid-cols-[44px_1fr_42px] items-center gap-3">
              <span className="font-mono text-xs font-bold tracking-wider text-[var(--muted)]">{d.short}</span>
              <div className="relative h-7 overflow-hidden border border-[var(--line-strong)] bg-[var(--paper-2)]">
                {/* Hour ticks from 08:00 to 18:00 */}
                {[10, 12, 14, 16].map((h) => (
                  <div
                    key={h}
                    className="absolute inset-y-0 border-l border-dashed border-[var(--line-strong)]"
                    style={{ left: `${((h - 8) / 10) * 100}%` }}
                  />
                ))}
                {daySlots.map((s) => {
                  const [sh, sm] = s.startTime.split(":").map(Number);
                  const [eh, em] = s.endTime.split(":").map(Number);
                  const startPct = Math.max(0, Math.min(100, (((sh + sm / 60) - 8) / 10) * 100));
                  const widthPct = Math.max(6, Math.min(100 - startPct, (((eh + em / 60) - (sh + sm / 60)) / 10) * 100));
                  const pig = pigmentFor(s.subject);
                  return (
                    <div
                      key={s.id}
                      title={`${s.subject} (${s.startTime}–${s.endTime}) · Salle ${s.room ?? "—"}`}
                      className="absolute inset-y-1 flex items-center overflow-hidden px-1.5 text-[10px] font-medium text-[#fcf8f1]"
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        background: pig.main,
                        borderLeft: "2px solid #1c1915",
                      }}
                    >
                      <span className="truncate">{s.subject}</span>
                    </div>
                  );
                })}
              </div>
              <span className="metric text-right text-xs text-[var(--muted)]">
                {daySlots.length * 2}h
              </span>
            </div>
          );
        })}
        <div className="grid grid-cols-[44px_1fr_42px] gap-3 pt-1 font-mono text-[10px] text-[var(--muted)]">
          <span />
          <div className="flex justify-between">
            <span>08h</span>
            <span>10h</span>
            <span>12h</span>
            <span>14h</span>
            <span>16h</span>
            <span>18h</span>
          </div>
          <span />
        </div>
      </div>
    </div>
  );
}

/**
 * 4. TEACHER DISPERSION BARCODE & COHORT SPECTRUM
 * Shows every student's average as a pin on a 0-20 archival ruler + evaluation breakdown.
 */
export function TeacherCohortSpectrum({ data }: { data: Bootstrap }) {
  const studentAverages = data.people
    .filter((p) => p.role === "student")
    .map((s, idx) => {
      const sGrades = data.grades.filter((g) => g.studentId === s.id);
      const avg = average(sGrades);
      return {
        student: s,
        avg,
        count: sGrades.length,
        idx,
      };
    })
    .filter((x) => x.avg !== null) as Array<{ student: Bootstrap["people"][number]; avg: number; count: number; idx: number }>;

  const classAvg =
    studentAverages.length > 0
      ? Math.round((studentAverages.reduce((a, b) => a + b.avg, 0) / studentAverages.length) * 10) / 10
      : null;

  return (
    <div className="editorial-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div>
          <span className="eyebrow-tag">Fig. 01 · Dispersion de cohorte</span>
          <h3 className="serif m-0 mt-0.5 text-xl">Spectre des moyennes étudiantes (0—20)</h3>
        </div>
        {classAvg !== null ? (
          <span className="mono-badge">Moyenne de cohorte : {classAvg}/20</span>
        ) : null}
      </div>

      {/* Barcode distribution ruler */}
      <div className="relative mt-6 mb-8 h-20 border border-[var(--line-strong)] bg-[var(--paper-2)]">
        {/* Colored background zones */}
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[#8f2436]/[0.05] border-r border-dashed border-[#8f2436]" />
        <div className="absolute inset-y-0 left-3/4 right-0 bg-[#26684e]/[0.06] border-l border-dashed border-[#26684e]" />

        {/* Scale numbers */}
        {[0, 5, 10, 12, 14, 16, 20].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0"
            style={{ left: `${(mark / 20) * 100}%` }}
          >
            <div className="h-2.5 border-l border-[var(--ink)] opacity-40" />
            <span className="absolute -bottom-5 -translate-x-1/2 font-mono text-[10px] text-[var(--muted)]">
              {mark}
            </span>
          </div>
        ))}

        {/* Class average needle */}
        {classAvg !== null ? (
          <div
            className="absolute -top-3 -bottom-2 z-10 border-l-2 border-[#c87d20]"
            style={{ left: `${(classAvg / 20) * 100}%` }}
          >
            <span className="absolute -top-4 -translate-x-1/2 whitespace-nowrap bg-[#c87d20] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#fcf8f1]">
              MOY {classAvg}
            </span>
          </div>
        ) : null}

        {/* Student pins */}
        {studentAverages.map((item, i) => {
          const left = `${(item.avg / 20) * 100}%`;
          const color = item.avg >= 15 ? "#26684e" : item.avg >= 12 ? "#284b7a" : item.avg >= 10 ? "#c87d20" : "#8f2436";
          const staggerY = 14 + (i % 3) * 18;
          return (
            <div
              key={item.student.id}
              title={`${item.student.name} — ${item.avg}/20`}
              className="group absolute -translate-x-1/2 cursor-pointer"
              style={{ left, top: staggerY }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full border border-[#1c1915] text-[9px] font-bold text-[#fcf8f1] transition-transform group-hover:scale-125"
                style={{ background: color }}
              >
                {item.student.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top & bottom student callouts */}
      <div className="grid gap-3 pt-2 sm:grid-cols-3">
        {studentAverages
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 6)
          .map((item) => {
            const color = item.avg >= 15 ? "#26684e" : item.avg >= 12 ? "#284b7a" : "#c87d20";
            return (
              <div key={item.student.id} className="flex items-center justify-between border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2">
                <div className="min-w-0">
                  <p className="m-0 truncate text-xs font-semibold">{item.student.name}</p>
                  <p className="m-0 text-[10px] text-[var(--muted)]">{item.student.className}</p>
                </div>
                <span className="metric ml-2 text-sm font-bold" style={{ color }}>
                  {item.avg}/20
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/**
 * 5. ADMIN DU BOIS CONCENTRIC GAUGE & ARCHITECTURAL PROMOTION TRELLIS
 * Inspired by W.E.B. Du Bois's 1900 Paris Exposition spiral/concentric plates & architectural blueprints.
 */
export function AdminCampusCartography({ data, onTab }: { data: Bootstrap; onTab: (t: string) => void }) {
  const totalStudents = data.classes.reduce((acc, c) => acc + c.studentCount, 0) || 1;
  const palette = ["#284b7a", "#b54d32", "#26684e", "#8f2436", "#c87d20", "#5e3c78"];

  const justifiedCount = data.absences.filter((a) => a.justified).length;
  const unjustifiedCount = data.absences.filter((a) => !a.justified).length;
  const totalAbs = Math.max(1, data.absences.length);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
      {/* Left: Architectural Trellis of Promotions */}
      <div className="editorial-card p-5">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <span className="eyebrow-tag">Fig. 01 · Cadastre des promotions</span>
            <h3 className="serif m-0 mt-0.5 text-xl">Répartition cellulaire des effectifs</h3>
          </div>
          <span className="mono-badge">{totalStudents} inscrits</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {data.classes.map((cls, idx) => {
            const color = palette[idx % palette.length];
            const ratio = Math.round((cls.studentCount / totalStudents) * 100);
            const classAbsences = data.absences.filter((a) => a.classId === cls.id).length;

            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => onTab("classes_admin")}
                className="group relative flex flex-col justify-between overflow-hidden border border-[var(--ink)]/25 bg-[var(--paper-2)] p-4 text-left transition-colors hover:border-[var(--ink)]"
              >
                <div
                  className="absolute top-0 bottom-0 left-0 w-1.5"
                  style={{ background: color }}
                />
                <div className="flex items-start justify-between gap-2 pl-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
                      Salle {cls.room ?? "—"} · {ratio}%
                    </span>
                    <h4 className="serif m-0 mt-0.5 text-xl">{cls.name}</h4>
                  </div>
                  <span
                    className="px-2 py-0.5 font-mono text-xs font-bold text-[#fcf8f1]"
                    style={{ background: color }}
                  >
                    {cls.studentCount} étu.
                  </span>
                </div>

                {/* Dot-matrix of students in this promotion */}
                <div className="my-3 flex flex-wrap gap-1.5 pl-2">
                  {Array.from({ length: Math.max(1, cls.studentCount) }).map((_, dotIdx) => {
                    const isAbs = dotIdx < classAbsences;
                    return (
                      <span
                        key={dotIdx}
                        className="inline-block h-3 w-3 rounded-[1px] border border-[#1c1915]/40"
                        style={{
                          background: isAbs ? "#8f2436" : color,
                          opacity: isAbs ? 1 : 0.78,
                        }}
                        title={isAbs ? "Événement d'absence signalé" : "Étudiant inscrit"}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--line)] pt-2 pl-2 text-[11px] text-[var(--muted)]">
                  <span>Réf. : {cls.principalName ?? "Non assigné"}</span>
                  <span>{classAbsences} abs.</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: W.E.B. Du Bois Concentric Arcs of University Balance */}
      <div className="editorial-card flex flex-col justify-between p-5">
        <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <span className="eyebrow-tag">Fig. 02 · Anneaux de Du Bois</span>
            <h3 className="serif m-0 mt-0.5 text-xl">Équilibre &amp; assiduité</h3>
          </div>
          <span className="mono-badge">Temps réel</span>
        </div>

        <div className="grid items-center gap-4 sm:grid-cols-[190px_1fr]">
          <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[185px]">
            {[
              {
                label: "Couverture cours",
                pct: Math.min(1, data.schedules.length / 24),
                r: 82,
                color: "#284b7a",
              },
              {
                label: "Encadrement",
                pct: Math.min(1, (data.stats?.teachers ?? 5) / 6),
                r: 64,
                color: "#26684e",
              },
              {
                label: "Absences justifiées",
                pct: justifiedCount / totalAbs,
                r: 46,
                color: "#c87d20",
              },
              {
                label: "À régulariser",
                pct: unjustifiedCount / totalAbs,
                r: 28,
                color: "#8f2436",
              },
            ].map((ring) => {
              const circ = 2 * Math.PI * ring.r;
              const arc = circ * 0.78;
              const filled = arc * ring.pct;
              return (
                <g key={ring.label} transform="rotate(130 100 100)">
                  <circle
                    cx="100"
                    cy="100"
                    r={ring.r}
                    fill="none"
                    stroke="#e5dccf"
                    strokeWidth="11"
                    strokeDasharray={`${arc} ${circ}`}
                    strokeLinecap="butt"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={ring.r}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth="11"
                    strokeDasharray={`${filled} ${circ}`}
                    strokeLinecap="butt"
                  />
                </g>
              );
            })}
            <circle cx="100" cy="100" r="14" fill="#1c1915" />
            <text x="100" y="103" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fcf8f1" fontFamily="monospace">
              SN
            </text>
          </svg>

          <div className="grid gap-2.5 text-xs">
            <div className="border-l-[3px] border-[#284b7a] pl-2.5">
              <p className="m-0 font-semibold text-[var(--ink)]">{data.schedules.length} créneaux hebdomadaires</p>
              <p className="m-0 text-[11px] text-[var(--muted)]">Occupation des salles &amp; labos</p>
            </div>
            <div className="border-l-[3px] border-[#26684e] pl-2.5">
              <p className="m-0 font-semibold text-[var(--ink)]">{data.stats?.teachers ?? 0} chaires actives</p>
              <p className="m-0 text-[11px] text-[var(--muted)]">Corps professoral titulaire</p>
            </div>
            <div className="border-l-[3px] border-[#c87d20] pl-2.5">
              <p className="m-0 font-semibold text-[var(--ink)]">{justifiedCount} absences régularisées</p>
              <p className="m-0 text-[11px] text-[var(--muted)]">Certificats &amp; convocations validés</p>
            </div>
            <div className="border-l-[3px] border-[#8f2436] pl-2.5">
              <p className="m-0 font-semibold text-[var(--ink)]">{unjustifiedCount} en attente de justificatif</p>
              <p className="m-0 text-[11px] text-[var(--muted)]">Signalements à traiter</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


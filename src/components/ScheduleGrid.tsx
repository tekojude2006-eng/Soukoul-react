"use client";

import { DAYS } from "@/lib/types";
import type { ScheduleSlot } from "@/lib/types";
import { isOngoing, jsDayToSchool, timeToMinutes } from "@/lib/utils";
import { pigmentFor } from "@/components/EditorialCharts";

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i);
const ROW = 58;

function topOf(start: string) {
  return ((timeToMinutes(start) - 8 * 60) / 60) * ROW;
}
function heightOf(start: string, end: string) {
  return Math.max(34, ((timeToMinutes(end) - timeToMinutes(start)) / 60) * ROW - 4);
}

export function ScheduleGrid({
  slots,
  onSelect,
}: {
  slots: ScheduleSlot[];
  onSelect?: (slot: ScheduleSlot) => void;
}) {
  const today = jsDayToSchool(new Date().getDay());
  return (
    <div className="table-wrap scrollbar-thin">
      <div className="min-w-[920px]">
        <div className="grid grid-cols-[64px_repeat(6,1fr)] border-b border-[var(--line-strong)]">
          <div />
          {DAYS.map((d) => (
            <div
              key={d.id}
              className="px-2 py-2 text-center"
              style={today === d.id ? { background: "#f3e6e8" } : undefined}
            >
              <p className="m-0 text-[11px] text-[var(--muted)]">{d.short}</p>
              <p className="m-0 text-sm font-medium">{d.label}</p>
            </div>
          ))}
        </div>
        <div className="relative grid grid-cols-[64px_repeat(6,1fr)]">
          <div>
            {HOURS.map((h) => (
              <div key={h} className="pr-2 text-right text-[11px] text-[var(--muted)]" style={{ height: ROW }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {DAYS.map((d) => (
            <div
              key={d.id}
              className="relative border-l border-[var(--line)]"
              style={{ height: HOURS.length * ROW, background: today === d.id ? "rgba(122,35,48,0.03)" : undefined }}
            >
              {HOURS.map((h) => (
                <div key={h} className="border-t border-[var(--line)]" style={{ height: ROW }} />
              ))}
              {slots
                .filter((s) => s.dayOfWeek === d.id)
                .map((s, idx) => {
                  const live = today === d.id && isOngoing(s.startTime, s.endTime);
                  const pig = pigmentFor(s.subject, idx);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelect?.(s)}
                      className="absolute right-1 left-1 overflow-hidden p-2 text-left transition-transform hover:z-10 hover:scale-[1.01]"
                      style={{
                        top: topOf(s.startTime) + 3,
                        height: heightOf(s.startTime, s.endTime),
                        background: pig.soft,
                        border: `1px solid ${pig.main}`,
                        borderLeft: `4px solid ${pig.main}`,
                      }}
                    >
                      <p className="m-0 text-[12px] font-bold leading-tight" style={{ color: pig.ink }}>
                        {live ? "● " : ""}
                        {s.subject}
                      </p>
                      <p className="m-0 mt-0.5 font-mono text-[10px]" style={{ color: pig.ink, opacity: 0.85 }}>
                        {s.startTime}–{s.endTime}
                        {s.room ? ` · ${s.room}` : ""}
                      </p>
                      <p className="m-0 text-[10px]" style={{ color: pig.ink, opacity: 0.75 }}>{s.teacherName}</p>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

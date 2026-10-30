"use client";

import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Download,
  FileText,
  Mail,
  MessageCircle,
  Printer,
  Send,
} from "lucide-react";
import type { Bootstrap, Course, Grade, Homework, Person } from "@/lib/types";
import {
  average,
  firstName,
  formatDateTime,
  formatLongDate,
  formatShortDate,
  greeting,
  homeworkUrgency,
  isOngoing,
  jsDayToSchool,
  waLink,
} from "@/lib/utils";
import { Avatar, Button, Empty, Field, Modal } from "@/components/ui";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import {
  GradeTrajectoryRibbon,
  pigmentFor,
  PolarAcademicRose,
  WeeklyRhythmStrip,
} from "@/components/EditorialCharts";

function urgencyChip(due: string) {
  const u = homeworkUrgency(due);
  if (u === "late") return <span className="chip chip-late">En retard</span>;
  if (u === "today") return <span className="chip chip-warn">Aujourd&apos;hui</span>;
  if (u === "tomorrow") return <span className="chip chip-gold">Demain</span>;
  return <span className="chip">{formatShortDate(due)}</span>;
}

export function StudentHome({
  data,
  onTab,
  onToggle,
}: {
  data: Bootstrap;
  onTab: (t: string) => void;
  onToggle: (hw: Homework, completed: boolean) => void;
}) {
  const day = jsDayToSchool(new Date().getDay());
  const todaySlots = data.schedules.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const avg = average(data.grades);
  const pending = data.homeworks.filter((h) => !h.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const unread = data.messages.filter((m) => !m.read).length + data.notifications.filter((n) => !n.read).length;
  const lastGrades = [...data.grades].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);

  return (
    <div className="stagger grid gap-7">
      {/* Editorial masthead */}
      <div className="editorial-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="kicker">Carnet d&apos;études · {data.user.className}</span>
              <span className="mono-badge">Semestre 1</span>
            </div>
            <h1 className="serif mt-1.5 mb-0 text-[2.45rem] leading-none">
              {greeting()}, {firstName(data.user.name)}
            </h1>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
              Dakar · Campus Universitaire
            </p>
            <p className="m-0 mt-0.5 text-sm font-medium text-[var(--ink)]">
              {formatLongDate(new Date().toISOString().slice(0, 10))}
            </p>
          </div>
        </div>

        {/* 4 KPI Stamps */}
        <div className="grid grid-cols-2 border-t border-[var(--line)] bg-[var(--paper-2)] md:grid-cols-4">
          <button
            type="button"
            onClick={() => onTab("notes")}
            className="border-r border-b border-[var(--line)] p-4 text-left transition-colors hover:bg-[var(--surface)] md:border-b-0"
          >
            <p className="kicker">Moyenne générale</p>
            <p className="metric my-1 text-3xl font-semibold text-[var(--ink)]">
              {avg ?? "—"}
              <span className="text-sm font-normal text-[var(--muted)]">/20</span>
            </p>
            <p className="m-0 text-[11px] text-[var(--muted)]">{data.grades.length} notes validées</p>
          </button>

          <button
            type="button"
            onClick={() => onTab("devoirs")}
            className="border-b border-[var(--line)] p-4 text-left transition-colors hover:bg-[var(--surface)] md:border-r md:border-b-0"
          >
            <p className="kicker">Travaux en cours</p>
            <p className="metric my-1 text-3xl font-semibold text-[var(--ink)]">{pending.length}</p>
            <p className="m-0 truncate text-[11px] text-[var(--muted)]">
              {pending[0] ? pending[0].title : "Tout est à jour"}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onTab("classes")}
            className="border-r border-[var(--line)] p-4 text-left transition-colors hover:bg-[var(--surface)]"
          >
            <p className="kicker">Supports de cours</p>
            <p className="metric my-1 text-3xl font-semibold text-[var(--ink)]">{data.courses.length}</p>
            <p className="m-0 text-[11px] text-[var(--muted)]">Polycopiés &amp; annales</p>
          </button>

          <button
            type="button"
            onClick={() => onTab("messages")}
            className="p-4 text-left transition-colors hover:bg-[var(--surface)]"
          >
            <p className="kicker">Signaux &amp; messages</p>
            <p className="metric my-1 text-3xl font-semibold text-[var(--ink)]">{unread}</p>
            <p className="m-0 text-[11px] text-[var(--muted)]">Non lus cette semaine</p>
          </button>
        </div>
      </div>

      {/* Row 1: Polar Academic Rose + Today's Agenda & Weekly Solar Strip */}
      <div className="grid gap-6 xl:grid-cols-[1.28fr_0.92fr]">
        <PolarAcademicRose grades={data.grades} />

        <div className="grid content-start gap-6">
          <section className="editorial-card p-5">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <span className="eyebrow-tag">Agenda du jour</span>
                <h2 className="serif m-0 mt-0.5 text-xl">Feuille de route</h2>
              </div>
              <button className="btn btn-ghost" style={{ height: 34 }} onClick={() => onTab("schedule")} type="button">
                <CalendarDays size={14} />
                Semaine
              </button>
            </div>
            {todaySlots.length === 0 ? (
              <Empty title="Journée libre" text="Aucun cours n'est prévu pour votre promotion aujourd'hui." />
            ) : (
              <div className="grid gap-2.5">
                {todaySlots.map((s, idx) => {
                  const live = isOngoing(s.startTime, s.endTime);
                  const pig = pigmentFor(s.subject, idx);
                  return (
                    <div
                      key={s.id}
                      className="flex items-stretch overflow-hidden border border-[var(--line-strong)] bg-[var(--paper-2)]"
                    >
                      <div
                        className="flex w-16 shrink-0 flex-col justify-center px-2 py-2.5 text-center text-[#fcf8f1]"
                        style={{ background: pig.main }}
                      >
                        <span className="metric text-xs font-bold">{s.startTime}</span>
                        <span className="metric text-[10px] opacity-80">{s.endTime}</span>
                      </div>
                      <div className="min-w-0 flex-1 px-3.5 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="m-0 truncate font-semibold text-[var(--ink)]">{s.subject}</p>
                          {live ? <span className="chip chip-ok">En direct</span> : <span className="mono-badge">{s.room}</span>}
                        </div>
                        <p className="m-0 mt-0.5 text-xs text-[var(--muted)]">{s.teacherName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <WeeklyRhythmStrip schedules={data.schedules} />
        </div>
      </div>

      {/* Row 2: Seismograph Trajectory Ribbon */}
      <GradeTrajectoryRibbon grades={data.grades} />

      {/* Row 3: Homework & Recent Evaluations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="editorial-card p-5">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="eyebrow-tag">Échéancier</span>
              <h2 className="serif m-0 mt-0.5 text-xl">Travail à rendre</h2>
            </div>
            <button className="btn btn-ghost" style={{ height: 32 }} onClick={() => onTab("devoirs")} type="button">
              <Clock3 size={14} /> Tout voir
            </button>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {data.homeworks.slice(0, 5).map((h, i) => {
              const pig = pigmentFor(h.subject, i);
              return (
                <label key={h.id} className="flex cursor-pointer items-start gap-3 py-3">
                  <input type="checkbox" checked={h.completed} onChange={(e) => onToggle(h, e.target.checked)} className="mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className={`m-0 font-medium ${h.completed ? "done" : ""}`}>{h.title}</p>
                    <p className="m-0 mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: pig.main }} />
                      {h.subject} · {h.teacherName}
                    </p>
                  </div>
                  {urgencyChip(h.dueDate)}
                </label>
              );
            })}
          </div>
        </section>

        <section className="editorial-card p-5">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="eyebrow-tag">Relevé</span>
              <h2 className="serif m-0 mt-0.5 text-xl">Dernières copies corrigées</h2>
            </div>
            <button className="btn btn-ghost" style={{ height: 32 }} onClick={() => onTab("notes")} type="button">
              Bulletin complet
            </button>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {lastGrades.map((g, i) => {
              const pig = pigmentFor(g.subject, i);
              return (
                <div key={g.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-block h-8 w-1.5 shrink-0"
                      style={{ background: pig.main }}
                    />
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-semibold">{g.evaluationTitle}</p>
                      <p className="m-0 text-xs text-[var(--muted)]">
                        {g.subject} · coef. {g.coefficient}
                        {g.comment ? ` — « ${g.comment} »` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className="metric shrink-0 px-2.5 py-1 text-sm font-bold text-[#fcf8f1]"
                    style={{ background: pig.main }}
                  >
                    {g.score}/20
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="editorial-card p-5">
        <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <span className="eyebrow-tag">Télégrammes</span>
            <h2 className="serif m-0 mt-0.5 text-xl">Fil récent du campus</h2>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.activity.slice(0, 4).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onTab(a.tab)}
              className="flex w-full items-center justify-between border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-left transition-colors hover:border-[var(--ink)]"
            >
              <div className="min-w-0 pr-2">
                <p className="m-0 truncate font-medium">{a.title}</p>
                <p className="m-0 truncate text-xs text-[var(--muted)]">{a.body}</p>
              </div>
              <span className="chip chip-gold shrink-0">{a.type}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CourseReaderModal({
  course,
  onClose,
}: {
  course: Course | null;
  onClose: () => void;
}) {
  if (!course) return null;
  const pig = pigmentFor(course.subject);
  const hasCustomContent = Boolean(course.content?.trim());
  const bodyText =
    course.content?.trim() ||
    (course.attachmentUrl
      ? ""
      : `${course.description ?? ""}\n\nI. Introduction et objectifs du chapitre\nCe support de cours couvre les notions fondamentales au programme de ${course.subject}.\n\nII. Synthèse des notions clés\n• Définitions canoniques et démonstrations vues en amphithéâtre.\n• Méthodes de résolution d'exercices types.\n• Points de vigilance pour les évaluations écrites.`);

  const isImage = Boolean(
    course.attachmentUrl?.startsWith("data:image/") ||
      /\.(png|jpe?g|webp|gif)$/i.test(course.attachmentName ?? ""),
  );
  const isPdf = Boolean(
    course.attachmentUrl?.startsWith("data:application/pdf") ||
      /\.pdf$/i.test(course.attachmentName ?? ""),
  );

  function downloadSheet() {
    if (!course) return;
    const blob = new Blob(
      [
        `UNIVERSITÉ SOUKOUL · DAKAR\nMATIÈRE : ${course.subject.toUpperCase()}\nTITRE : ${course.title}\nENSEIGNANT : ${course.teacherName}\n\nRésumé :\n${course.description ?? "—"}\n\n----------------------------------------\n\n${bodyText}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal
      open={Boolean(course)}
      title={course.title}
      subtitle={`${course.subject} · ${course.teacherName}${course.className ? ` · ${course.className}` : ""}`}
      onClose={onClose}
      wide
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 text-xs font-semibold text-[#fcf8f1]"
              style={{ background: pig.main }}
            >
              {course.subject}
            </span>
            {course.className ? <span className="mono-badge">{course.className}</span> : null}
            <span className="text-xs text-[var(--muted)]">
              Publié le {new Intl.DateTimeFormat("fr-FR").format(new Date(course.createdAt))}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {course.attachmentUrl ? (
              <a
                href={course.attachmentUrl}
                download={course.attachmentName || "support-cours"}
                target="_blank"
                rel="noreferrer"
                className="btn btn-gold"
                style={{ height: 34, padding: "0 12px", fontSize: 12 }}
              >
                <Download size={14} />
                Télécharger {course.attachmentName || "la pièce jointe"}
              </a>
            ) : null}
            {bodyText ? (
              <button
                type="button"
                onClick={downloadSheet}
                className="btn btn-ghost"
                style={{ height: 34, padding: "0 12px", fontSize: 12 }}
              >
                <FileText size={14} />
                Fiche (.txt)
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-ghost"
              style={{ height: 34, padding: "0 12px", fontSize: 12 }}
            >
              <Printer size={14} />
              Imprimer
            </button>
          </div>
        </div>

        {course.description ? (
          <div
            className="border-l-[3px] bg-[var(--paper-2)] px-4 py-3 text-sm italic text-[var(--ink)]"
            style={{ borderLeftColor: pig.main }}
          >
            {course.description}
          </div>
        ) : null}

        {course.attachmentUrl && isImage ? (
          <div className="overflow-hidden border border-[var(--line)] bg-[#fffdf8] p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.attachmentUrl}
              alt={course.attachmentName || course.title}
              className="mx-auto max-h-[420px] w-auto object-contain"
            />
          </div>
        ) : null}

        {course.attachmentUrl && isPdf ? (
          <iframe
            src={course.attachmentUrl}
            title={course.attachmentName || course.title}
            className="h-[420px] w-full border border-[var(--line)] bg-[#fff]"
          />
        ) : null}

        {bodyText || !course.attachmentUrl || hasCustomContent ? (
          <div className="max-h-[48vh] overflow-y-auto border border-[var(--line)] bg-[#fffdf8] p-5 leading-7 whitespace-pre-wrap text-[14.5px] text-[var(--ink)]">
            {bodyText}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export function StudentClasses({ data }: { data: Bootstrap }) {
  const [filter, setFilter] = useState<"all" | string>("all");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const subjects = Array.from(new Set(data.courses.map((c) => c.subject)));
  const avgBy = new Map<string, number | null>();
  const uniqueSubjects = Array.from(new Set(data.grades.map((g) => g.subject).concat(subjects)));
  for (const s of uniqueSubjects) {
    avgBy.set(s, average(data.grades.filter((g) => g.subject === s)));
  }
  return (
    <div className="stagger grid gap-5">
      <header>
        <p className="eyebrow-tag">Pédagogie</p>
        <h1 className="serif mt-1 mb-0 text-[2.1rem]">Matières et supports de cours</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {[...avgBy.entries()].map(([subject, avg], i) => {
          const pig = pigmentFor(subject, i);
          return (
            <article
              key={subject}
              className="editorial-card p-5"
              style={{ borderTop: `4px solid ${pig.main}` }}
            >
              <div className="flex items-center justify-between">
                <p className="m-0 text-sm font-semibold" style={{ color: pig.main }}>
                  {subject}
                </p>
                <span className="mono-badge">{pig.label}</span>
              </div>
              <p className="serif my-2 text-4xl">
                {avg ?? "—"}
                <span className="text-lg text-[var(--muted)]">/20</span>
              </p>
              <div className="progress">
                <span style={{ width: `${avg ? (avg / 20) * 100 : 0}%`, background: pig.main }} />
              </div>
            </article>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`chip ${filter === "all" ? "chip-gold" : ""}`} onClick={() => setFilter("all")}>Tous</button>
        {subjects.map((s) => (
          <button key={s} type="button" className={`chip ${filter === s ? "chip-gold" : ""}`} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {data.courses
          .filter((c) => filter === "all" || c.subject === filter)
          .map((c: Course, i) => {
            const pig = pigmentFor(c.subject, i);
            return (
              <article
                key={c.id}
                onClick={() => setActiveCourse(c)}
                className="editorial-card flex cursor-pointer flex-col justify-between p-5 transition-colors hover:border-[var(--ink)]"
                style={{ borderLeft: `4px solid ${pig.main}` }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-block px-2 py-0.5 text-[11px] font-semibold text-[#fcf8f1]"
                      style={{ background: pig.main }}
                    >
                      {c.subject}
                    </span>
                    {c.attachmentName ? (
                      <span className="mono-badge">
                        <FileText size={11} /> {c.attachmentName}
                      </span>
                    ) : (
                      <span className="mono-badge">Polycopié</span>
                    )}
                  </div>
                  <h3 className="serif mt-3 mb-1 text-2xl">{c.title}</h3>
                  <p className="m-0 text-sm text-[var(--muted)]">{c.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3">
                  <span className="text-xs text-[var(--muted)]">{c.teacherName}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: pig.main }}>
                    <BookOpen size={14} /> Ouvrir le cours →
                  </span>
                </div>
              </article>
            );
          })}
      </div>
      <CourseReaderModal course={activeCourse} onClose={() => setActiveCourse(null)} />
    </div>
  );
}

export function StudentHomework({
  data,
  onToggle,
}: {
  data: Bootstrap;
  onToggle: (hw: Homework, completed: boolean) => void;
}) {
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");
  const list = data.homeworks.filter((h) => {
    if (filter === "todo") return !h.completed;
    if (filter === "done") return h.completed;
    return true;
  });
  return (
    <div className="stagger grid gap-5">
      <header>
        <p className="eyebrow-tag">Travail personnel</p>
        <h1 className="serif mt-1 mb-0 text-[2.1rem]">Devoirs</h1>
      </header>
      <div className="flex gap-2">
        {[
          { id: "all", label: "Tous" },
          { id: "todo", label: "À faire" },
          { id: "done", label: "Terminés" },
        ].map((f) => (
          <button key={f.id} type="button" className={`chip ${filter === f.id ? "chip-gold" : ""}`} onClick={() => setFilter(f.id as typeof filter)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {list.map((h, i) => {
          const pig = pigmentFor(h.subject, i);
          return (
            <article
              key={h.id}
              className="editorial-card flex flex-col gap-3 p-5 sm:flex-row sm:items-start"
              style={{ borderLeft: `4px solid ${pig.main}` }}
            >
              <button
                type="button"
                className="btn btn-icon shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  background: h.completed ? "#26684e" : "#fcf8f1",
                  borderColor: h.completed ? "#26684e" : "var(--line-strong)",
                  color: h.completed ? "#fcf8f1" : "transparent",
                }}
                onClick={() => onToggle(h, !h.completed)}
                aria-label={h.completed ? "Marquer comme non terminé" : "Marquer comme terminé"}
                aria-pressed={h.completed}
              >
                {h.completed ? <Check size={16} strokeWidth={2.4} /> : null}
              </button>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`serif m-0 text-2xl ${h.completed ? "done" : ""}`}>{h.title}</h3>
                  {urgencyChip(h.dueDate)}
                </div>
                <p className="mt-2 mb-0 text-sm leading-6 text-[var(--muted)]">{h.description}</p>
                <p className="mt-2 mb-0 text-xs text-[var(--muted)]">
                  <strong style={{ color: pig.main }}>{h.subject}</strong> · {h.teacherName} · échéance {formatLongDate(h.dueDate)}
                </p>
              </div>
            </article>
          );
        })}
        {list.length === 0 ? <Empty title="Aucun devoir" text="Rien dans ce filtre pour le moment." /> : null}
      </div>
    </div>
  );
}

export function StudentGrades({ data }: { data: Bootstrap }) {
  const grouped = new Map<string, Grade[]>();
  for (const g of data.grades) {
    const arr = grouped.get(g.subject) ?? [];
    arr.push(g);
    grouped.set(g.subject, arr);
  }
  const gen = average(data.grades);
  return (
    <div className="stagger grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-tag">Évaluations &amp; analytique</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Bulletin &amp; cartographie des notes</h1>
        </div>
        <div className="editorial-card px-5 py-3" style={{ borderTop: "3px solid #284b7a" }}>
          <p className="kicker">Moyenne générale</p>
          <p className="serif m-0 text-3xl">{gen ?? "—"}/20</p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <PolarAcademicRose grades={data.grades} />
        <GradeTrajectoryRibbon grades={data.grades} />
      </div>

      <div className="editorial-card overflow-hidden">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Enseignant</th>
                <th>N1</th>
                <th>N2</th>
                <th>N3</th>
                <th>Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {[...grouped.entries()].map(([subject, list], i) => {
                const scores = list.map((g) => g.score);
                const teacher = list[0]?.teacherName ?? "";
                const pig = pigmentFor(subject, i);
                return (
                  <tr key={subject}>
                    <td className="font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-[1px]" style={{ background: pig.main }} />
                        {subject}
                      </span>
                    </td>
                    <td className="text-[var(--muted)]">{teacher}</td>
                    <td className="metric">{scores[0] ?? "—"}</td>
                    <td className="metric">{scores[1] ?? "—"}</td>
                    <td className="metric">{scores[2] ?? "—"}</td>
                    <td>
                      <span
                        className="metric inline-block px-2 py-0.5 text-xs font-bold text-[#fcf8f1]"
                        style={{ background: pig.main }}
                      >
                        {average(list) ?? "—"}/20
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function StudentCahier({ data }: { data: Bootstrap }) {
  return (
    <div className="stagger grid gap-5">
      <header>
        <p className="eyebrow-tag">Mémoire des séances</p>
        <h1 className="serif mt-1 mb-0 text-[2.1rem]">Cahier de texte</h1>
      </header>
      <div className="grid gap-3">
        {data.sessions.map((s, i) => {
          const pig = pigmentFor(s.subject, i);
          return (
            <article
              key={s.id}
              className="editorial-card p-5"
              style={{ borderLeft: `4px solid ${pig.main}` }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-2 py-0.5 text-xs font-semibold text-[#fcf8f1]"
                  style={{ background: pig.main }}
                >
                  {s.subject}
                </span>
                <span className="chip">{formatLongDate(s.date)}</span>
              </div>
              <h3 className="serif mt-3 mb-1 text-2xl">{s.title}</h3>
              <p className="m-0 text-sm text-[var(--muted)]">{s.teacherName}</p>
              <p className="mt-3 mb-0 leading-7 text-[15px]">{s.summary}</p>
              {s.workAssigned ? (
                <p className="mt-4 mb-0 row px-4 py-3 text-sm">
                  <strong>Travail donné — </strong>
                  {s.workAssigned}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function StudentTeachers({
  data,
  onRefresh,
  toast,
}: {
  data: Bootstrap;
  onRefresh?: () => Promise<unknown>;
  toast?: (msg: string, type?: "ok" | "err") => void;
}) {
  const [selectedTeacher, setSelectedTeacher] = useState<Person | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  const teachers = data.people.filter((p) => p.role === "teacher");

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeacher || !msgText.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId: selectedTeacher.id, content: msgText.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de l'envoi");
      }
      setMsgText("");
      await onRefresh?.();
      toast?.(`Message envoyé à ${selectedTeacher.name}.`);
    } catch (err) {
      toast?.(err instanceof Error ? err.message : "Erreur", "err");
    } finally {
      setSending(false);
    }
  }

  const threadMessages = selectedTeacher
    ? data.messages
        .filter(
          (m) =>
            (m.fromId === selectedTeacher.id && m.toId === data.user.id) ||
            (m.fromId === data.user.id && m.toId === selectedTeacher.id),
        )
        .slice()
        .reverse()
    : [];

  return (
    <div className="stagger grid gap-5">
      <header>
        <p className="eyebrow-tag">Annuaire &amp; Correspondance</p>
        <h1 className="serif mt-1 mb-0 text-[2.1rem]">Professeurs &amp; Messagerie</h1>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {teachers.map((p, i) => {
          const pig = pigmentFor(p.subject, i);
          const count = data.messages.filter(
            (m) =>
              (m.fromId === p.id && m.toId === data.user.id) ||
              (m.fromId === data.user.id && m.toId === p.id),
          ).length;
          return (
            <article
              key={p.id}
              className="editorial-card flex items-start gap-4 p-5"
              style={{ borderTop: `3px solid ${pig.main}` }}
            >
              <Avatar name={p.name} src={p.avatarUrl} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="serif m-0 text-2xl">{p.name}</h3>
                  {count > 0 ? <span className="mono-badge">{count} éch.</span> : null}
                </div>
                <p className="m-0 text-sm font-semibold" style={{ color: pig.main }}>
                  {p.subject}
                </p>
                <p className="mt-2 mb-0 flex items-center gap-2 text-sm">
                  <Mail size={14} /> {p.email}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedTeacher(p);
                      fetch("/api/messages", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "read" }),
                      })
                        .then(() => onRefresh?.())
                        .catch(() => undefined);
                    }}
                    style={{ height: 40 }}
                  >
                    <Send size={14} /> Écrire un message
                  </Button>
                  {p.phone ? (
                    <a className="btn btn-gold" href={waLink(p.phone)} target="_blank" rel="noreferrer" style={{ height: 40 }}>
                      <MessageCircle size={15} />
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={Boolean(selectedTeacher)}
        onClose={() => setSelectedTeacher(null)}
        title={selectedTeacher ? `Correspondance · ${selectedTeacher.name}` : "Messagerie"}
        subtitle={selectedTeacher?.subject ?? "Enseignant"}
      >
        <div className="grid gap-4">
          <div className="max-h-72 overflow-y-auto rounded-[2px] border border-[var(--line)] bg-[var(--paper)] p-3.5">
            {threadMessages.length === 0 ? (
              <p className="m-0 py-6 text-center text-sm text-[var(--muted)]">
                Aucun message échangé avec {selectedTeacher?.name} pour le moment.
              </p>
            ) : (
              <div className="grid gap-2.5">
                {threadMessages.map((m) => {
                  const mine = m.fromId === data.user.id;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-[2px] border px-3.5 py-2.5 ${
                        mine
                          ? "ml-6 border-[var(--ink)] bg-[var(--surface)]"
                          : "mr-6 border-[var(--line)] bg-[var(--paper-2)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{mine ? "Vous" : m.fromName}</span>
                        <span className="text-[11px] text-[var(--muted)]">{formatDateTime(m.createdAt)}</span>
                      </div>
                      <p className="m-0 mt-1 text-sm leading-relaxed">{m.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} className="grid gap-3">
            <Field label="Votre message">
              <textarea
                rows={3}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder={`Écrire à ${selectedTeacher?.name ?? "votre enseignant"}…`}
                required
              />
            </Field>
            <Button type="submit" disabled={sending || !msgText.trim()}>
              <Send size={15} /> {sending ? "Envoi…" : "Envoyer le message"}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export function SharedSchedule({
  data,
  onSelect,
  filter,
  onFilter,
  canEdit,
  onAdd,
}: {
  data: Bootstrap;
  onSelect?: (s: Bootstrap["schedules"][number]) => void;
  filter?: number | "all";
  onFilter?: (v: number | "all") => void;
  canEdit?: boolean;
  onAdd?: () => void;
}) {
  const slots = filter && filter !== "all" ? data.schedules.filter((s) => s.classId === filter) : data.schedules;
  return (
    <div className="stagger grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-tag">Semaine universitaire</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Emploi du temps</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onFilter ? (
            <select className="input" style={{ width: 200, height: 44 }} value={filter} onChange={(e) => onFilter(e.target.value === "all" ? "all" : Number(e.target.value))}>
              <option value="all">Toutes les classes</option>
              {data.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}
          {canEdit ? (
            <Button type="button" onClick={onAdd}>
              <CalendarDays size={16} />
              Nouveau créneau
            </Button>
          ) : null}
        </div>
      </header>
      <div className="editorial-card p-4">
        <ScheduleGrid slots={slots} onSelect={canEdit ? onSelect : undefined} />
      </div>
    </div>
  );
}

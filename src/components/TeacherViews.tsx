"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  NotebookPen,
  Plus,
  Pencil,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import type { Bootstrap, Course, Homework, Person } from "@/lib/types";
import { PERIODS } from "@/lib/types";
import { firstName, formatLongDate, greeting, isOngoing, jsDayToSchool } from "@/lib/utils";
import { Avatar, Button, Empty, Field } from "@/components/ui";
import { pigmentFor, TeacherCohortSpectrum, WeeklyRhythmStrip } from "@/components/EditorialCharts";
import { CourseReaderModal } from "@/components/StudentViews";

export function TeacherHome({
  data,
  onTab,
  onQuick,
}: {
  data: Bootstrap;
  onTab: (t: string) => void;
  onQuick: (name: string) => void;
}) {
  const day = jsDayToSchool(new Date().getDay());
  const todaySlots = data.schedules.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const pig = pigmentFor(data.user.subject);

  return (
    <div className="stagger grid gap-6">
      <div className="editorial-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-5">
          <div>
            <span className="kicker">Chaire de {data.user.subject} · Corps enseignant</span>
            <h1 className="serif mt-1.5 mb-0 text-[2.35rem] leading-none">
              {greeting()}, {firstName(data.user.name)}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => onQuick("course")}>
              <BookOpen size={16} /> Publier un cours
            </Button>
            <Button type="button" variant="ghost" onClick={() => onQuick("homework")}>
              <ClipboardList size={16} /> Créer un devoir
            </Button>
            <Button type="button" variant="ghost" onClick={() => onQuick("session")}>
              <NotebookPen size={16} /> Ajouter une séance
            </Button>
            <Button type="button" variant="ghost" onClick={() => onTab("notes")}>
              <GraduationCap size={16} /> Saisir des notes
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[var(--line)] bg-[var(--paper-2)] md:grid-cols-4">
          <div className="border-r border-b border-[var(--line)] px-5 py-4 md:border-b-0">
            <p className="kicker">Promotions suivies</p>
            <p className="metric m-0 text-[2.1rem] font-semibold text-[var(--ink)]">{data.classes.length}</p>
          </div>
          <div className="border-b border-[var(--line)] px-5 py-4 md:border-r md:border-b-0">
            <p className="kicker">Devoirs publiés</p>
            <p className="metric m-0 text-[2.1rem] font-semibold text-[var(--ink)]">{data.homeworks.length}</p>
          </div>
          <div className="border-r border-[var(--line)] px-5 py-4">
            <p className="kicker">Séances au cahier</p>
            <p className="metric m-0 text-[2.1rem] font-semibold text-[var(--ink)]">{data.sessions.length}</p>
          </div>
          <div className="px-5 py-4">
            <p className="kicker">Étudiants encadrés</p>
            <p className="metric m-0 text-[2.1rem] font-semibold text-[var(--ink)]">{data.people.length}</p>
          </div>
        </div>
      </div>

      {/* Cohort Spectrum Ruler */}
      <TeacherCohortSpectrum data={data} />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <section className="editorial-card p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="eyebrow-tag">Chaire · Aujourd&apos;hui</span>
              <h2 className="serif m-0 mt-0.5 text-xl">Cours programmés</h2>
            </div>
            <span className="mono-badge" style={{ borderColor: pig.main, color: pig.main }}>
              {data.user.subject}
            </span>
          </div>
          {todaySlots.length === 0 ? (
            <Empty title="Pas de créneau" text="Aucun cours n'est inscrit à votre nom aujourd'hui." />
          ) : (
            <div className="grid gap-2.5">
              {todaySlots.map((s) => (
                <div key={s.id} className="flex items-stretch overflow-hidden border border-[var(--line-strong)] bg-[var(--paper-2)]">
                  <div
                    className="flex w-16 shrink-0 flex-col justify-center px-2 py-2.5 text-center text-[#fcf8f1]"
                    style={{ background: pig.main }}
                  >
                    <span className="metric text-xs font-bold">{s.startTime}</span>
                    <span className="metric text-[10px] opacity-80">{s.endTime}</span>
                  </div>
                  <div className="min-w-0 flex-1 px-3.5 py-2.5">
                    <p className="m-0 font-semibold">
                      {s.subject} · {s.className}
                      {isOngoing(s.startTime, s.endTime) ? <span className="chip chip-ok ml-2">En cours</span> : null}
                    </p>
                    <p className="m-0 text-xs text-[var(--muted)]">
                      Salle {s.room} · {s.startTime}–{s.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <WeeklyRhythmStrip schedules={data.schedules} />
      </div>
    </div>
  );
}

export function TeacherClasses({
  data,
  onShowStudents,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
}: {
  data: Bootstrap;
  onShowStudents: (classId: number) => void;
  onAddCourse?: () => void;
  onEditCourse?: (course: Course) => void;
  onDeleteCourse?: (course: Course) => void;
}) {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  return (
    <div className="stagger grid gap-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Promotions &amp; Pédagogie</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Mes classes &amp; supports de cours</h1>
        </div>
        {onAddCourse ? (
          <Button type="button" onClick={onAddCourse}>
            <Plus size={16} /> Publier un support de cours
          </Button>
        ) : null}
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {data.classes.map((c) => (
          <article key={c.id} className="glass p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="serif m-0 text-2xl">{c.name}</h3>
                <p className="m-0 text-sm text-[var(--muted)]">Salle {c.room ?? "—"}</p>
              </div>
              <span className="chip">
                <Users size={13} /> {c.studentCount} étudiants
              </span>
            </div>
            <Button type="button" variant="ghost" className="mt-5" onClick={() => onShowStudents(c.id)}>
              <Users size={16} /> Voir les élèves
            </Button>
          </article>
        ))}
      </div>

      <section className="grid gap-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
          <h2 className="serif m-0 text-[1.65rem]">Supports de cours publiés ({data.courses.length})</h2>
        </div>
        {data.courses.length === 0 ? (
          <Empty title="Aucun support publié" text="Publiez un polycopié, une fiche de synthèse ou des annales pour vos classes." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.courses.map((course, idx) => {
              const pig = pigmentFor(course.subject, idx);
              return (
                <article
                  key={course.id}
                  className="editorial-card flex flex-col justify-between p-5"
                  style={{ borderLeft: `4px solid ${pig.main}` }}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="px-2 py-0.5 text-[11px] font-semibold text-[#fcf8f1]"
                        style={{ background: pig.main }}
                      >
                        {course.subject}
                      </span>
                      {course.className ? <span className="chip">{course.className}</span> : null}
                      {course.attachmentName ? <span className="mono-badge">{course.attachmentName}</span> : null}
                    </div>
                    <h3 className="serif mt-3 mb-1 text-2xl">{course.title}</h3>
                    <p className="m-0 text-sm text-[var(--muted)]">{course.description}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
                    <Button type="button" variant="ghost" onClick={() => setActiveCourse(course)}>
                      <BookOpen size={15} /> Ouvrir
                    </Button>
                    <div className="flex gap-2">
                      {onEditCourse ? (
                        <Button type="button" variant="ghost" onClick={() => onEditCourse(course)}>
                          <Pencil size={15} /> Modifier
                        </Button>
                      ) : null}
                      {onDeleteCourse ? (
                        <Button type="button" variant="danger" onClick={() => onDeleteCourse(course)}>
                          <Trash2 size={15} />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <CourseReaderModal course={activeCourse} onClose={() => setActiveCourse(null)} />
    </div>
  );
}

export function TeacherHomework({
  data,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: Bootstrap;
  onAdd: () => void;
  onEdit: (hw: Homework) => void;
  onDelete: (hw: Homework) => void;
}) {
  return (
    <div className="stagger grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Évaluations orales et écrites</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Devoirs</h1>
        </div>
        <Button type="button" onClick={onAdd}>
          <Plus size={16} /> Nouveau devoir
        </Button>
      </header>
      <div className="grid gap-3">
        {data.homeworks.map((h) => (
          <article key={h.id} className="glass flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
            <div className="flex-1">
              <span className="chip chip-gold">{h.className}</span>
              <h3 className="serif mt-2 mb-1 text-2xl">{h.title}</h3>
              <p className="m-0 text-sm text-[var(--muted)]">{h.description}</p>
              <p className="mt-2 mb-0 text-xs text-[var(--muted)]">Échéance {formatLongDate(h.dueDate)}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onEdit(h)}>
                <Pencil size={15} /> Modifier
              </Button>
              <Button type="button" variant="danger" onClick={() => onDelete(h)}>
                <Trash2 size={15} /> Supprimer
              </Button>
            </div>
          </article>
        ))}
        {data.homeworks.length === 0 ? <Empty title="Aucun devoir" text="Créez le premier devoir pour une de vos classes." /> : null}
      </div>
    </div>
  );
}

export function TeacherCahier({
  data,
  onAdd,
  onDelete,
}: {
  data: Bootstrap;
  onAdd: () => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="stagger grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Journal de bord</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Cahier de texte</h1>
        </div>
        <Button type="button" onClick={onAdd}>
          <Plus size={16} /> Nouvelle séance
        </Button>
      </header>
      <div className="grid gap-3">
        {data.sessions.map((s) => (
          <article key={s.id} className="glass p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <span className="chip chip-gold">{s.className}</span>
                <span className="chip">{s.subject}</span>
                <span className="chip">{formatLongDate(s.date)}</span>
              </div>
              <Button type="button" variant="danger" onClick={() => onDelete(s.id)}>
                <Trash2 size={15} /> Supprimer
              </Button>
            </div>
            <h3 className="serif mt-3 mb-1 text-2xl">{s.title}</h3>
            <p className="m-0 leading-7">{s.summary}</p>
            {s.workAssigned ? <p className="mt-3 mb-0 text-sm text-[var(--muted)]">Travail : {s.workAssigned}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function TeacherAbsences({
  data,
  onAdd,
}: {
  data: Bootstrap;
  onAdd: () => void;
}) {
  return (
    <div className="stagger grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Présence</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Absences et retards</h1>
        </div>
        <Button type="button" onClick={onAdd}>
          <Plus size={16} /> Signaler
        </Button>
      </header>
      <div className="glass overflow-hidden">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Classe</th>
                <th>Type</th>
                <th>Date</th>
                <th>Créneau</th>
                <th>Motif</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.absences.map((a) => (
                <tr key={a.id}>
                  <td>{a.studentName}</td>
                  <td>{a.className}</td>
                  <td className="capitalize">{a.type}</td>
                  <td>{formatLongDate(a.date)}</td>
                  <td>{a.timeSlot}</td>
                  <td>{a.reason ?? "—"}</td>
                  <td>{a.justified ? <span className="chip chip-ok">Justifiée</span> : <span className="chip chip-late">Non justifiée</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function TeacherGrades({
  data,
  onSave,
  toast,
}: {
  data: Bootstrap;
  onSave: (payload: {
    classId: number;
    period: string;
    evaluationTitle: string;
    coefficient: number;
    entries: Array<{ studentId: number; score: number | null | ""; comment?: string | null }>;
  }) => Promise<void>;
  toast: (msg: string, type?: "ok" | "err") => void;
}) {
  const [classId, setClassId] = useState<number>(data.classes[0]?.id ?? 0);
  const [period, setPeriod] = useState("Semestre 1");
  const [title, setTitle] = useState("");
  const [coef, setCoef] = useState(1);
  const [locked, setLocked] = useState(false);
  const [editing, setEditing] = useState(true);
  const [loadOpen, setLoadOpen] = useState(false);
  const [rows, setRows] = useState<Record<number, { score: string; comment: string }>>({});

  const students = useMemo(
    () => data.people.filter((p) => p.role === "student" && p.classId === classId),
    [data.people, classId],
  );

  const evaluations = useMemo(() => {
    const map = new Map<string, { title: string; period: string; coefficient: number }>();
    for (const g of data.grades.filter((g) => g.classId === classId && g.teacherId === data.user.id)) {
      map.set(`${g.period}|${g.evaluationTitle}`, {
        title: g.evaluationTitle,
        period: g.period,
        coefficient: g.coefficient,
      });
    }
    return [...map.values()];
  }, [data.grades, classId, data.user.id]);

  function loadEvaluation(ev: { title: string; period: string; coefficient: number }) {
    setTitle(ev.title);
    setPeriod(ev.period);
    setCoef(ev.coefficient);
    const next: Record<number, { score: string; comment: string }> = {};
    for (const s of students) {
      const g = data.grades.find(
        (x) => x.studentId === s.id && x.evaluationTitle === ev.title && x.period === ev.period && x.classId === classId,
      );
      next[s.id] = { score: g?.score != null ? String(g.score) : "", comment: g?.comment ?? "" };
    }
    setRows(next);
    setLocked(true);
    setEditing(false);
    setLoadOpen(false);
  }

  function enableGradeEditMode() {
    setEditing(true);
  }

  async function save() {
    if (!classId || !title) {
      toast("Indiquez la classe et le titre de l'évaluation.", "err");
      return;
    }
    await onSave({
      classId,
      period,
      evaluationTitle: title,
      coefficient: coef,
      entries: students.map((s) => ({
        studentId: s.id,
        score: rows[s.id]?.score === "" || rows[s.id]?.score == null ? "" : Number(rows[s.id]?.score),
        comment: rows[s.id]?.comment ?? "",
      })),
    });
    setLocked(true);
    setEditing(false);
  }

  const disabled = locked && !editing;

  return (
    <div className="stagger grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Bulletin</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Saisie des notes</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => setLoadOpen((v) => !v)}>
            <BookOpen size={16} /> Charger une évaluation
          </Button>
          {locked && !editing ? (
            <Button type="button" variant="ghost" onClick={enableGradeEditMode}>
              <Unlock size={16} /> Modifier
            </Button>
          ) : (
            <Button type="button" onClick={save}>
              <GraduationCap size={16} /> Enregistrer
            </Button>
          )}
        </div>
      </header>

      {locked ? (
        <div className="chip chip-ok w-fit">Notes enregistrées</div>
      ) : null}

      {loadOpen ? (
        <article className="glass p-5" id="modal-load-evaluation">
          <h3 className="serif mt-0 text-2xl">Évaluations précédentes</h3>
          <div className="mt-3 grid gap-2">
            {evaluations.map((ev) => (
              <button
                key={`${ev.period}-${ev.title}`}
                type="button"
                className="row px-4 py-3 text-left"
                onClick={() => loadEvaluation(ev)}
              >
                <strong>{ev.title}</strong>
                <span className="ml-2 text-sm text-[var(--muted)]">
                  {ev.period} · coef. {ev.coefficient}
                </span>
              </button>
            ))}
            {evaluations.length === 0 ? <p className="text-sm text-[var(--muted)]">Aucune évaluation saisie pour cette classe.</p> : null}
          </div>
        </article>
      ) : null}

      <div className="glass grid gap-4 p-5 md:grid-cols-4">
        <Field label="Classe">
          <select value={classId} onChange={(e) => { setClassId(Number(e.target.value)); setLocked(false); setEditing(true); setRows({}); }}>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Période">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} disabled={disabled}>
            {PERIODS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Titre de l'évaluation">
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={disabled} placeholder="Contrôle n°2" />
        </Field>
        <Field label="Coefficient">
          <input type="number" min={1} max={5} value={coef} onChange={(e) => setCoef(Number(e.target.value))} disabled={disabled} />
        </Field>
      </div>

      <div className="glass overflow-hidden">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Note /20</th>
                <th>Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: Person) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} src={s.avatarUrl} size={32} />
                      {s.name}
                    </div>
                  </td>
                  <td>
                    <input
                      className="input"
                      style={{ width: 90, height: 40 }}
                      disabled={disabled}
                      value={rows[s.id]?.score ?? ""}
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [s.id]: { score: e.target.value, comment: prev[s.id]?.comment ?? "" },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      style={{ height: 40 }}
                      disabled={disabled}
                      value={rows[s.id]?.comment ?? ""}
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [s.id]: { score: prev[s.id]?.score ?? "", comment: e.target.value },
                        }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Absence, Bootstrap, ClassRecord, Person } from "@/lib/types";
import { formatLongDate, greeting } from "@/lib/utils";
import { Avatar, Button, Field, Modal } from "@/components/ui";
import { AdminCampusCartography, WeeklyRhythmStrip } from "@/components/EditorialCharts";

export function AdminHome({
  data,
  onTab,
  onRefresh,
  toast,
}: {
  data: Bootstrap;
  onTab: (t: string) => void;
  onRefresh?: () => Promise<unknown>;
  toast?: (msg: string, type?: "ok" | "err") => void;
}) {
  const s = data.stats;
  const [openAnnModal, setOpenAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [savingAnn, setSavingAnn] = useState(false);

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setSavingAnn(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle.trim(), content: annContent.trim() }),
      });
      if (!res.ok) throw new Error("Impossible de publier l'annonce");
      setAnnTitle("");
      setAnnContent("");
      setOpenAnnModal(false);
      await onRefresh?.();
      toast?.("Circulaire officielle publiée et notifiée.");
    } catch (err) {
      toast?.(err instanceof Error ? err.message : "Erreur", "err");
    } finally {
      setSavingAnn(false);
    }
  }

  async function deleteAnnouncement(id: number) {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Erreur de suppression");
      await onRefresh?.();
      toast?.("Annonce supprimée.");
    } catch (err) {
      toast?.(err instanceof Error ? err.message : "Erreur", "err");
    }
  }
  return (
    <div className="stagger grid gap-6">
      <div className="editorial-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-5">
          <div>
            <span className="kicker">Rectorat &amp; Pilotage · Dakar</span>
            <h1 className="serif mt-1.5 mb-0 text-[2.35rem] leading-none">{greeting()}, Direction</h1>
            <p className="m-0 mt-1.5 text-sm text-[var(--muted)]">
              Cartographie synoptique des effectifs, des chaires et de la vie de campus.
            </p>
          </div>
          <span className="mono-badge">Année académique en cours</span>
        </div>

        <div className="grid grid-cols-2 border-t border-[var(--line)] bg-[var(--paper-2)] md:grid-cols-4">
          <button
            type="button"
            className="border-r border-b border-[var(--line)] bg-transparent px-5 py-4 text-left transition-colors hover:bg-[var(--surface)] md:border-b-0"
            onClick={() => onTab("eleves")}
          >
            <p className="kicker">Étudiants inscrits</p>
            <p className="metric m-0 text-[2.2rem] font-semibold text-[var(--ink)]">{s?.students ?? 0}</p>
            <p className="m-0 text-[11px] text-[var(--muted)]">Répartis sur {s?.classes ?? 0} promotions</p>
          </button>
          <button
            type="button"
            className="border-b border-[var(--line)] bg-transparent px-5 py-4 text-left transition-colors hover:bg-[var(--surface)] md:border-r md:border-b-0"
            onClick={() => onTab("enseignants")}
          >
            <p className="kicker">Corps professoral</p>
            <p className="metric m-0 text-[2.2rem] font-semibold text-[var(--ink)]">{s?.teachers ?? 0}</p>
            <p className="m-0 text-[11px] text-[var(--muted)]">Chaires &amp; départements</p>
          </button>
          <button
            type="button"
            className="border-r border-[var(--line)] bg-transparent px-5 py-4 text-left transition-colors hover:bg-[var(--surface)]"
            onClick={() => onTab("classes_admin")}
          >
            <p className="kicker">Promotions · Salles</p>
            <p className="metric m-0 text-[2.2rem] font-semibold text-[var(--ink)]">
              {s?.classes ?? 0}
              <span className="text-base font-normal text-[var(--muted)]">/{s?.rooms ?? 0}</span>
            </p>
            <p className="m-0 text-[11px] text-[var(--muted)]">Amphithéâtres &amp; labos</p>
          </button>
          <button
            type="button"
            className="bg-transparent px-5 py-4 text-left transition-colors hover:bg-[var(--surface)]"
            onClick={() => onTab("absences")}
          >
            <p className="kicker">Absences du jour</p>
            <p className="metric m-0 text-[2.2rem] font-semibold text-[var(--ink)]">{s?.absencesToday ?? 0}</p>
            <p className="m-0 text-[11px] text-[var(--muted)]">{s?.unjustified ?? 0} non justifiées</p>
          </button>
        </div>
      </div>

      {/* Bespoke Campus Cartography + Du Bois Rings */}
      <AdminCampusCartography data={data} onTab={onTab} />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <WeeklyRhythmStrip schedules={data.schedules} />

        <section className="editorial-card p-5">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="eyebrow-tag">Circulaires officielles</span>
              <h2 className="serif m-0 mt-0.5 text-xl">Annonces du rectorat</h2>
            </div>
            <Button type="button" variant="ghost" onClick={() => setOpenAnnModal(true)} style={{ height: 34, padding: "0 12px" }}>
              <Plus size={14} /> Publier
            </Button>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {data.announcements.map((a, idx) => {
              const colors = ["#8f2436", "#284b7a", "#26684e"];
              return (
                <div key={a.id} className="group flex items-start justify-between gap-2 py-3.5 first:pt-1 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: colors[idx % colors.length] }} />
                      <p className="m-0 font-semibold">{a.title}</p>
                    </div>
                    <p className="m-0 mt-1 pl-4 text-sm text-[var(--muted)]">{a.content}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon shrink-0 opacity-60 hover:opacity-100"
                    style={{ width: 28, height: 28 }}
                    onClick={() => deleteAnnouncement(a.id)}
                    title="Supprimer l'annonce"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Modal
        open={openAnnModal}
        onClose={() => setOpenAnnModal(false)}
        title="Publier une circulaire officielle"
        subtitle="Cette annonce sera visible par tous les étudiants et enseignants du campus."
      >
        <form onSubmit={createAnnouncement} className="grid gap-3">
          <Field label="Titre de la circulaire">
            <input
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Ex. Calendrier des examens semestriels"
              required
            />
          </Field>
          <Field label="Contenu de l'annonce">
            <textarea
              rows={4}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Détails officiels communiqués par le Rectorat…"
              required
            />
          </Field>
          <Button type="submit" disabled={savingAnn}>
            {savingAnn ? "Publication…" : "Diffuser l'annonce officielle"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export function AdminAbsences({
  data,
  onAdd,
  onJustify,
}: {
  data: Bootstrap;
  onAdd: () => void;
  onJustify: (a: Absence) => void;
}) {
  const slotLabel: Record<string, string> = { matin: "Matin", "apres-midi": "Après-midi", journee: "Journée" };
  return (
    <div className="stagger grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Vie universitaire</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Absences et retards</h1>
        </div>
        <Button type="button" onClick={onAdd}>
          <Plus size={16} /> Enregistrer
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.absences.map((a) => (
                <tr key={a.id}>
                  <td>{a.studentName}</td>
                  <td>{a.className}</td>
                  <td className="capitalize">{a.type}</td>
                  <td>{formatLongDate(a.date)}</td>
                  <td>{slotLabel[a.timeSlot] ?? a.timeSlot}</td>
                  <td>{a.reason ?? "—"}</td>
                  <td>{a.justified ? <span className="chip chip-ok">Justifiée</span> : <span className="chip chip-late">Non justifiée</span>}</td>
                  <td>
                    {!a.justified ? (
                      <Button type="button" variant="ghost" onClick={() => onJustify(a)}>
                        Justifier
                      </Button>
                    ) : null}
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

export function AdminStudents({
  data,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: Bootstrap;
  onAdd: () => void;
  onEdit: (p: Person) => void;
  onDelete: (p: Person) => void;
}) {
  const students = data.people.filter((p) => p.role === "student");
  return (
    <div className="stagger grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Effectifs</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Étudiants</h1>
        </div>
        <Button type="button" onClick={onAdd}>
          <Plus size={16} /> Inscrire
        </Button>
      </header>
      <div className="glass overflow-hidden">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Classe</th>
                <th>Adresse</th>
                <th>Inscription</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} src={p.avatarUrl} size={36} />
                      <div>
                        <p className="m-0 font-semibold">
                          {p.name}
                          {p.firstLogin ? (
                            <span className="chip chip-warn ml-2">1re connexion en attente</span>
                          ) : null}
                        </p>
                        <p className="m-0 text-xs text-[var(--muted)]">{p.email.split("@")[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td>{p.className ?? "—"}</td>
                  <td>{p.email}</td>
                  <td>{new Intl.DateTimeFormat("fr-FR").format(new Date(p.createdAt))}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => onEdit(p)}>
                        <Pencil size={14} /> Modifier
                      </Button>
                      <Button type="button" variant="danger" onClick={() => onDelete(p)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
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

export function AdminTeachers({
  data,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: Bootstrap;
  onAdd: () => void;
  onEdit: (p: Person) => void;
  onDelete: (p: Person) => void;
}) {
  const teachers = data.people.filter((p) => p.role === "teacher");
  return (
    <div className="stagger grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Corps professoral</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Enseignants</h1>
        </div>
        <Button type="button" onClick={onAdd}>
          <Plus size={16} /> Ajouter
        </Button>
      </header>
      <div className="grid gap-3">
        {teachers.map((p) => (
          <article key={p.id} className="glass flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
            <Avatar name={p.name} src={p.avatarUrl} size={52} />
            <div className="flex-1">
              <h3 className="serif m-0 text-2xl">
                {p.name}
                {p.firstLogin ? (
                  <span className="chip chip-warn ml-2 align-middle">1re connexion en attente</span>
                ) : null}
              </h3>
              <p className="m-0 text-sm text-[var(--muted)]">
                {p.subject} · {p.email}
                {p.phone ? ` · ${p.phone}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.classNames.map((n) => (
                  <span key={n} className="chip">
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onEdit(p)}>
                <Pencil size={15} /> Modifier
              </Button>
              <Button type="button" variant="danger" onClick={() => onDelete(p)}>
                <Trash2 size={15} /> Supprimer
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AdminClasses({
  data,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: Bootstrap;
  onAdd: () => void;
  onEdit: (c: ClassRecord) => void;
  onDelete: (c: ClassRecord) => void;
}) {
  return (
    <div className="stagger grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Structure</p>
          <h1 className="serif mt-1 mb-0 text-[2.1rem]">Classes</h1>
        </div>
        <Button type="button" onClick={onAdd}>
          <Plus size={16} /> Créer une classe
        </Button>
      </header>
      <div className="glass overflow-hidden">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Classe</th>
                <th>Professeur principal</th>
                <th>Effectif</th>
                <th>Salle</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.classes.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold">{c.name}</td>
                  <td>{c.principalName ?? "—"}</td>
                  <td>{c.studentCount}</td>
                  <td>{c.room ?? "—"}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => onEdit(c)}>
                        <Pencil size={14} /> Modifier
                      </Button>
                      <Button type="button" variant="danger" onClick={() => onDelete(c)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Logo, SplashLoader } from "@/components/Logo";
import { Avatar, Button, Field, Modal, Toast } from "@/components/ui";
import { SharedSchedule, StudentCahier, StudentClasses, StudentGrades, StudentHome, StudentHomework, StudentTeachers } from "@/components/StudentViews";
import { TeacherAbsences, TeacherCahier, TeacherClasses, TeacherGrades, TeacherHome, TeacherHomework } from "@/components/TeacherViews";
import { AdminAbsences, AdminClasses, AdminHome, AdminStudents, AdminTeachers } from "@/components/AdminViews";
import { applyUserPrefs, loadUserPrefs, SettingsView } from "@/components/SettingsView";
import type { Absence, Bootstrap, ClassRecord, Course, Homework, Person, ScheduleSlot, SessionUser } from "@/lib/types";
import { DAYS, SUBJECT_COLORS, TIME_SLOTS } from "@/lib/types";
import { api, firstName, formatDateTime } from "@/lib/utils";

type NavItem = { id: string; label: string; icon: typeof LayoutDashboard };

const STUDENT_NAV: NavItem[] = [
  { id: "home", label: "Accueil", icon: LayoutDashboard },
  { id: "schedule", label: "Emploi du temps", icon: CalendarDays },
  { id: "classes", label: "Cours", icon: BookOpen },
  { id: "devoirs", label: "Devoirs", icon: ClipboardList },
  { id: "notes", label: "Notes", icon: GraduationCap },
  { id: "cahier", label: "Cahier", icon: NotebookPen },
  { id: "messages", label: "Professeurs", icon: Users },
  { id: "settings", label: "Paramètres", icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { id: "home", label: "Accueil", icon: LayoutDashboard },
  { id: "schedule", label: "Emploi du temps", icon: CalendarDays },
  { id: "classes", label: "Mes classes", icon: Building2 },
  { id: "devoirs", label: "Devoirs", icon: ClipboardList },
  { id: "notes", label: "Notes", icon: GraduationCap },
  { id: "cahier", label: "Cahier", icon: NotebookPen },
  { id: "absences", label: "Absences", icon: UserRound },
  { id: "settings", label: "Paramètres", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { id: "home", label: "Accueil", icon: LayoutDashboard },
  { id: "absences", label: "Absences", icon: UserRound },
  { id: "schedule", label: "Planning", icon: CalendarDays },
  { id: "eleves", label: "Étudiants", icon: GraduationCap },
  { id: "enseignants", label: "Enseignants", icon: Users },
  { id: "classes_admin", label: "Classes", icon: Building2 },
  { id: "settings", label: "Paramètres", icon: Settings },
];

type ModalName =
  | "schedule"
  | "homework"
  | "edit-homework"
  | "course"
  | "edit-course"
  | "session"
  | "absence"
  | "justify"
  | "students"
  | "user"
  | "edit-user"
  | "class"
  | "edit-class"
  | "confirm"
  | null;

export function DashboardApp({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [splash, setSplash] = useState(true);
  const [splashMinDone, setSplashMinDone] = useState(false);
  const [data, setData] = useState<Bootstrap | null>(null);
  const [tab, setTab] = useState("home");
  const [sidebar, setSidebar] = useState(false);
  const [notif, setNotif] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: "ok" | "err" } | null>(null);
  const [modal, setModal] = useState<ModalName>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [firstLogin, setFirstLogin] = useState(user.firstLogin);
  const [newPass, setNewPass] = useState("");
  const [confirmFirstPass, setConfirmFirstPass] = useState("");
  const [classFilter, setClassFilter] = useState<number | "all">("all");
  const [busy, setBusy] = useState(false);

  const nav = user.role === "admin" ? ADMIN_NAV : user.role === "teacher" ? TEACHER_NAV : STUDENT_NAV;

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const refresh = useCallback(async () => {
    const boot = await api<Bootstrap>("/api/bootstrap");
    setData(boot);
    return boot;
  }, []);

  useEffect(() => {
    applyUserPrefs(loadUserPrefs());
    refresh().catch(() => showToast("Chargement impossible.", "err"));
    const t = setTimeout(() => setSplashMinDone(true), 1350);
    return () => clearTimeout(t);
  }, [refresh, showToast]);

  useEffect(() => {
    if (!splashMinDone || !data) return;
    const t = setTimeout(() => setSplash(false), 280);
    return () => clearTimeout(t);
  }, [splashMinDone, data]);

  useEffect(() => {
    if (user.role !== "student" || !data) return;
    const key = `soukoul-hw-${user.id}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(data.homeworks.filter((h) => h.completed).map((h) => h.id)));
    }
  }, [data, user.id, user.role]);

  async function logout() {
    await api("/api/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  async function forcePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 6) return showToast("Au moins 6 caractères.", "err");
    if (newPass !== confirmFirstPass) return showToast("Les deux mots de passe ne correspondent pas.", "err");
    await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "force-password", password: newPass }) });
    setFirstLogin(false);
    showToast("Mot de passe personnel enregistré.");
  }

  async function toggleHomework(hw: Homework, completed: boolean) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            homeworks: prev.homeworks.map((item) =>
              item.id === hw.id ? { ...item, completed } : item,
            ),
          }
        : prev,
    );
    const key = `soukoul-hw-${user.id}`;
    const current = new Set<number>(JSON.parse(localStorage.getItem(key) || "[]"));
    if (completed) current.add(hw.id);
    else current.delete(hw.id);
    localStorage.setItem(key, JSON.stringify([...current]));
    await api("/api/homeworks", {
      method: "POST",
      body: JSON.stringify({ action: "complete", homeworkId: hw.id, completed }),
    });
    await refresh();
  }

  async function markNotifsRead() {
    await api("/api/notifications", { method: "PATCH" });
    await refresh();
  }

  const unread = data?.notifications.filter((n) => !n.read).length ?? 0;

  function openModal(name: ModalName, value?: unknown) {
    setPayload(value ?? null);
    setModal(name);
  }

  const content = useMemo(() => {
    if (!data) return null;
    if (tab === "settings") {
      return (
        <SettingsView
          data={data}
          onUpdated={async () => {
            await refresh();
          }}
          toast={showToast}
        />
      );
    }
    if (user.role === "student") {
      if (tab === "home") return <StudentHome data={data} onTab={setTab} onToggle={toggleHomework} />;
      if (tab === "schedule") return <SharedSchedule data={data} />;
      if (tab === "classes") return <StudentClasses data={data} />;
      if (tab === "devoirs") return <StudentHomework data={data} onToggle={toggleHomework} />;
      if (tab === "notes") return <StudentGrades data={data} />;
      if (tab === "cahier") return <StudentCahier data={data} />;
      if (tab === "messages") return <StudentTeachers data={data} onRefresh={refresh} toast={showToast} />;
    }
    if (user.role === "teacher") {
      if (tab === "home")
        return (
          <TeacherHome
            data={data}
            onTab={setTab}
            onQuick={(n) => openModal(n === "homework" ? "homework" : n === "course" ? "course" : "session")}
          />
        );
      if (tab === "schedule")
        return (
          <SharedSchedule
            data={data}
            canEdit
            onAdd={() => openModal("schedule")}
            onSelect={(s) => openModal("confirm", { kind: "schedule", slot: s })}
          />
        );
      if (tab === "classes")
        return (
          <TeacherClasses
            data={data}
            onShowStudents={(id) => openModal("students", id)}
            onAddCourse={() => openModal("course")}
            onEditCourse={(c) => openModal("edit-course", c)}
            onDeleteCourse={(c) => openModal("confirm", { kind: "course", course: c })}
          />
        );
      if (tab === "devoirs")
        return (
          <TeacherHomework
            data={data}
            onAdd={() => openModal("homework")}
            onEdit={(hw) => openModal("edit-homework", hw)}
            onDelete={(hw) => openModal("confirm", { kind: "homework", hw })}
          />
        );
      if (tab === "notes")
        return (
          <TeacherGrades
            data={data}
            toast={showToast}
            onSave={async (payload) => {
              await api("/api/grades", { method: "POST", body: JSON.stringify(payload) });
              await refresh();
              showToast("Notes enregistrées.");
            }}
          />
        );
      if (tab === "cahier")
        return (
          <TeacherCahier
            data={data}
            onAdd={() => openModal("session")}
            onDelete={(id) => openModal("confirm", { kind: "session", id })}
          />
        );
      if (tab === "absences") return <TeacherAbsences data={data} onAdd={() => openModal("absence")} />;
    }
    if (user.role === "admin") {
      if (tab === "home") return <AdminHome data={data} onTab={setTab} onRefresh={refresh} toast={showToast} />;
      if (tab === "absences")
        return <AdminAbsences data={data} onAdd={() => openModal("absence")} onJustify={(a) => openModal("justify", a)} />;
      if (tab === "schedule")
        return (
          <SharedSchedule
            data={data}
            canEdit
            filter={classFilter}
            onFilter={setClassFilter}
            onAdd={() => openModal("schedule")}
            onSelect={(s) => openModal("confirm", { kind: "schedule", slot: s })}
          />
        );
      if (tab === "eleves")
        return (
          <AdminStudents
            data={data}
            onAdd={() => openModal("user", "student")}
            onEdit={(p) => openModal("edit-user", p)}
            onDelete={(p) => openModal("confirm", { kind: "user", person: p })}
          />
        );
      if (tab === "enseignants")
        return (
          <AdminTeachers
            data={data}
            onAdd={() => openModal("user", "teacher")}
            onEdit={(p) => openModal("edit-user", p)}
            onDelete={(p) => openModal("confirm", { kind: "user", person: p })}
          />
        );
      if (tab === "classes_admin")
        return (
          <AdminClasses
            data={data}
            onAdd={() => openModal("class")}
            onEdit={(c) => openModal("edit-class", c)}
            onDelete={(c) => openModal("confirm", { kind: "class", cls: c })}
          />
        );
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tab, user.role, classFilter]);

  const classStudents = data?.people.filter((p) => p.role === "student" && p.classId === payload) ?? [];

  return (
    <div className="min-h-screen">
      {splash || !data ? (
        <SplashLoader
          exiting={Boolean(splashMinDone && data)}
          subtitle={
            user.role === "admin"
              ? "Ouverture du Rectorat & de la cartographie…"
              : user.role === "teacher"
                ? "Chargement des chaires & cahiers de cours…"
                : "Préparation de votre carnet d'études…"
          }
        />
      ) : null}

      <div className="flex min-h-screen">
        {sidebar ? <div className="overlay lg:hidden" onClick={() => setSidebar(false)} /> : null}
        <aside
          className={`shell-aside fixed inset-y-0 left-0 z-[75] flex w-[232px] flex-col px-3 py-5 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <div className="mb-8 flex items-center gap-3 px-2">
            <Logo size={32} light />
            <div>
              <p className="serif m-0 text-[18px] leading-none text-[var(--sidebar-text)]">Soukoul</p>
              <p className="m-0 text-[11px] text-[rgba(235,228,214,0.55)]">Université</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-btn ${tab === item.id ? "active" : ""}`}
                  onClick={() => {
                    setTab(item.id);
                    setSidebar(false);
                  }}
                >
                  <span className="nav-ico">
                    <Icon size={16} strokeWidth={1.6} />
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="row mt-4 p-3">
            <button
              type="button"
              onClick={() => {
                setTab("settings");
                setSidebar(false);
              }}
              className="flex w-full items-center gap-3 border-0 bg-transparent p-0 text-left text-inherit"
              title="Ouvrir les paramètres du profil"
            >
              <Avatar name={data?.user.name ?? user.name} src={data?.user.avatarUrl ?? user.avatarUrl} size={32} />
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-medium">{data?.user.name ?? user.name}</p>
                <p className="m-0 truncate text-xs text-[rgba(235,228,214,0.55)]">
                  {user.role === "student" ? user.className : (data?.user.subject ?? user.subject ?? "Direction")}
                </p>
              </div>
            </button>
            <Button type="button" variant="ghost" className="mt-3 w-full" onClick={logout}>
              <LogOut size={15} /> Déconnexion
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="topbar sticky top-0 z-40 flex items-center justify-between gap-3 px-5 py-3 lg:px-10">
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-ghost btn-icon lg:hidden" onClick={() => setSidebar(true)} aria-label="Menu">
                <Menu size={18} />
              </button>
              <p className="m-0 hidden text-sm text-[var(--muted)] sm:block">
                {user.role === "admin" ? "Direction" : user.role === "teacher" ? "Enseignement" : user.className}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTab("settings")}
                className="flex items-center gap-2 border-0 bg-transparent p-0 text-inherit cursor-pointer"
                title="Paramètres & Profil"
              >
                <Avatar name={data?.user.name ?? user.name} src={data?.user.avatarUrl ?? user.avatarUrl} size={28} />
                <span className="hidden text-sm sm:inline">{firstName(data?.user.name ?? user.name)}</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon relative"
                onClick={() => {
                  setNotif((v) => !v);
                  if (!notif) markNotifsRead().catch(() => undefined);
                }}
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={1.6} />
                {unread > 0 ? <span id="notif-dot" className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> : null}
              </button>
            </div>
          </header>

          <main className="flex-1 px-5 py-8 lg:px-10">{content}</main>
        </div>
      </div>

      {notif && data ? (
        <div className="overlay" onClick={() => setNotif(false)}>
          <aside
            className="glass-strong absolute top-0 right-0 h-full w-[min(400px,100%)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="serif m-0 text-2xl">Notifications</h2>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setNotif(false)}>
                <X size={16} />
              </button>
            </div>
            <button
              type="button"
              className="btn btn-ghost mb-4 w-full"
              onClick={async () => {
                if (!("Notification" in window)) return showToast("Notifications non disponibles.", "err");
                const perm = await Notification.requestPermission();
                if (perm !== "granted") return showToast("Permission refusée.", "err");
                showToast("Notifications activées.");
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg?.pushManager) {
                  try {
                    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: undefined });
                    const json = sub.toJSON();
                    await api("/api/notifications", {
                      method: "POST",
                      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
                    });
                  } catch {
                    /* VAPID optionnel en démonstration */
                  }
                }
              }}
            >
              Activer les notifications
            </button>
            <div className="grid gap-2">
              {data.notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="row px-4 py-3 text-left"
                  onClick={() => {
                    if (n.tab) setTab(n.tab);
                    setNotif(false);
                  }}
                >
                  <p className="m-0 font-semibold">{n.title}</p>
                  <p className="m-0 text-xs text-[var(--muted)]">{n.body}</p>
                  <p className="m-0 mt-1 text-[11px] text-[var(--muted)]">{formatDateTime(n.createdAt)}</p>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <Modal open={firstLogin} title="Première connexion" subtitle="Bienvenue ! Pour activer votre compte, choisissez votre propre mot de passe personnel (au moins 6 caractères).">
        <form onSubmit={forcePassword} className="grid gap-4" id="modal-force-password">
          <Field label="Nouveau mot de passe personnel">
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} minLength={6} required />
          </Field>
          <Field label="Confirmer le mot de passe">
            <input type="password" value={confirmFirstPass} onChange={(e) => setConfirmFirstPass(e.target.value)} minLength={6} required />
          </Field>
          <Button type="submit">Enregistrer mon mot de passe et continuer</Button>
        </form>
      </Modal>

      {data ? (
        <>
          <ScheduleModal
            open={modal === "schedule"}
            data={data}
            role={user.role}
            onClose={() => setModal(null)}
            busy={busy}
            onSubmit={async (body) => {
              setBusy(true);
              try {
                await api("/api/schedule", { method: "POST", body: JSON.stringify(body) });
                await refresh();
                setModal(null);
                showToast("Créneau ajouté.");
              } catch (e) {
                showToast(e instanceof Error ? e.message : "Erreur", "err");
              } finally {
                setBusy(false);
              }
            }}
          />
          <HomeworkModal
            open={modal === "homework" || modal === "edit-homework"}
            data={data}
            homework={modal === "edit-homework" ? (payload as Homework) : null}
            onClose={() => setModal(null)}
            onSubmit={async (body) => {
              await api("/api/homeworks", { method: "POST", body: JSON.stringify(body) });
              await refresh();
              setModal(null);
              showToast("Devoir enregistré.");
            }}
          />
          <SessionModal
            open={modal === "session"}
            data={data}
            onClose={() => setModal(null)}
            onSubmit={async (body) => {
              await api("/api/cahier", { method: "POST", body: JSON.stringify(body) });
              await refresh();
              setModal(null);
              showToast("Séance ajoutée.");
            }}
          />
          <AbsenceModal
            open={modal === "absence"}
            data={data}
            onClose={() => setModal(null)}
            onSubmit={async (body) => {
              await api("/api/admin/absences", { method: "POST", body: JSON.stringify(body) });
              await refresh();
              setModal(null);
              showToast("Signalement enregistré.");
            }}
          />
          <JustifyModal
            open={modal === "justify"}
            absence={payload as Absence | null}
            onClose={() => setModal(null)}
            onSubmit={async (reason) => {
              const a = payload as Absence;
              await api("/api/admin/absences", { method: "POST", body: JSON.stringify({ action: "justify", id: a.id, reason }) });
              await refresh();
              setModal(null);
              showToast("Absence justifiée.");
            }}
          />
          <ClassStudentsModal
            open={modal === "students"}
            students={classStudents}
            data={data}
            onClose={() => setModal(null)}
            onSent={async (studentName) => {
              await refresh();
              showToast(`Message envoyé à ${studentName}.`);
            }}
            toast={showToast}
          />
          <UserModal
            open={modal === "user" || modal === "edit-user"}
            data={data}
            role={(modal === "user" ? (payload as "student" | "teacher") : (payload as Person | null)?.role) as "student" | "teacher"}
            person={modal === "edit-user" ? (payload as Person) : null}
            onClose={() => setModal(null)}
            onSubmit={async (body) => {
              await api("/api/admin/users", { method: "POST", body: JSON.stringify(body) });
              await refresh();
              setModal(null);
              showToast("Compte enregistré.");
            }}
          />
          <ClassModal
            open={modal === "class" || modal === "edit-class"}
            data={data}
            cls={modal === "edit-class" ? (payload as ClassRecord) : null}
            onClose={() => setModal(null)}
            onSubmit={async (body) => {
              await api("/api/admin/classes", { method: "POST", body: JSON.stringify(body) });
              await refresh();
              setModal(null);
              showToast("Classe enregistrée.");
            }}
          />
          <CourseModal
            open={modal === "course" || modal === "edit-course"}
            data={data}
            course={modal === "edit-course" ? (payload as Course) : null}
            onClose={() => setModal(null)}
            onSubmit={async (body) => {
              await api("/api/courses", { method: "POST", body: JSON.stringify(body) });
              await refresh();
              setModal(null);
              showToast("Support de cours publié.");
            }}
          />
          <ConfirmModal
            open={modal === "confirm"}
            payload={payload}
            onClose={() => setModal(null)}
            onConfirm={async () => {
              const p = payload as { kind: string; slot?: ScheduleSlot; hw?: Homework; course?: Course; id?: number; person?: Person; cls?: ClassRecord };
              if (p.kind === "schedule" && p.slot) await api("/api/schedule", { method: "DELETE", body: JSON.stringify({ id: p.slot.id }) });
              if (p.kind === "homework" && p.hw) await api("/api/homeworks", { method: "DELETE", body: JSON.stringify({ id: p.hw.id }) });
              if (p.kind === "course" && p.course) await api("/api/courses", { method: "DELETE", body: JSON.stringify({ id: p.course.id }) });
              if (p.kind === "session" && p.id) await api("/api/cahier", { method: "DELETE", body: JSON.stringify({ id: p.id }) });
              if (p.kind === "user" && p.person) await api("/api/admin/users", { method: "DELETE", body: JSON.stringify({ id: p.person.id }) });
              if (p.kind === "class" && p.cls) await api("/api/admin/classes", { method: "DELETE", body: JSON.stringify({ id: p.cls.id }) });
              await refresh();
              setModal(null);
              showToast("Élément supprimé.");
            }}
          />
        </>
      ) : null}

      <Toast message={toast?.msg ?? null} type={toast?.type} />
    </div>
  );
}

function ScheduleModal({
  open,
  data,
  role,
  onClose,
  onSubmit,
  busy,
}: {
  open: boolean;
  data: Bootstrap;
  role: string;
  onClose: () => void;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [classId, setClassId] = useState(data.classes[0]?.id ?? 0);
  const [teacherId, setTeacherId] = useState(data.people.find((p) => p.role === "teacher")?.id ?? 0);
  const [subject, setSubject] = useState(data.user.subject ?? "Mathématiques");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[data.user.subject ?? ""] || "#3d5a80");
  const teachers = data.people.filter((p) => p.role === "teacher");

  return (
    <Modal open={open} title="Nouveau créneau" subtitle="Ajoutez un horaire à l'emploi du temps." onClose={onClose}>
      <form
        id="modal-add-schedule"
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ classId, teacherId, subject, dayOfWeek, startTime, endTime, room, color });
        }}
      >
        <Field label="Classe">
          <select value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        {role === "admin" ? (
          <Field label="Enseignant">
            <select value={teacherId} onChange={(e) => setTeacherId(Number(e.target.value))}>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.subject}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="Matière">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jour">
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {DAYS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Salle">
            <input value={room} onChange={(e) => setRoom(e.target.value)} />
          </Field>
          <Field label="Début">
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="Fin">
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>
        <Field label="Couleur">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
        <Button type="submit" disabled={busy}>
          <CalendarDays size={16} /> Enregistrer le créneau
        </Button>
      </form>
    </Modal>
  );
}

function HomeworkModal({
  open,
  data,
  homework,
  onClose,
  onSubmit,
}: {
  open: boolean;
  data: Bootstrap;
  homework: Homework | null;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState(homework?.title ?? "");
  const [description, setDescription] = useState(homework?.description ?? "");
  const [classId, setClassId] = useState(homework?.classId ?? data.classes[0]?.id ?? 0);
  const [dueDate, setDueDate] = useState(homework?.dueDate ?? "");
  useEffect(() => {
    setTitle(homework?.title ?? "");
    setDescription(homework?.description ?? "");
    setClassId(homework?.classId ?? data.classes[0]?.id ?? 0);
    setDueDate(homework?.dueDate ?? "");
  }, [homework, data.classes, open]);
  return (
    <Modal open={open} title={homework ? "Modifier le devoir" : "Nouveau devoir"} onClose={onClose}>
      <form
        id={homework ? "modal-edit-homework" : "modal-add-homework"}
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            action: homework ? "update" : "create",
            id: homework?.id,
            title,
            description,
            classId,
            dueDate,
          });
        }}
      >
        <Field label="Titre">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Classe">
          <select value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date limite">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </Field>
        <Button type="submit">
          <ClipboardList size={16} /> Enregistrer
        </Button>
      </form>
    </Modal>
  );
}

function SessionModal({
  open,
  data,
  onClose,
  onSubmit,
}: {
  open: boolean;
  data: Bootstrap;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [classId, setClassId] = useState(data.classes[0]?.id ?? 0);
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [workAssigned, setWorkAssigned] = useState("");
  return (
    <Modal open={open} title="Nouvelle séance" onClose={onClose}>
      <form
        id="modal-add-session"
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ classId, date, title, summary, workAssigned });
        }}
      >
        <Field label="Classe">
          <select value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Titre">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Résumé de la séance">
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
        </Field>
        <Field label="Travail à faire">
          <textarea value={workAssigned} onChange={(e) => setWorkAssigned(e.target.value)} />
        </Field>
        <Button type="submit">
          <NotebookPen size={16} /> Publier la séance
        </Button>
      </form>
    </Modal>
  );
}

function AbsenceModal({
  open,
  data,
  onClose,
  onSubmit,
}: {
  open: boolean;
  data: Bootstrap;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [classId, setClassId] = useState(data.classes[0]?.id ?? 0);
  const students = data.people.filter((p) => p.role === "student" && p.classId === classId);
  const [studentId, setStudentId] = useState(students[0]?.id ?? 0);
  const [type, setType] = useState<"absence" | "retard">("absence");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("matin");
  const [reason, setReason] = useState("");
  const [justified, setJustified] = useState(false);
  useEffect(() => {
    const list = data.people.filter((p) => p.role === "student" && p.classId === classId);
    setStudentId(list[0]?.id ?? 0);
  }, [classId, data.people]);
  return (
    <Modal open={open} title="Signaler une absence" onClose={onClose}>
      <form
        id="modal-add-absence"
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ classId, studentId, type, date, timeSlot, reason, justified });
        }}
      >
        <Field label="Classe">
          <select value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Étudiant">
          <select value={studentId} onChange={(e) => setStudentId(Number(e.target.value))}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as "absence" | "retard")}>
              <option value="absence">Absence</option>
              <option value="retard">Retard</option>
            </select>
          </Field>
          <Field label="Créneau">
            <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
              {TIME_SLOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Motif">
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={justified} onChange={(e) => setJustified(e.target.checked)} />
          Déjà justifiée
        </label>
        <Button type="submit">Enregistrer le signalement</Button>
      </form>
    </Modal>
  );
}

function JustifyModal({
  open,
  absence,
  onClose,
  onSubmit,
}: {
  open: boolean;
  absence: Absence | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal open={open} title="Justifier l'absence" subtitle={absence?.studentName} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(reason);
        }}
      >
        <Field label="Motif ou justificatif">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
        </Field>
        <Button type="submit">Justifier</Button>
      </form>
    </Modal>
  );
}

function UserModal({
  open,
  data,
  role,
  person,
  onClose,
  onSubmit,
}: {
  open: boolean;
  data: Bootstrap;
  role: "student" | "teacher";
  person: Person | null;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const r = person?.role === "teacher" ? "teacher" : person?.role === "student" ? "student" : role;
  const [name, setName] = useState(person?.name ?? "");
  const [email, setEmail] = useState(person?.email ?? "");
  const [password, setPassword] = useState("");
  const [classId, setClassId] = useState(person?.classId ?? data.classes[0]?.id ?? 0);
  const [classIds, setClassIds] = useState<number[]>(person?.classIds ?? []);
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [subject, setSubject] = useState(person?.subject ?? "");
  useEffect(() => {
    setName(person?.name ?? "");
    setEmail(person?.email ?? "");
    setPassword("");
    setClassId(person?.classId ?? data.classes[0]?.id ?? 0);
    setClassIds(person?.classIds ?? []);
    setPhone(person?.phone ?? "");
    setSubject(person?.subject ?? "");
  }, [person, open, data.classes]);
  return (
    <Modal
      open={open}
      title={person ? "Modifier le compte" : r === "teacher" ? "Nouvel enseignant" : "Nouvel étudiant"}
      onClose={onClose}
    >
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: person?.id,
            role: r,
            name,
            email,
            password: person ? undefined : password,
            resetPassword: person ? password || undefined : undefined,
            classId: r === "student" ? classId : null,
            classIds: r === "teacher" ? classIds : undefined,
            phone,
            subject,
          });
        }}
      >
        <Field label="Nom">
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Identifiant ou e-mail">
          <input value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={r === "student" ? "prenom.nom" : "p.nom"} />
        </Field>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)]">
              {person ? "Réinitialiser le mot de passe provisoire (optionnel)" : "Mot de passe provisoire remis à l'utilisateur"}
            </span>
            <button
              type="button"
              onClick={() => setPassword(`Soukoul${Math.floor(100 + Math.random() * 900)}`)}
              className="border-0 bg-transparent p-0 text-xs font-semibold text-[var(--gold)] hover:underline"
            >
              Générer un code provisoire
            </button>
          </div>
          <input
            type="text"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={person ? "Laisser vide pour ne pas changer" : "Ex. welcome1"}
            minLength={person ? undefined : 6}
            required={!person}
          />
          <p className="m-0 text-[11px] text-[var(--muted)]">
            À sa première connexion avec ce code, {r === "teacher" ? "l'enseignant" : "l'étudiant"} devra obligatoirement définir son propre mot de passe personnel.
          </p>
        </div>
        {r === "student" ? (
          <Field label="Classe">
            <select value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
              {data.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <>
            <Field label="Matière">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <Field label="Téléphone WhatsApp">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+22177..." />
            </Field>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Classes attribuées</p>
              <div className="grid gap-2">
                {data.classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={classIds.includes(c.id)}
                      onChange={(e) =>
                        setClassIds((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
                      }
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
        <Button type="submit">{person ? "Enregistrer" : "Créer le compte"}</Button>
      </form>
    </Modal>
  );
}

function ClassModal({
  open,
  data,
  cls,
  onClose,
  onSubmit,
}: {
  open: boolean;
  data: Bootstrap;
  cls: ClassRecord | null;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(cls?.name ?? "");
  const [room, setRoom] = useState(cls?.room ?? "");
  const [principalTeacherId, setPrincipal] = useState<number | "">(cls?.principalTeacherId ?? "");
  useEffect(() => {
    setName(cls?.name ?? "");
    setRoom(cls?.room ?? "");
    setPrincipal(cls?.principalTeacherId ?? "");
  }, [cls, open]);
  const teachers = data.people.filter((p) => p.role === "teacher");
  return (
    <Modal open={open} title={cls ? "Modifier la classe" : "Nouvelle classe"} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: cls?.id,
            name,
            room,
            principalTeacherId: principalTeacherId === "" ? null : Number(principalTeacherId),
          });
        }}
      >
        <Field label="Nom">
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Salle">
          <input value={room} onChange={(e) => setRoom(e.target.value)} />
        </Field>
        <Field label="Professeur principal">
          <select value={principalTeacherId} onChange={(e) => setPrincipal(e.target.value === "" ? "" : Number(e.target.value))}>
            <option value="">Aucun</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit">Enregistrer</Button>
      </form>
    </Modal>
  );
}

function ConfirmModal({
  open,
  payload,
  onClose,
  onConfirm,
}: {
  open: boolean;
  payload: unknown;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Modal open={open} title="Confirmer la suppression" subtitle="Cette action est définitive." onClose={onClose}>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm}>
          Supprimer
        </Button>
      </div>
    </Modal>
  );
}

function CourseModal({
  open,
  data,
  course,
  onClose,
  onSubmit,
}: {
  open: boolean;
  data: Bootstrap;
  course: Course | null;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [classId, setClassId] = useState(course?.classId ?? data.classes[0]?.id ?? 0);
  const [subject, setSubject] = useState(course?.subject ?? data.user.subject ?? "Mathématiques");
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [content, setContent] = useState(course?.content ?? "");
  const [attachmentName, setAttachmentName] = useState(course?.attachmentName ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(course?.attachmentUrl ?? "");

  useEffect(() => {
    setClassId(course?.classId ?? data.classes[0]?.id ?? 0);
    setSubject(course?.subject ?? data.user.subject ?? "Mathématiques");
    setTitle(course?.title ?? "");
    setDescription(course?.description ?? "");
    setContent(course?.content ?? "");
    setAttachmentName(course?.attachmentName ?? "");
    setAttachmentUrl(course?.attachmentUrl ?? "");
  }, [course, data.classes, data.user.subject, open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachmentUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <Modal
      open={open}
      title={course ? "Modifier le support de cours" : "Publier un support de cours"}
      subtitle="Rédigez le polycopié complet et/ou joignez un document (PDF, fiche, annales)."
      onClose={onClose}
      wide
    >
      <form
        id={course ? "modal-edit-course" : "modal-add-course"}
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            action: course ? "update" : "create",
            id: course?.id,
            classId,
            subject,
            title,
            description,
            content,
            attachmentName: attachmentName || null,
            attachmentUrl: attachmentUrl || null,
          });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Classe">
            <select value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
              {data.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Matière">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </Field>
        </div>
        <Field label="Titre du support">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Cours — Suites et limites"
            required
          />
        </Field>
        <Field label="Résumé / sous-titre">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex. Polycopié complet, démonstrations et exercices types."
          />
        </Field>
        <Field label="Contenu du cours (chapitres, formules, notes)">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ minHeight: 170 }}
            placeholder={"CHAPITRE I — DÉFINITIONS\n...\n\nCHAPITRE II — PROPRIÉTÉS\n..."}
          />
        </Field>
        <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper-2)] p-3.5 sm:grid-cols-2">
          <div className="field">
            <span className="label">Joindre un fichier (PDF, image, doc)</span>
            <label className="flex h-[44px] cursor-pointer items-center justify-between gap-2 border border-dashed border-[var(--line-strong)] bg-[#fff] px-3 text-sm transition-colors hover:border-[var(--ink)]">
              <span className="truncate text-xs font-medium text-[var(--ink)]">
                {attachmentName ? `📎 ${attachmentName}` : "Choisir un document sur l'ordinateur…"}
              </span>
              <span className="shrink-0 border border-[var(--line-strong)] bg-[var(--paper-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]">
                Parcourir
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <Field label="Ou lien externe (URL optionnelle)">
            <input
              value={attachmentUrl.startsWith("data:") ? "" : attachmentUrl}
              onChange={(e) => {
                setAttachmentUrl(e.target.value);
                if (!attachmentName && e.target.value) setAttachmentName("Document externe");
              }}
              placeholder="https://..."
            />
          </Field>
          {attachmentName ? (
            <div className="flex items-center justify-between border border-[#c5d9cd] bg-[#e7f0ea] px-3 py-1.5 text-xs text-[var(--ok)] sm:col-span-2">
              <span className="truncate">
                Document joint : <strong>{attachmentName}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAttachmentName("");
                  setAttachmentUrl("");
                }}
                className="ml-2 border-0 bg-transparent text-xs font-semibold text-[var(--danger)] hover:underline"
              >
                Retirer
              </button>
            </div>
          ) : null}
        </div>
        <Button type="submit">
          <BookOpen size={16} /> {course ? "Enregistrer les modifications" : "Publier le support"}
        </Button>
      </form>
    </Modal>
  );
}

function ClassStudentsModal({
  open,
  students,
  data,
  onClose,
  onSent,
  toast,
}: {
  open: boolean;
  students: Person[];
  data: Bootstrap;
  onClose: () => void;
  onSent: (studentName: string) => Promise<void>;
  toast: (msg: string, type?: "ok" | "err") => void;
}) {
  const [activeStudent, setActiveStudent] = useState<Person | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  async function sendToStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!activeStudent || !msgText.trim()) return;
    setSending(true);
    try {
      await api("/api/messages", {
        method: "POST",
        body: JSON.stringify({ toId: activeStudent.id, content: msgText.trim() }),
      });
      const name = activeStudent.name;
      setMsgText("");
      await onSent(name);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "err");
    } finally {
      setSending(false);
    }
  }

  const thread = activeStudent
    ? data.messages
        .filter(
          (m) =>
            (m.fromId === activeStudent.id && m.toId === data.user.id) ||
            (m.fromId === data.user.id && m.toId === activeStudent.id),
        )
        .slice()
        .reverse()
    : [];

  return (
    <Modal open={open} title="Élèves de la classe & Messagerie" onClose={onClose}>
      <div className="grid gap-4">
        <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
          {students.map((s) => {
            const isSelected = activeStudent?.id === s.id;
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between row px-3 py-2 ${isSelected ? "border-[var(--ink)] bg-[var(--surface)]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} src={s.avatarUrl} size={34} />
                  <div>
                    <p className="m-0 text-sm font-semibold">{s.name}</p>
                    <p className="m-0 text-xs text-[var(--muted)]">{s.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={isSelected ? "gold" : "ghost"}
                  style={{ height: 32, padding: "0 10px" }}
                  onClick={() => setActiveStudent(isSelected ? null : s)}
                >
                  <NotebookPen size={13} /> Message
                </Button>
              </div>
            );
          })}
          {students.length === 0 ? (
            <p className="m-0 py-4 text-center text-sm text-[var(--muted)]">Aucun étudiant inscrit dans cette classe.</p>
          ) : null}
        </div>

        {activeStudent ? (
          <div className="rounded-[2px] border border-[var(--line)] bg-[var(--paper-2)] p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="m-0 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Correspondance avec {activeStudent.name}
              </p>
              <button
                type="button"
                className="border-0 bg-transparent text-xs text-[var(--muted)] hover:underline"
                onClick={() => setActiveStudent(null)}
              >
                Fermer
              </button>
            </div>
            {thread.length > 0 ? (
              <div className="mb-3 grid max-h-40 gap-2 overflow-y-auto rounded-[2px] border border-[var(--line)] bg-[var(--paper)] p-2.5">
                {thread.map((m) => {
                  const mine = m.fromId === data.user.id;
                  return (
                    <div key={m.id} className="text-xs">
                      <span className="font-semibold">{mine ? "Vous" : m.fromName} : </span>
                      <span>{m.content}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <form onSubmit={sendToStudent} className="grid gap-2">
              <textarea
                className="input"
                rows={2}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder={`Écrire un message à ${activeStudent.name}…`}
                required
              />
              <Button type="submit" disabled={sending || !msgText.trim()} style={{ height: 36 }}>
                {sending ? "Envoi…" : `Envoyer à ${activeStudent.name}`}
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

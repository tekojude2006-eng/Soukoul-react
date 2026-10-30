"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Camera,
  Check,
  Download,
  KeyRound,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
} from "lucide-react";
import type { Bootstrap, SessionUser } from "@/lib/types";
import { api, average } from "@/lib/utils";
import { Avatar, Button, Field } from "@/components/ui";

export type UserPrefs = {
  theme: "classic" | "ivory" | "night";
  fontScale: "compact" | "normal" | "large";
  reduceMotion: boolean;
  notifGrades: boolean;
  notifHomeworks: boolean;
  notifCourses: boolean;
  notifAnnouncements: boolean;
};

const DEFAULT_PREFS: UserPrefs = {
  theme: "classic",
  fontScale: "normal",
  reduceMotion: false,
  notifGrades: true,
  notifHomeworks: true,
  notifCourses: true,
  notifAnnouncements: true,
};

export function applyUserPrefs(prefs: UserPrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", prefs.theme);
  root.setAttribute("data-font-scale", prefs.fontScale);
  root.setAttribute("data-reduce-motion", prefs.reduceMotion ? "true" : "false");
}

export function loadUserPrefs(): UserPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem("soukoul-prefs");
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function makeCrestDataUrl(bg: string, fg: string, symbol: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" fill="${bg}"/>
    <circle cx="80" cy="80" r="62" fill="none" stroke="${fg}" stroke-width="2" stroke-dasharray="4 3" opacity="0.65"/>
    <circle cx="80" cy="80" r="52" fill="none" stroke="${fg}" stroke-width="1.5"/>
    <text x="80" y="94" text-anchor="middle" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="${fg}">${symbol}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const CREST_PRESETS = [
  { label: "Outremer", bg: "#284b7a", fg: "#fcf8f1", symbol: "S" },
  { label: "Carmin", bg: "#8f2436", fg: "#fcf8f1", symbol: "U" },
  { label: "Malachite", bg: "#26684e", fg: "#fcf8f1", symbol: "Δ" },
  { label: "Terre de Sienne", bg: "#b54d32", fg: "#fcf8f1", symbol: "Φ" },
  { label: "Ocre", bg: "#c87d20", fg: "#1c1915", symbol: "Ω" },
  { label: "Prune", bg: "#5e3c78", fg: "#fcf8f1", symbol: "∑" },
];

function passwordStrength(pw: string) {
  if (!pw) return { score: 0, label: "Vide", color: "#d7cdbd" };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d|[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Faible", "Moyen", "Bon", "Robuste", "Excellent"];
  const colors = ["#8f2d2d", "#b54d32", "#c87d20", "#284b7a", "#26684e"];
  return { score: s, label: labels[s] ?? "Bon", color: colors[s] ?? "#26684e" };
}

export function SettingsView({
  data,
  onUpdated,
  toast,
}: {
  data: Bootstrap;
  onUpdated: (user?: SessionUser) => Promise<void>;
  toast: (msg: string, type?: "ok" | "err") => void;
}) {
  const u = data.user;
  const [name, setName] = useState(u.name);
  const [phone, setPhone] = useState(u.phone ?? "");
  const [subject, setSubject] = useState(u.subject ?? "");
  const [bio, setBio] = useState(u.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(u.avatarUrl ?? null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [prefs, setPrefs] = useState<UserPrefs>(() => loadUserPrefs());

  useEffect(() => {
    setName(u.name);
    setPhone(u.phone ?? "");
    setSubject(u.subject ?? "");
    setBio(u.bio ?? "");
    setAvatarUrl(u.avatarUrl ?? null);
  }, [u]);

  function updatePrefs(patch: Partial<UserPrefs>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("soukoul-prefs", JSON.stringify(next));
      applyUserPrefs(next);
      return next;
    });
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setAvatarUrl(reader.result as string);
          return;
        }
        // Center-crop square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setAvatarUrl(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api<{ ok: boolean; user: SessionUser }>("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          action: "update-profile",
          name,
          phone,
          bio,
          avatarUrl,
          subject: u.role !== "student" ? subject : undefined,
        }),
      });
      await onUpdated(res.user);
      toast("Profil et photo enregistrés.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.", "err");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast("Le nouveau mot de passe doit contenir au moins 6 caractères.", "err");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("Les deux nouveaux mots de passe ne correspondent pas.", "err");
      return;
    }
    setSavingPass(true);
    try {
      await api("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          action: "change-password",
          currentPassword,
          newPassword,
        }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Mot de passe modifié avec succès.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Impossible de modifier le mot de passe.", "err");
    } finally {
      setSavingPass(false);
    }
  }

  function exportAcademicDossier() {
    const avg = average(data.grades);
    const lines = [
      "====================================================",
      "        UNIVERSITÉ SOUKOUL · DAKAR — DOSSIER        ",
      "====================================================",
      `Nom : ${u.name}`,
      `Identifiant : ${u.email}`,
      `Rôle : ${u.role === "student" ? `Étudiant (${u.className ?? "—"})` : u.role === "teacher" ? `Enseignant (${u.subject ?? "—"})` : "Direction"}`,
      `Date d'export : ${new Date().toLocaleString("fr-FR")}`,
      "",
      `--- MOYENNE GÉNÉRALE : ${avg ?? "—"}/20 ---`,
      "",
      "--- ÉVALUATIONS ---",
      ...data.grades.map((g) => `• [${g.subject}] ${g.evaluationTitle} (${g.period}, coef ${g.coefficient}) : ${g.score}/20`),
      "",
      "--- DEVOIRS ---",
      ...data.homeworks.map((h) => `• [${h.completed ? "TERMINÉ" : "À FAIRE"}] ${h.title} (${h.subject}) — pour le ${h.dueDate}`),
      "",
      "--- EMPLOI DU TEMPS ---",
      ...data.schedules.map((s) => `• Jour ${s.dayOfWeek} (${s.startTime}–${s.endTime}) : ${s.subject} — Salle ${s.room ?? "—"}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dossier-soukoul-${u.email.split("@")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Dossier académique téléchargé.");
  }

  const strength = passwordStrength(newPassword);

  return (
    <div className="stagger grid gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <p className="kicker">Préférences &amp; Identité</p>
          <h1 className="serif mt-1 mb-0 text-[2.2rem]">Paramètres du compte</h1>
        </div>
        <span className="mono-badge">
          <UserCheck size={12} /> {u.email}
        </span>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* 1. PROFIL & PHOTO DE PROFIL */}
        <section className="editorial-card p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="eyebrow-tag">Identité académique</span>
              <h2 className="serif m-0 mt-0.5 text-xl">Photo de profil &amp; coordonnées</h2>
            </div>
          </div>

          <form onSubmit={saveProfile} className="grid gap-5">
            <div className="flex flex-col gap-5 border border-[var(--line)] bg-[var(--paper-2)] p-4 sm:flex-row sm:items-center">
              <Avatar name={name || u.name} src={avatarUrl} size={84} />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-sm font-semibold">Portrait ou sceau personnel</p>
                <p className="m-0 mt-0.5 text-xs text-[var(--muted)]">
                  Importez une photo (recadrée automatiquement en carré 256×256) ou choisissez un sceau universitaire ci-dessous.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="btn btn-gold cursor-pointer" style={{ height: 36, padding: "0 12px", fontSize: 12.5 }}>
                    <Camera size={14} />
                    Importer une photo…
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                  </label>
                  {avatarUrl ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ height: 36, padding: "0 12px", fontSize: 12.5 }}
                      onClick={() => setAvatarUrl(null)}
                    >
                      <Trash2 size={14} />
                      Revenir aux initiales
                    </button>
                  ) : null}
                </div>

                {/* Preset academic crests */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-[var(--muted)]">Sceaux :</span>
                  {CREST_PRESETS.map((c) => {
                    const url = makeCrestDataUrl(c.bg, c.fg, c.symbol);
                    return (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        title={`Sceau ${c.label}`}
                        className="h-7 w-7 overflow-hidden border border-[var(--ink)]/40 transition-transform hover:scale-110"
                        style={{ background: c.bg, color: c.fg }}
                      >
                        <span className="font-serif text-xs font-bold">{c.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet">
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Identifiant universitaire">
                <input value={u.email} disabled className="opacity-65" />
              </Field>
              <Field label="Téléphone / WhatsApp">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 77 000 00 00"
                />
              </Field>
              {u.role === "student" ? (
                <Field label="Promotion">
                  <input value={u.className ?? "—"} disabled className="opacity-65" />
                </Field>
              ) : (
                <Field label={u.role === "teacher" ? "Chaire / Matière enseignée" : "Fonction"}>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} />
                </Field>
              )}
            </div>

            <Field label="Biographie / Note de présentation">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{ minHeight: 78 }}
                placeholder="Ex. Délégué de promotion L1 Sciences, spécialisation analyse et physique expérimentale…"
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                <Save size={15} />
                {savingProfile ? "Enregistrement…" : "Enregistrer le profil"}
              </Button>
            </div>
          </form>
        </section>

        {/* 2. SÉCURITÉ & MOT DE PASSE */}
        <div className="grid content-start gap-6">
          <section className="editorial-card p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <span className="eyebrow-tag">Sécurité d&apos;accès</span>
                <h2 className="serif m-0 mt-0.5 text-xl">Modifier mon mot de passe</h2>
              </div>
              <span className="chip chip-ok">
                <ShieldCheck size={12} /> Compte activé
              </span>
            </div>

            <form onSubmit={changePassword} className="grid gap-3.5">
              <Field label="Mot de passe actuel">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </Field>
              <Field label="Nouveau mot de passe">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  minLength={6}
                  required
                />
              </Field>

              {newPassword ? (
                <div className="grid gap-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--muted)]">Robustesse</span>
                    <span className="font-semibold" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="h-1.5"
                        style={{
                          background: strength.score >= level ? strength.color : "var(--line)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <Field label="Confirmer le nouveau mot de passe">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le nouveau mot de passe"
                  minLength={6}
                  required
                />
              </Field>

              <Button type="submit" disabled={savingPass} className="mt-1">
                <KeyRound size={15} />
                {savingPass ? "Mise à jour…" : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          </section>

          {/* 3. DOSSIER & EXPORT */}
          <section className="editorial-card p-6">
            <div className="mb-3 border-b border-[var(--line)] pb-3">
              <span className="eyebrow-tag">Portabilité</span>
              <h2 className="serif m-0 mt-0.5 text-xl">Archive &amp; export personnel</h2>
            </div>
            <p className="m-0 mb-4 text-xs leading-relaxed text-[var(--muted)]">
              Téléchargez une copie complète de votre dossier universitaire (moyennes, notes, devoirs et emploi du temps) au format texte archivable.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={exportAcademicDossier}>
                <Download size={15} /> Exporter mon dossier (.txt)
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  localStorage.removeItem("soukoul-prefs");
                  setPrefs(DEFAULT_PREFS);
                  applyUserPrefs(DEFAULT_PREFS);
                  toast("Préférences d'affichage réinitialisées.");
                }}
              >
                <RotateCcw size={15} /> Réinitialiser l&apos;affichage
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* 4. APPARENCE & NOTIFICATIONS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="editorial-card p-6">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="eyebrow-tag">Confort visuel</span>
              <h2 className="serif m-0 mt-0.5 text-xl">Apparence &amp; typographie</h2>
            </div>
            <Palette size={18} className="text-[var(--muted)]" />
          </div>

          <div className="grid gap-5">
            <div>
              <p className="m-0 mb-2 text-xs font-medium text-[var(--muted)]">Teinte du papier</p>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "classic", label: "Parchemin", sub: "Défaut Dakar", bg: "#efe8dc", fg: "#1c1915" },
                  { id: "ivory", label: "Ivoire clair", sub: "Contraste +", bg: "#f9f7f2", fg: "#1c1915" },
                  { id: "night", label: "Cabinet nocturne", sub: "Mode sombre", bg: "#181512", fg: "#f2ece1" },
                ].map((t) => {
                  const active = prefs.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updatePrefs({ theme: t.id as UserPrefs["theme"] })}
                      className={`flex flex-col items-start border p-3 text-left transition-colors ${
                        active ? "border-[var(--ink)] bg-[var(--paper-2)]" : "border-[var(--line)] bg-transparent"
                      }`}
                    >
                      <span
                        className="mb-2 inline-block h-5 w-full border border-black/20"
                        style={{ background: t.bg }}
                      />
                      <span className="text-xs font-semibold">{t.label}</span>
                      <span className="text-[10px] text-[var(--muted)]">{t.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="m-0 mb-2 text-xs font-medium text-[var(--muted)]">Corps typographique</p>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "compact", label: "Compact (14px)" },
                  { id: "normal", label: "Standard (15px)" },
                  { id: "large", label: "Grand (16.5px)" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updatePrefs({ fontScale: f.id as UserPrefs["fontScale"] })}
                    className={`border px-3 py-2.5 text-xs font-medium ${
                      prefs.fontScale === f.id
                        ? "border-[var(--ink)] bg-[var(--ink)] text-[#fcf8f1]"
                        : "border-[var(--line)] bg-[var(--paper-2)] text-[var(--ink)]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3">
              <div>
                <p className="m-0 text-sm font-medium">Réduire les animations</p>
                <p className="m-0 text-xs text-[var(--muted)]">Désactive les transitions d&apos;entrée entre les onglets</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.reduceMotion}
                onChange={(e) => updatePrefs({ reduceMotion: e.target.checked })}
              />
            </label>
          </div>
        </section>

        <section className="editorial-card p-6">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="eyebrow-tag">Alertes &amp; signaux</span>
              <h2 className="serif m-0 mt-0.5 text-xl">Préférences de notification</h2>
            </div>
            <Bell size={18} className="text-[var(--muted)]" />
          </div>

          <div className="grid gap-2.5">
            {[
              {
                key: "notifGrades" as const,
                title: "Publication de nouvelles notes",
                desc: "Recevoir une alerte dès qu'un enseignant saisit ou modifie une évaluation.",
              },
              {
                key: "notifHomeworks" as const,
                title: "Nouveaux devoirs & rappels d'échéance",
                desc: "Alerte lors de l'ajout d'un travail personnel et veille de date limite.",
              },
              {
                key: "notifCourses" as const,
                title: "Supports de cours & polycopiés",
                desc: "Notification à chaque dépôt d'un support ou d'annales dans votre classe.",
              },
              {
                key: "notifAnnouncements" as const,
                title: "Circulaires du rectorat",
                desc: "Informations officielles sur les examens, salles et conférences.",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start justify-between gap-3 border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3"
              >
                <div>
                  <p className="m-0 text-sm font-medium">{item.title}</p>
                  <p className="m-0 text-xs text-[var(--muted)]">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  onChange={(e) => updatePrefs({ [item.key]: e.target.checked })}
                  className="mt-1"
                />
              </label>
            ))}

            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  if (!("Notification" in window)) {
                    return toast("Votre navigateur ne supporte pas les notifications.", "err");
                  }
                  const perm = await Notification.requestPermission();
                  if (perm !== "granted") {
                    return toast("Permission de notification refusée.", "err");
                  }
                  new Notification("Université Soukoul", {
                    body: `Bonjour ${u.name}, vos notifications sont bien actives.`,
                  });
                  toast("Notification de test envoyée !");
                }}
              >
                <Sparkles size={15} /> Tester une notification sur cet appareil
              </Button>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                <Check size={14} className="text-[var(--ok)]" /> Sauvegarde automatique
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


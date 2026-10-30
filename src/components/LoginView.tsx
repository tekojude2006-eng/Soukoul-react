"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { Logo, SplashLoader } from "@/components/Logo";
import { Button, Field } from "@/components/ui";
import type { SessionUser } from "@/lib/types";
import { api } from "@/lib/utils";

const SLIDES = [
  { src: "/images/bg1.jpg", caption: "Cour d’honneur" },
  { src: "/images/bg2.jpg", caption: "Bibliothèque centrale" },
  { src: "/images/bg3.jpg", caption: "Campus, tombée du jour" },
];

const DEMOS = [
  { id: "lea.mercier", role: "Étudiant", name: "Léa Mercier", pass: "Soukoul2026!" },
  { id: "ndeye.sarr", role: "Étudiant · 1re connexion", name: "Ndèye Sarr", pass: "welcome1" },
  { id: "m.dubreuil", role: "Enseignant", name: "Marc Dubreuil", pass: "Soukoul2026!" },
  { id: "admin", role: "Direction", name: "Awa Ndoye", pass: "Soukoul2026!" },
];

export function LoginView() {
  const [slide, setSlide] = useState(0);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "recover" | "first-login">("login");
  const [pendingUser, setPendingUser] = useState<SessionUser | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ user: SessionUser }>("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", identifier, password }),
      });
      if (res.user?.firstLogin) {
        setPendingUser(res.user);
        setNewPass("");
        setConfirmPass("");
        setMode("first-login");
        return;
      }
      setRedirecting(true);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
      setLoading(false);
    }
  }

  async function completeFirstLogin(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPass !== confirmPass) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    if (newPass === password) {
      setError("Veuillez choisir un mot de passe différent du mot de passe provisoire.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "force-password", password: newPass }),
      });
      setRedirecting(true);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
      setLoading(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ demoCode: string; message: string }>("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "recovery-send", identifier }),
      });
      setDemoCode(res.demoCode);
      setNotice(res.message);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "recovery-reset",
          identifier,
          code,
          password: newPass,
        }),
      });
      setMode("login");
      setStep(1);
      setPassword(newPass);
      setNotice("Mot de passe mis à jour. Vous pouvez vous connecter.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réinitialisation impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,480px)]">
      {redirecting ? <SplashLoader subtitle="Authentification validée · Ouverture du portail…" /> : null}
      <section className="relative hidden min-h-[280px] lg:block">
        {SLIDES.map((s, i) => (
          <div
            key={s.src}
            className={`slide ${i === slide ? "active" : ""}`}
            style={{ backgroundImage: `url(${s.src})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,25,21,0.15)_0%,rgba(28,25,21,0.55)_100%)]" />
        <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between px-10 py-8 text-[#f4efe6]">
          <div>
            <p className="serif m-0 text-3xl">Université Soukoul</p>
            <p className="mt-1 mb-0 text-sm opacity-80">Dakar · Espace numérique de travail</p>
          </div>
          <p className="m-0 text-xs tracking-wide opacity-70">{SLIDES[slide]?.caption}</p>
        </div>
      </section>

      <section className="flex min-h-screen flex-col bg-[var(--paper-2)] px-8 py-8 sm:px-12">
        <header className="flex items-center gap-3">
          <Logo size={34} />
          <div>
            <p className="serif m-0 text-lg leading-none">Soukoul</p>
            <p className="m-0 text-xs text-[var(--muted)]">ENT · Université</p>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">
          <p className="kicker">
            {mode === "first-login" ? "Activation du compte" : "Accès personnel"}
          </p>
          <h1 className="serif mt-2 mb-2 text-[2.35rem] leading-[1.05]">
            {mode === "first-login" ? "Première connexion" : "Connexion"}
          </h1>
          <p className="mt-0 mb-8 text-sm leading-6 text-[var(--muted)]">
            {mode === "first-login"
              ? `Bienvenue ${pendingUser?.name ?? ""}. Pour sécuriser votre compte, définissez maintenant votre mot de passe personnel.`
              : "Indiquez votre identifiant, sans domaine. Le portail interroge @eleve.sn et @ecole.sn."}
          </p>

          {notice ? (
            <div className="mb-4 border border-[#c5d9cd] bg-[#e7f0ea] px-3 py-2.5 text-sm">{notice}</div>
          ) : null}
          {error ? (
            <div className="mb-4 border border-[#e3c4c4] bg-[#f6e7e7] px-3 py-2.5 text-sm text-[var(--danger)]">{error}</div>
          ) : null}

          {mode === "first-login" ? (
            <form onSubmit={completeFirstLogin} className="grid gap-4">
              <div className="border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--muted)]">
                Compte : <strong className="text-[var(--ink)]">{pendingUser?.email}</strong>
                {pendingUser?.className ? ` · ${pendingUser.className}` : ""}
              </div>
              <Field label="Nouveau mot de passe personnel">
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  minLength={6}
                  autoFocus
                  required
                />
              </Field>
              <Field label="Confirmer le nouveau mot de passe">
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Répétez votre mot de passe"
                  minLength={6}
                  required
                />
              </Field>
              <Button type="submit" disabled={loading}>
                <ShieldCheck size={16} />
                {loading ? "Activation…" : "Enregistrer et accéder au portail"}
              </Button>
            </form>
          ) : mode === "login" ? (
            <form onSubmit={login} className="grid gap-4">
              <Field label="Identifiant">
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="lea.mercier"
                  autoComplete="username"
                  required
                />
              </Field>
              <Field label="Mot de passe">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="border-0 bg-transparent p-0 text-sm text-[var(--gold)] underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("recover");
                    setError(null);
                    setNotice(null);
                  }}
                >
                  Mot de passe oublié
                </button>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
                <ArrowRight size={16} />
              </Button>
            </form>
          ) : step === 1 ? (
            <form onSubmit={sendCode} className="grid gap-4">
              <Field label="Identifiant">
                <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="lea.mercier" required />
              </Field>
              <Button type="submit" disabled={loading}>
                <KeyRound size={16} />
                {loading ? "Envoi…" : "Envoyer le code"}
              </Button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setMode("login");
                  setStep(1);
                }}
              >
                Retour
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="grid gap-4">
              {demoCode ? (
                <div className="border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm">
                  Code de démonstration : <strong className="tracking-[0.18em]">{demoCode}</strong>
                </div>
              ) : null}
              <Field label="Code à 6 chiffres">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" required />
              </Field>
              <Field label="Nouveau mot de passe">
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} minLength={6} required />
              </Field>
              <Button type="submit" disabled={loading}>
                Réinitialiser
              </Button>
            </form>
          )}

          <div className="mt-10 border-t border-[var(--line)] pt-5">
            <p className="mb-3 text-xs text-[var(--muted)]">Comptes de démonstration (cliquez pour remplir)</p>
            <div className="grid gap-1">
              {DEMOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="flex items-baseline justify-between border-0 bg-transparent px-0 py-1.5 text-left"
                  onClick={() => {
                    setIdentifier(d.id);
                    setPassword(d.pass);
                    setMode("login");
                    setError(null);
                  }}
                >
                  <span className="text-sm">{d.name}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {d.id} · {d.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="m-0 text-xs text-[var(--muted)]">© {year} Université Soukoul · Tous droits réservés</p>
      </section>
    </main>
  );
}

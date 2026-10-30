import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  absences,
  announcements,
  cahierSessions,
  classes,
  classTeachers,
  courses,
  grades,
  homeworkCompletions,
  homeworks,
  messages,
  notifications,
  schedules,
  users,
} from "@/db/schema";
import { addDaysISO, todayISO } from "@/lib/utils";
import { hashPassword } from "@/lib/password";

let seeding: Promise<void> | null = null;

export function ensureSeeded() {
  if (!seeding) {
    seeding = seed().catch((err) => {
      seeding = null;
      throw err;
    });
  }
  return seeding;
}

async function ensureSchema() {
  const statements = [
    sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      first_login BOOLEAN NOT NULL DEFAULT true,
      recovery_code TEXT,
      phone TEXT,
      subject TEXT,
      class_id INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      room TEXT,
      principal_teacher_id INTEGER
    )`,
    sql`CREATE TABLE IF NOT EXISTS class_teachers (
      class_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      PRIMARY KEY (class_id, teacher_id)
    )`,
    sql`CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT,
      color TEXT NOT NULL
    )`,
    sql`CREATE TABLE IF NOT EXISTS homeworks (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      subject TEXT,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS homework_completions (
      homework_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      completed_at TIMESTAMP NOT NULL DEFAULT now(),
      PRIMARY KEY (homework_id, student_id)
    )`,
    sql`CREATE TABLE IF NOT EXISTS grades (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      evaluation_title TEXT NOT NULL,
      period TEXT NOT NULL,
      coefficient INTEGER NOT NULL DEFAULT 1,
      score REAL,
      comment TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS cahier_sessions (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      work_assigned TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS absences (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      reason TEXT,
      justified BOOLEAN NOT NULL DEFAULT false,
      reported_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      from_id INTEGER NOT NULL,
      to_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      tab TEXT,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      attachment_name TEXT,
      attachment_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
    sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS content TEXT`,
    sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS attachment_name TEXT`,
    sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS attachment_url TEXT`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`,
    sql`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT,
      auth TEXT
    )`,
  ];
  for (const stmt of statements) {
    await db.execute(stmt);
  }
}

async function seed() {
  await ensureSchema();
  const existing = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  const count = Number(existing[0]?.c ?? 0);
  if (count > 0) {
    await db.execute(sql`
      UPDATE courses
      SET content = CASE
        WHEN title LIKE '%Suites et limites%' THEN E'CHAPITRE I — DÉFINITIONS ET MODES DE GÉNÉRATION\nUne suite numérique (u_n) est une application de ℕ dans ℝ. Elle peut être définie de façon explicite u_n = f(n) ou par récurrence u_{n+1} = φ(u_n).\n\nCHAPITRE II — CONVERGENCE ET THÉORÈMES FONDAMENTAUX\n• Toute suite croissante et majorée converge dans ℝ.\n• Théorème des gendarmes : si v_n ≤ u_n ≤ w_n et lim v_n = lim w_n = ℓ, alors lim u_n = ℓ.\n• Suites adjacentes : (u_n) croissante, (v_n) décroissante et lim(v_n - u_n) = 0.\n\nCHAPITRE III — EXERCICES D''APPLICATION\n1. Étudier la nature de la suite u_n = (1 + 1/n)^n.\n2. Montrer par récurrence que pour tout n ≥ 1, ∑_{k=1}^n k² = n(n+1)(2n+1)/6.'
        WHEN title LIKE '%Annales%' THEN E'SUJET TYPE PARTIEL — SEMESTRE 1 (DURÉE : 3H)\n\nExercice 1 (6 points) — Suites récurrentes linéaires d''ordre 2\nSoit la suite définie par u_0 = 1, u_1 = 2 et u_{n+2} = 3u_{n+1} - 2u_n. Déterminer le terme général et la limite éventuelle.\n\nExercice 2 (8 points) — Continuité et Théorème des Valeurs Intermédiaires\nSoit f : [0, 1] → [0, 1] continue. Démontrer que f admet au moins un point fixe α ∈ [0, 1].\n\nExercice 3 (6 points) — Dérivabilité et accroissements finis\nÀ l''aide de l''inégalité des accroissements finis, démontrer que pour tout x > 0 : x / (1 + x) < ln(1 + x) < x.'
        WHEN title LIKE '%pendule%' THEN E'PROTOCOLE EXPÉRIMENTAL — PENDULE PESANT SIMPLE\n\n1. Objectif du TP\nVérifier la loi d''isochronisme des petites oscillations (θ_0 < 10°) et déterminer expérimentalement l''intensité de la pesanteur g à Dakar.\n\n2. Équation différentielle\nPar application du théorème du moment cinétique : d²θ/dt² + (g/L) sin(θ) = 0.\nDans l''approximation des petits angles (sin θ ≈ θ), la période propre vaut T_0 = 2π √(L/g).\n\n3. Tableau de mesures à compléter\nMesurer la durée de 20 oscillations pour L ∈ {0.30 m, 0.50 m, 0.70 m, 0.90 m, 1.10 m} et tracer T_0² en fonction de L.'
        WHEN title LIKE '%mécanique%' THEN E'COURS MAGISTRAL — MÉCANIQUE DU POINT MATÉRIEL\n\nI. Cinématique dans les repères cartésien, cylindrique et intrinsèque (Frenet).\nII. Principes fondamentaux de la dynamique de Newton (référentiels galiléens).\nIII. Théorème de l''énergie cinétique et forces conservatives : E_m = E_c + E_p = constante.\nIV. Oscillateurs harmoniques amortis et forcés — résonance.'
        WHEN title LIKE '%Senghor%' THEN E'ANTHOLOGIE COMMENTÉE — NÉGRITUDE ET POÉTIQUE\n\nI. Léopold Sédar Senghor, « Chants d''ombre » (1945)\nExtrait étudié : « Femme noire ».\nAxes de lecture :\n1. L''éloge lyrique et sensuel d''une figure allégorique de l''Afrique.\n2. Le rythme incantatoire et la musicalité du verset senghorien.\n3. La mémoire et l''immortalisation par le chant poétique.\n\nII. Aimé Césaire, « Cahier d''un retour au pays natal » (1939)\nConfrontation stylistique : la révolte volcanique césairienne face à l''harmonie cosmique senghorienne.'
        ELSE E'MÉTHODOLOGIE DE LA DISSERTATION LITTÉRAIRE\n\n1. Analyse du sujet et problématisation\nIdentifier les présupposés de la citation, définir les termes clés et dégager le paradoxe central.\n\n2. Construction du plan dialectique ou thématique\nI. Thèse (validation partielle et arguments illustrés)\nII. Antithèse (limites et nuances critiques)\nIII. Dépassement (reformulation des enjeux esthétiques)\n\n3. Rédaction de l''introduction (amorce, sujet, problématique, annonce du plan) et de la conclusion (bilan, ouverture).'
      END
      WHERE content IS NULL
    `);
    return;
  }

  const passwordHash = await hashPassword("Soukoul2026!");
  const welcomeHash = await hashPassword("welcome1");

  const [l1] = await db
    .insert(classes)
    .values({ name: "L1 Sciences", room: "A12" })
    .returning();
  const [l2] = await db
    .insert(classes)
    .values({ name: "L2 Lettres", room: "B04" })
    .returning();
  const [l3] = await db
    .insert(classes)
    .values({ name: "L3 Économie", room: "C21" })
    .returning();
  const [m1] = await db
    .insert(classes)
    .values({ name: "M1 Droit", room: "D08" })
    .returning();

  const [admin] = await db
    .insert(users)
    .values({
      name: "Awa Ndoye",
      email: "admin@ecole.sn",
      passwordHash,
      role: "admin",
      firstLogin: false,
      subject: "Direction",
    })
    .returning();

  const [dubreuil] = await db
    .insert(users)
    .values({
      name: "Marc Dubreuil",
      email: "m.dubreuil@ecole.sn",
      passwordHash,
      role: "teacher",
      firstLogin: false,
      phone: "+221771234567",
      subject: "Mathématiques",
    })
    .returning();

  const [fall] = await db
    .insert(users)
    .values({
      name: "Aminata Fall",
      email: "a.fall@ecole.sn",
      passwordHash,
      role: "teacher",
      firstLogin: false,
      phone: "+221776543210",
      subject: "Littérature",
    })
    .returning();

  const [ndiaye] = await db
    .insert(users)
    .values({
      name: "Ousmane Ndiaye",
      email: "o.ndiaye@ecole.sn",
      passwordHash,
      role: "teacher",
      firstLogin: false,
      phone: "+221770001122",
      subject: "Physique",
    })
    .returning();

  const [diop] = await db
    .insert(users)
    .values({
      name: "Mariama Diop",
      email: "m.diop@ecole.sn",
      passwordHash,
      role: "teacher",
      firstLogin: false,
      phone: "+221778889900",
      subject: "Économie",
    })
    .returning();

  const [kane] = await db
    .insert(users)
    .values({
      name: "Ibrahima Kane",
      email: "i.kane@ecole.sn",
      passwordHash,
      role: "teacher",
      firstLogin: false,
      phone: "+221775551144",
      subject: "Droit",
    })
    .returning();

  await db
    .update(classes)
    .set({ principalTeacherId: dubreuil.id })
    .where(sql`id = ${l1.id}`);
  await db
    .update(classes)
    .set({ principalTeacherId: fall.id })
    .where(sql`id = ${l2.id}`);
  await db
    .update(classes)
    .set({ principalTeacherId: diop.id })
    .where(sql`id = ${l3.id}`);
  await db
    .update(classes)
    .set({ principalTeacherId: kane.id })
    .where(sql`id = ${m1.id}`);

  await db.insert(classTeachers).values([
    { classId: l1.id, teacherId: dubreuil.id },
    { classId: l3.id, teacherId: dubreuil.id },
    { classId: l2.id, teacherId: fall.id },
    { classId: l1.id, teacherId: fall.id },
    { classId: l1.id, teacherId: ndiaye.id },
    { classId: l3.id, teacherId: diop.id },
    { classId: m1.id, teacherId: diop.id },
    { classId: m1.id, teacherId: kane.id },
    { classId: l2.id, teacherId: kane.id },
  ]);

  const studentSeed = [
    { name: "Léa Mercier", email: "lea.mercier@eleve.sn", classId: l1.id, firstLogin: false, passwordHash },
    { name: "Amadou Sow", email: "amadou.sow@eleve.sn", classId: l1.id, firstLogin: false, passwordHash },
    { name: "Aïssatou Ba", email: "aissatou.ba@eleve.sn", classId: l1.id, firstLogin: false, passwordHash },
    { name: "Cheikh Diop", email: "cheikh.diop@eleve.sn", classId: l1.id, firstLogin: false, passwordHash },
    { name: "Fatou Ndiaye", email: "fatou.ndiaye@eleve.sn", classId: l1.id, firstLogin: false, passwordHash },
    { name: "Ibrahim Fall", email: "ibrahim.fall@eleve.sn", classId: l1.id, firstLogin: false, passwordHash },
    { name: "Ndèye Sarr", email: "ndeye.sarr@eleve.sn", classId: l1.id, firstLogin: true, passwordHash: welcomeHash },
    { name: "Moussa Kane", email: "moussa.kane@eleve.sn", classId: l1.id, firstLogin: false, passwordHash },
    { name: "Awa Gueye", email: "awa.gueye@eleve.sn", classId: l2.id, firstLogin: false, passwordHash },
    { name: "Jean-Pierre Mendy", email: "jp.mendy@eleve.sn", classId: l2.id, firstLogin: false, passwordHash },
    { name: "Khady Sy", email: "khady.sy@eleve.sn", classId: l3.id, firstLogin: false, passwordHash },
    { name: "Pape Diatta", email: "pape.diatta@eleve.sn", classId: l3.id, firstLogin: false, passwordHash },
    { name: "Marie Faye", email: "marie.faye@eleve.sn", classId: m1.id, firstLogin: false, passwordHash },
    { name: "Alioune Cissé", email: "alioune.cisse@eleve.sn", classId: m1.id, firstLogin: false, passwordHash },
  ];

  const insertedStudents = await db
    .insert(users)
    .values(studentSeed.map((s) => ({ ...s, role: "student" as const })))
    .returning();

  const lea = insertedStudents.find((s) => s.email === "lea.mercier@eleve.sn")!;
  const amadou = insertedStudents.find((s) => s.email === "amadou.sow@eleve.sn")!;
  const aissa = insertedStudents.find((s) => s.email === "aissatou.ba@eleve.sn")!;
  const cheikh = insertedStudents.find((s) => s.email === "cheikh.diop@eleve.sn")!;
  const fatou = insertedStudents.find((s) => s.email === "fatou.ndiaye@eleve.sn")!;
  const ibrahim = insertedStudents.find((s) => s.email === "ibrahim.fall@eleve.sn")!;
  const ndeye = insertedStudents.find((s) => s.email === "ndeye.sarr@eleve.sn")!;
  const moussa = insertedStudents.find((s) => s.email === "moussa.kane@eleve.sn")!;

  const C = {
    maths: "#3d5a80",
    phys: "#6d4c91",
    litt: "#8c4a3a",
    eco: "#2d6a4f",
    droit: "#1d3557",
  };

  await db.insert(schedules).values([
    { classId: l1.id, teacherId: dubreuil.id, subject: "Mathématiques", dayOfWeek: 1, startTime: "08:00", endTime: "10:00", room: "A12", color: C.maths },
    { classId: l1.id, teacherId: ndiaye.id, subject: "Physique", dayOfWeek: 1, startTime: "10:00", endTime: "12:00", room: "Labo 2", color: C.phys },
    { classId: l1.id, teacherId: fall.id, subject: "Littérature", dayOfWeek: 1, startTime: "14:00", endTime: "16:00", room: "B04", color: C.litt },
    { classId: l1.id, teacherId: dubreuil.id, subject: "Mathématiques", dayOfWeek: 2, startTime: "08:00", endTime: "10:00", room: "A12", color: C.maths },
    { classId: l1.id, teacherId: ndiaye.id, subject: "Physique", dayOfWeek: 2, startTime: "14:00", endTime: "16:00", room: "Labo 2", color: C.phys },
    { classId: l1.id, teacherId: diop.id, subject: "Économie", dayOfWeek: 2, startTime: "16:00", endTime: "18:00", room: "C21", color: C.eco },
    { classId: l1.id, teacherId: fall.id, subject: "Littérature", dayOfWeek: 3, startTime: "08:00", endTime: "10:00", room: "B04", color: C.litt },
    { classId: l1.id, teacherId: dubreuil.id, subject: "Mathématiques", dayOfWeek: 3, startTime: "10:00", endTime: "12:00", room: "A12", color: C.maths },
    { classId: l1.id, teacherId: ndiaye.id, subject: "Physique", dayOfWeek: 4, startTime: "08:00", endTime: "10:00", room: "Labo 2", color: C.phys },
    { classId: l1.id, teacherId: fall.id, subject: "Littérature", dayOfWeek: 4, startTime: "14:00", endTime: "16:00", room: "B04", color: C.litt },
    { classId: l1.id, teacherId: dubreuil.id, subject: "Mathématiques", dayOfWeek: 5, startTime: "08:00", endTime: "10:00", room: "A12", color: C.maths },
    { classId: l1.id, teacherId: ndiaye.id, subject: "Physique", dayOfWeek: 5, startTime: "10:00", endTime: "12:00", room: "Labo 2", color: C.phys },
    { classId: l1.id, teacherId: fall.id, subject: "Littérature", dayOfWeek: 6, startTime: "08:00", endTime: "10:00", room: "B04", color: C.litt },
    { classId: l2.id, teacherId: fall.id, subject: "Littérature", dayOfWeek: 1, startTime: "08:00", endTime: "10:00", room: "B04", color: C.litt },
    { classId: l2.id, teacherId: kane.id, subject: "Droit", dayOfWeek: 1, startTime: "10:00", endTime: "12:00", room: "D08", color: C.droit },
    { classId: l2.id, teacherId: fall.id, subject: "Littérature", dayOfWeek: 3, startTime: "14:00", endTime: "16:00", room: "B04", color: C.litt },
    { classId: l3.id, teacherId: diop.id, subject: "Économie", dayOfWeek: 1, startTime: "08:00", endTime: "10:00", room: "C21", color: C.eco },
    { classId: l3.id, teacherId: dubreuil.id, subject: "Mathématiques", dayOfWeek: 2, startTime: "10:00", endTime: "12:00", room: "A12", color: C.maths },
    { classId: l3.id, teacherId: diop.id, subject: "Économie", dayOfWeek: 4, startTime: "14:00", endTime: "16:00", room: "C21", color: C.eco },
    { classId: m1.id, teacherId: kane.id, subject: "Droit", dayOfWeek: 1, startTime: "14:00", endTime: "16:00", room: "D08", color: C.droit },
    { classId: m1.id, teacherId: diop.id, subject: "Économie", dayOfWeek: 3, startTime: "08:00", endTime: "10:00", room: "C21", color: C.eco },
    { classId: m1.id, teacherId: kane.id, subject: "Droit", dayOfWeek: 5, startTime: "14:00", endTime: "16:00", room: "D08", color: C.droit },
  ]);

  const hw = await db
    .insert(homeworks)
    .values([
      {
        classId: l1.id,
        teacherId: dubreuil.id,
        subject: "Mathématiques",
        title: "Devoir sur les suites numériques",
        description: "Exercices 12 à 18, pages 94-96. Justifier chaque convergence et préciser la limite lorsqu'elle existe.",
        dueDate: addDaysISO(1),
      },
      {
        classId: l1.id,
        teacherId: ndiaye.id,
        subject: "Physique",
        title: "Compte rendu — oscillations",
        description: "Rédiger le compte rendu du TP sur le pendule simple : protocole, mesures, incertitudes et conclusion.",
        dueDate: todayISO(),
      },
      {
        classId: l1.id,
        teacherId: fall.id,
        subject: "Littérature",
        title: "Dissertation — le progrès",
        description: "Le progrès technique est-il toujours un progrès pour l'humanité ? Plan détaillé + introduction rédigée.",
        dueDate: addDaysISO(-2),
      },
      {
        classId: l1.id,
        teacherId: dubreuil.id,
        subject: "Mathématiques",
        title: "Préparation contrôle — analyse",
        description: "Revoir dérivation, limites et théorème des valeurs intermédiaires. Fiche de synthèse à apporter.",
        dueDate: addDaysISO(5),
      },
      {
        classId: l2.id,
        teacherId: fall.id,
        subject: "Littérature",
        title: "Commentaire composé — Senghor",
        description: "Commentaire du poème « Femme noire ». Attention à la composition rythmique et aux images.",
        dueDate: addDaysISO(3),
      },
      {
        classId: l3.id,
        teacherId: diop.id,
        subject: "Économie",
        title: "Note de synthèse — inflation",
        description: "Quatre pages maximum sur les déterminants de l'inflation en Afrique de l'Ouest.",
        dueDate: addDaysISO(4),
      },
    ])
    .returning();

  const mathHw = hw.find((h) => h.title.includes("suites"));
  if (mathHw) {
    await db.insert(homeworkCompletions).values([
      { homeworkId: mathHw.id, studentId: amadou.id },
      { homeworkId: mathHw.id, studentId: fatou.id },
    ]);
  }

  const l1Students = [lea, amadou, aissa, cheikh, fatou, ibrahim, ndeye, moussa];

  const gradeRows: Array<typeof grades.$inferInsert> = [];
  const mathScores = [16, 14.5, 15, 12, 17, 13.5, 15.5, 11];
  const mathScores2 = [14, 13, 16.5, 11, 18, 12, 14, 10];
  const mathScores3 = [17, 15, 14, 13, 16, 14.5, 15, 12];
  const physScores = [13, 15, 12, 10, 16, 11, 14, 9];
  const physScores2 = [15, 14, 13.5, 12, 17, 13, 15, 11];
  const littScores = [16, 12, 17, 14, 15, 13, 16, 12];
  const littScores2 = [15, 13, 18, 13.5, 16, 14, 15.5, 11];
  const littScores3 = [17, 14, 16, 15, 14.5, 13, 16, 13];

  l1Students.forEach((s, i) => {
    gradeRows.push(
      { studentId: s.id, teacherId: dubreuil.id, classId: l1.id, subject: "Mathématiques", evaluationTitle: "Contrôle suites", period: "Semestre 1", coefficient: 2, score: mathScores[i], comment: "Bon raisonnement." },
      { studentId: s.id, teacherId: dubreuil.id, classId: l1.id, subject: "Mathématiques", evaluationTitle: "Interrogation limites", period: "Semestre 1", coefficient: 1, score: mathScores2[i], comment: null },
      { studentId: s.id, teacherId: dubreuil.id, classId: l1.id, subject: "Mathématiques", evaluationTitle: "DS analyse", period: "Semestre 1", coefficient: 2, score: mathScores3[i], comment: "Soigner la rédaction." },
      { studentId: s.id, teacherId: ndiaye.id, classId: l1.id, subject: "Physique", evaluationTitle: "TP pendule", period: "Semestre 1", coefficient: 1, score: physScores[i], comment: null },
      { studentId: s.id, teacherId: ndiaye.id, classId: l1.id, subject: "Physique", evaluationTitle: "Contrôle mécanique", period: "Semestre 1", coefficient: 2, score: physScores2[i], comment: "Incertitudes à revoir." },
      { studentId: s.id, teacherId: fall.id, classId: l1.id, subject: "Littérature", evaluationTitle: "Dissertation n°1", period: "Semestre 1", coefficient: 2, score: littScores[i], comment: "Problématique claire." },
      { studentId: s.id, teacherId: fall.id, classId: l1.id, subject: "Littérature", evaluationTitle: "Oral exposé", period: "Semestre 1", coefficient: 1, score: littScores2[i], comment: null },
      { studentId: s.id, teacherId: fall.id, classId: l1.id, subject: "Littérature", evaluationTitle: "Commentaire", period: "Semestre 1", coefficient: 2, score: littScores3[i], comment: "Belle lecture du texte." },
    );
  });
  await db.insert(grades).values(gradeRows);

  await db.insert(cahierSessions).values([
    {
      classId: l1.id,
      teacherId: dubreuil.id,
      subject: "Mathématiques",
      date: addDaysISO(-1),
      title: "Suites numériques et limites",
      summary: "Introduction aux suites arithmétiques et géométriques. Étude de la convergence et calcul des limites usuelles, y compris les formes indéterminées.",
      workAssigned: "Exercices 12 à 18 p. 94 — à rendre jeudi.",
    },
    {
      classId: l1.id,
      teacherId: ndiaye.id,
      subject: "Physique",
      date: addDaysISO(-2),
      title: "Oscillations mécaniques",
      summary: "Modélisation du pendule simple, petite oscillation, mesure de g. Discussion des sources d'erreur et de la linéarisation sin θ ≈ θ.",
      workAssigned: "Compte rendu du TP à déposer avant ce soir.",
    },
    {
      classId: l1.id,
      teacherId: fall.id,
      subject: "Littérature",
      date: addDaysISO(-3),
      title: "Senghor, poétique de la négritude",
      summary: "Lecture analytique de « Femme noire ». Images, rythme, rapport au corps et à la terre. Mise en perspective avec Césaire.",
      workAssigned: "Plan de dissertation sur le progrès — pour lundi.",
    },
    {
      classId: l1.id,
      teacherId: dubreuil.id,
      subject: "Mathématiques",
      date: addDaysISO(-5),
      title: "Dérivation et théorème des accroissements finis",
      summary: "Rappel des formules de dérivation. Applications à l'étude des variations. Première approche du TAF.",
      workAssigned: "Fiche méthode à relire.",
    },
    {
      classId: l2.id,
      teacherId: fall.id,
      subject: "Littérature",
      date: addDaysISO(-1),
      title: "Le lyrisme chez Hugo",
      summary: "Étude des « Contemplations » : voix lyrique, deuil et sublime.",
      workAssigned: "Apprendre le poème commenté.",
    },
  ]);

  await db.insert(courses).values([
    { classId: l1.id, teacherId: dubreuil.id, subject: "Mathématiques", title: "Cours — Suites et limites", description: "Polycopié complet, exemples corrigés et méthodes pour les formes indéterminées." },
    { classId: l1.id, teacherId: dubreuil.id, subject: "Mathématiques", title: "Annales — analyse S1", description: "Sujets d'examen des trois dernières années, avec barème indicatif." },
    { classId: l1.id, teacherId: ndiaye.id, subject: "Physique", title: "Fiche TP pendule", description: "Protocole, tableau de mesures et modèle d'incertitude-type." },
    { classId: l1.id, teacherId: ndiaye.id, subject: "Physique", title: "Cours — mécanique du point", description: "Lois de Newton, énergie mécanique, oscillations." },
    { classId: l1.id, teacherId: fall.id, subject: "Littérature", title: "Anthologie Senghor & Césaire", description: "Textes annotés pour le commentaire composé." },
    { classId: l1.id, teacherId: fall.id, subject: "Littérature", title: "Méthode de la dissertation", description: "Problématique, plan dialectique, transitions et ouverture." },
  ]);

  await db.insert(announcements).values([
    {
      title: "Conseil de faculté — jeudi 16 h",
      content: "Les délégués de promotion sont attendus en salle du conseil. Ordre du jour : calendrier des partiels et vie de campus.",
      authorId: admin.id,
    },
    {
      title: "Bibliothèque : horaires d'examen",
      content: "La médiathèque restera ouverte jusqu'à 21 h du lundi au samedi pendant la période des révisions.",
      authorId: admin.id,
    },
    {
      title: "Conférence : sciences et société",
      content: "Vendredi 18 h, amphithéâtre A. Entrée libre pour tous les étudiants de l'Université Soukoul.",
      authorId: admin.id,
    },
  ]);

  await db.insert(messages).values([
    {
      fromId: dubreuil.id,
      toId: lea.id,
      content: "Léa, excellent travail sur le dernier devoir. Pensez à relire le chapitre sur les suites géométriques avant jeudi.",
      read: false,
    },
    {
      fromId: fall.id,
      toId: lea.id,
      content: "Je vous attends en tutorat mercredi à 12 h 15 si vous souhaitez retravailler l'introduction de la dissertation.",
      read: false,
    },
  ]);

  await db.insert(absences).values([
    { studentId: amadou.id, classId: l1.id, type: "absence", date: todayISO(), timeSlot: "matin", reason: "Rendez-vous médical", justified: false, reportedBy: dubreuil.id },
    { studentId: cheikh.id, classId: l1.id, type: "retard", date: todayISO(), timeSlot: "matin", reason: "Transport", justified: false, reportedBy: ndiaye.id },
    { studentId: aissa.id, classId: l1.id, type: "absence", date: addDaysISO(-3), timeSlot: "journee", reason: "Certificat médical", justified: true, reportedBy: fall.id },
    { studentId: ibrahim.id, classId: l1.id, type: "retard", date: addDaysISO(-1), timeSlot: "apres-midi", reason: null, justified: false, reportedBy: dubreuil.id },
    { studentId: moussa.id, classId: l1.id, type: "absence", date: addDaysISO(-7), timeSlot: "matin", reason: "Convocation administrative", justified: true, reportedBy: admin.id },
  ]);

  await db.insert(notifications).values([
    { userId: lea.id, type: "notes", title: "Nouvelle note en mathématiques", body: "DS analyse — 17/20", tab: "notes", read: false },
    { userId: lea.id, type: "devoirs", title: "Devoir à rendre demain", body: "Suites numériques, M. Dubreuil", tab: "devoirs", read: false },
    { userId: lea.id, type: "annonces", title: "Conseil de faculté", body: "Jeudi 16 h, salle du conseil", tab: "home", read: false },
    { userId: lea.id, type: "messages", title: "Message de M. Dubreuil", body: "Retour sur votre dernier devoir", tab: "messages", read: false },
    { userId: lea.id, type: "cours", title: "Nouveau support", body: "Annales d'analyse S1 disponibles", tab: "classes", read: true },
    { userId: dubreuil.id, type: "devoirs", title: "Rappels de copies", body: "Le devoir de L1 Sciences arrive à échéance demain.", tab: "devoirs", read: false },
    { userId: dubreuil.id, type: "annonces", title: "Conseil de faculté", body: "Jeudi 16 h", tab: "home", read: false },
    { userId: admin.id, type: "annonces", title: "Absences du jour", body: "Deux événements à justifier en L1 Sciences.", tab: "absences", read: false },
  ]);
}

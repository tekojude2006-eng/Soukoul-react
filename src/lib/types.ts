export type Role = "student" | "teacher" | "admin";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  firstLogin: boolean;
  phone: string | null;
  subject: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  classId: number | null;
  className: string | null;
};

export type ClassRecord = {
  id: number;
  name: string;
  room: string | null;
  principalTeacherId: number | null;
  principalName: string | null;
  studentCount: number;
};

export type Person = {
  id: number;
  name: string;
  email: string;
  role: Role;
  firstLogin?: boolean;
  phone: string | null;
  subject: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  classId: number | null;
  className: string | null;
  classIds: number[];
  classNames: string[];
  createdAt: string;
};

export type ScheduleSlot = {
  id: number;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  subject: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  color: string;
};

export type Homework = {
  id: number;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  subject: string | null;
  title: string;
  description: string | null;
  dueDate: string;
  completed: boolean;
};

export type Grade = {
  id: number;
  studentId: number;
  studentName: string;
  teacherId: number;
  teacherName: string;
  classId: number;
  subject: string;
  evaluationTitle: string;
  period: string;
  coefficient: number;
  score: number | null;
  comment: string | null;
  createdAt: string;
};

export type CahierSession = {
  id: number;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  subject: string;
  date: string;
  title: string;
  summary: string | null;
  workAssigned: string | null;
};

export type Absence = {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  type: "absence" | "retard";
  date: string;
  timeSlot: string;
  reason: string | null;
  justified: boolean;
};

export type Course = {
  id: number;
  classId: number;
  className?: string;
  teacherId: number;
  teacherName: string;
  subject: string;
  title: string;
  description: string | null;
  content: string | null;
  attachmentName: string | null;
  attachmentUrl: string | null;
  createdAt: string;
};

export type Announcement = {
  id: number;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
};

export type Message = {
  id: number;
  fromId: number;
  fromName: string;
  toId: number;
  content: string;
  read: boolean;
  createdAt: string;
};

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  tab: string | null;
  read: boolean;
  createdAt: string;
};

export type AdminStats = {
  students: number;
  teachers: number;
  classes: number;
  rooms: number;
  absencesToday: number;
  unjustified: number;
};

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  tab: string;
  createdAt: string;
};

export type Bootstrap = {
  user: SessionUser;
  classes: ClassRecord[];
  people: Person[];
  schedules: ScheduleSlot[];
  homeworks: Homework[];
  grades: Grade[];
  sessions: CahierSession[];
  absences: Absence[];
  courses: Course[];
  announcements: Announcement[];
  messages: Message[];
  notifications: NotificationItem[];
  activity: ActivityItem[];
  stats: AdminStats | null;
};

export const PERIODS = [
  "Semestre 1",
  "Semestre 2",
  "Trimestre 1",
  "Trimestre 2",
  "Trimestre 3",
] as const;

export const DAYS = [
  { id: 1, label: "Lundi", short: "Lun" },
  { id: 2, label: "Mardi", short: "Mar" },
  { id: 3, label: "Mercredi", short: "Mer" },
  { id: 4, label: "Jeudi", short: "Jeu" },
  { id: 5, label: "Vendredi", short: "Ven" },
  { id: 6, label: "Samedi", short: "Sam" },
] as const;

export const TIME_SLOTS = [
  { id: "matin", label: "Matin" },
  { id: "apres-midi", label: "Après-midi" },
  { id: "journee", label: "Journée" },
] as const;

export const SUBJECT_COLORS: Record<string, string> = {
  Mathématiques: "#3d5a80",
  Physique: "#6d4c91",
  Littérature: "#8c4a3a",
  Économie: "#2d6a4f",
  Droit: "#1d3557",
  Anglais: "#9a6b2f",
  Histoire: "#7a5c45",
};

import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  firstLogin: boolean("first_login").notNull().default(true),
  recoveryCode: text("recovery_code"),
  phone: text("phone"),
  subject: text("subject"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  classId: integer("class_id"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  room: text("room"),
  principalTeacherId: integer("principal_teacher_id"),
});

export const classTeachers = pgTable(
  "class_teachers",
  {
    classId: integer("class_id").notNull(),
    teacherId: integer("teacher_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.classId, t.teacherId] })],
);

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  subject: text("subject").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room"),
  color: text("color").notNull(),
});

export const homeworks = pgTable("homeworks", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  subject: text("subject"),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const homeworkCompletions = pgTable(
  "homework_completions",
  {
    homeworkId: integer("homework_id").notNull(),
    studentId: integer("student_id").notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.homeworkId, t.studentId] })],
);

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  classId: integer("class_id").notNull(),
  subject: text("subject").notNull(),
  evaluationTitle: text("evaluation_title").notNull(),
  period: text("period").notNull(),
  coefficient: integer("coefficient").notNull().default(1),
  score: real("score"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const cahierSessions = pgTable("cahier_sessions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  subject: text("subject").notNull(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  workAssigned: text("work_assigned"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const absences = pgTable("absences", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id").notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  reason: text("reason"),
  justified: boolean("justified").notNull().default(false),
  reportedBy: integer("reported_by"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromId: integer("from_id").notNull(),
  toId: integer("to_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  tab: text("tab"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  attachmentName: text("attachment_name"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh"),
  auth: text("auth"),
});

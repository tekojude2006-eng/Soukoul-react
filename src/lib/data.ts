import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
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
import type {
  Absence,
  ActivityItem,
  AdminStats,
  Announcement,
  Bootstrap,
  CahierSession,
  ClassRecord,
  Course,
  Grade,
  Homework,
  Message,
  NotificationItem,
  Person,
  Role,
  ScheduleSlot,
  SessionUser,
} from "@/lib/types";
import { todayISO } from "@/lib/utils";

function mapPerson(
  u: typeof users.$inferSelect,
  classMap: Map<number, string>,
  teacherClassIds: Map<number, number[]>,
): Person {
  const classIds = u.role === "teacher" ? (teacherClassIds.get(u.id) ?? []) : u.classId ? [u.classId] : [];
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    firstLogin: u.firstLogin,
    phone: u.phone,
    subject: u.subject,
    avatarUrl: u.avatarUrl ?? null,
    bio: u.bio ?? null,
    classId: u.classId,
    className: u.classId ? classMap.get(u.classId) ?? null : null,
    classIds,
    classNames: classIds.map((id) => classMap.get(id) ?? "").filter(Boolean),
    createdAt: u.createdAt.toISOString(),
  };
}

export async function getBootstrap(user: SessionUser): Promise<Bootstrap> {
  const allClasses = await db.select().from(classes);
  const allUsers = await db.select().from(users);
  const allLinks = await db.select().from(classTeachers);
  const classMap = new Map(allClasses.map((c) => [c.id, c.name]));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const teacherClassIds = new Map<number, number[]>();
  for (const link of allLinks) {
    const arr = teacherClassIds.get(link.teacherId) ?? [];
    arr.push(link.classId);
    teacherClassIds.set(link.teacherId, arr);
  }

  const studentCounts = new Map<number, number>();
  for (const u of allUsers) {
    if (u.role === "student" && u.classId) {
      studentCounts.set(u.classId, (studentCounts.get(u.classId) ?? 0) + 1);
    }
  }

  const classRecords: ClassRecord[] = allClasses.map((c) => ({
    id: c.id,
    name: c.name,
    room: c.room,
    principalTeacherId: c.principalTeacherId,
    principalName: c.principalTeacherId ? (userMap.get(c.principalTeacherId)?.name ?? null) : null,
    studentCount: studentCounts.get(c.id) ?? 0,
  }));

  let visibleClassIds: number[] = allClasses.map((c) => c.id);
  if (user.role === "student" && user.classId) {
    visibleClassIds = [user.classId];
  } else if (user.role === "teacher") {
    visibleClassIds = teacherClassIds.get(user.id) ?? [];
  }

  const allSchedules = await db.select().from(schedules);
  const scheduleRows =
    user.role === "admin"
      ? allSchedules
      : user.role === "teacher"
        ? allSchedules.filter((s) => s.teacherId === user.id)
        : allSchedules.filter((s) => visibleClassIds.includes(s.classId));

  const scheduleDtos: ScheduleSlot[] = scheduleRows.map((s) => ({
    id: s.id,
    classId: s.classId,
    className: classMap.get(s.classId) ?? "",
    teacherId: s.teacherId,
    teacherName: userMap.get(s.teacherId)?.name ?? "",
    subject: s.subject,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
    color: s.color,
  }));

  const hwRows =
    visibleClassIds.length > 0
      ? await db.select().from(homeworks).where(inArray(homeworks.classId, visibleClassIds)).orderBy(desc(homeworks.dueDate))
      : [];
  const completions =
    user.role === "student"
      ? await db.select().from(homeworkCompletions).where(eq(homeworkCompletions.studentId, user.id))
      : await db.select().from(homeworkCompletions);
  const completedSet = new Set(
    completions.filter((c) => (user.role === "student" ? true : true)).map((c) => `${c.homeworkId}:${c.studentId}`),
  );

  const homeworkDtos: Homework[] = hwRows.map((h) => ({
    id: h.id,
    classId: h.classId,
    className: classMap.get(h.classId) ?? "",
    teacherId: h.teacherId,
    teacherName: userMap.get(h.teacherId)?.name ?? "",
    subject: h.subject,
    title: h.title,
    description: h.description,
    dueDate: h.dueDate,
    completed:
      user.role === "student" ? completedSet.has(`${h.id}:${user.id}`) : false,
  }));

  const gradeRows =
    user.role === "student"
      ? await db.select().from(grades).where(eq(grades.studentId, user.id))
      : visibleClassIds.length
        ? await db.select().from(grades).where(inArray(grades.classId, visibleClassIds))
        : [];

  const gradeDtos: Grade[] = gradeRows.map((g) => ({
    id: g.id,
    studentId: g.studentId,
    studentName: userMap.get(g.studentId)?.name ?? "",
    teacherId: g.teacherId,
    teacherName: userMap.get(g.teacherId)?.name ?? "",
    classId: g.classId,
    subject: g.subject,
    evaluationTitle: g.evaluationTitle,
    period: g.period,
    coefficient: g.coefficient,
    score: g.score,
    comment: g.comment,
    createdAt: g.createdAt.toISOString(),
  }));

  const sessionRows =
    visibleClassIds.length
      ? await db.select().from(cahierSessions).where(inArray(cahierSessions.classId, visibleClassIds)).orderBy(desc(cahierSessions.date))
      : [];
  const sessionDtos: CahierSession[] = sessionRows.map((s) => ({
    id: s.id,
    classId: s.classId,
    className: classMap.get(s.classId) ?? "",
    teacherId: s.teacherId,
    teacherName: userMap.get(s.teacherId)?.name ?? "",
    subject: s.subject,
    date: s.date,
    title: s.title,
    summary: s.summary,
    workAssigned: s.workAssigned,
  }));

  const absenceRows =
    user.role === "student"
      ? await db.select().from(absences).where(eq(absences.studentId, user.id))
      : visibleClassIds.length
        ? await db.select().from(absences).where(inArray(absences.classId, visibleClassIds)).orderBy(desc(absences.date))
        : [];
  const absenceDtos: Absence[] = absenceRows.map((a) => ({
    id: a.id,
    studentId: a.studentId,
    studentName: userMap.get(a.studentId)?.name ?? "",
    classId: a.classId,
    className: classMap.get(a.classId) ?? "",
    type: a.type as "absence" | "retard",
    date: a.date,
    timeSlot: a.timeSlot,
    reason: a.reason,
    justified: a.justified,
  }));

  const courseRows =
    visibleClassIds.length
      ? await db.select().from(courses).where(inArray(courses.classId, visibleClassIds)).orderBy(desc(courses.createdAt))
      : [];
  const courseDtos: Course[] = courseRows.map((c) => ({
    id: c.id,
    classId: c.classId,
    className: classMap.get(c.classId) ?? "",
    teacherId: c.teacherId,
    teacherName: userMap.get(c.teacherId)?.name ?? "",
    subject: c.subject,
    title: c.title,
    description: c.description,
    content: c.content ?? null,
    attachmentName: c.attachmentName ?? null,
    attachmentUrl: c.attachmentUrl ?? null,
    createdAt: c.createdAt.toISOString(),
  }));

  const announcementRows = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  const announcementDtos: Announcement[] = announcementRows.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    authorName: userMap.get(a.authorId)?.name ?? "Administration",
    createdAt: a.createdAt.toISOString(),
  }));

  const messageRows =
    user.role === "student" || user.role === "teacher"
      ? await db
          .select()
          .from(messages)
          .where(or(eq(messages.toId, user.id), eq(messages.fromId, user.id)))
          .orderBy(desc(messages.createdAt))
      : await db.select().from(messages).orderBy(desc(messages.createdAt));
  const messageDtos: Message[] = messageRows.map((m) => ({
    id: m.id,
    fromId: m.fromId,
    fromName: userMap.get(m.fromId)?.name ?? "",
    toId: m.toId,
    content: m.content,
    read: m.read,
    createdAt: m.createdAt.toISOString(),
  }));

  const notifRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt));
  const notifDtos: NotificationItem[] = notifRows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    tab: n.tab,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  let people: Person[] = [];
  if (user.role === "admin") {
    people = allUsers.map((u) => mapPerson(u, classMap, teacherClassIds));
  } else if (user.role === "teacher") {
    people = allUsers
      .filter((u) => u.role === "student" && u.classId && visibleClassIds.includes(u.classId))
      .map((u) => mapPerson(u, classMap, teacherClassIds));
  } else {
    const teacherIds = allLinks.filter((l) => l.classId === user.classId).map((l) => l.teacherId);
    people = allUsers
      .filter((u) => teacherIds.includes(u.id))
      .map((u) => mapPerson(u, classMap, teacherClassIds));
  }

  const visibleClasses = user.role === "admin" ? classRecords : classRecords.filter((c) => visibleClassIds.includes(c.id));

  const activity: ActivityItem[] = [];
  for (const n of notifDtos.slice(0, 8)) {
    activity.push({
      id: `n-${n.id}`,
      type: n.type,
      title: n.title,
      body: n.body ?? "",
      tab: n.tab ?? "home",
      createdAt: n.createdAt,
    });
  }
  if (activity.length < 4) {
    for (const g of gradeDtos.slice(0, 3)) {
      activity.push({
        id: `g-${g.id}`,
        type: "notes",
        title: `Note — ${g.subject}`,
        body: `${g.evaluationTitle} · ${g.score}/20`,
        tab: "notes",
        createdAt: g.createdAt,
      });
    }
  }

  let stats: AdminStats | null = null;
  if (user.role === "admin") {
    const rooms = new Set(allClasses.map((c) => c.room).filter(Boolean));
    const today = todayISO();
    stats = {
      students: allUsers.filter((u) => u.role === "student").length,
      teachers: allUsers.filter((u) => u.role === "teacher").length,
      classes: allClasses.length,
      rooms: rooms.size,
      absencesToday: absenceDtos.filter((a) => a.date === today).length,
      unjustified: absenceDtos.filter((a) => !a.justified).length,
    };
  }

  return {
    user,
    classes: visibleClasses,
    people,
    schedules: scheduleDtos,
    homeworks: homeworkDtos,
    grades: gradeDtos,
    sessions: sessionDtos,
    absences: absenceDtos,
    courses: courseDtos,
    announcements: announcementDtos,
    messages: messageDtos,
    notifications: notifDtos,
    activity: activity
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 6),
    stats,
  };
}

export async function notify(userId: number, type: string, title: string, body: string, tab: string) {
  await db.insert(notifications).values({ userId, type, title, body, tab, read: false });
}

export async function getAdminStats(): Promise<AdminStats> {
  const allUsers = await db.select().from(users);
  const allClasses = await db.select().from(classes);
  const allAbs = await db.select().from(absences);
  const today = todayISO();
  const rooms = new Set(allClasses.map((c) => c.room).filter(Boolean));
  return {
    students: allUsers.filter((u) => u.role === "student").length,
    teachers: allUsers.filter((u) => u.role === "teacher").length,
    classes: allClasses.length,
    rooms: rooms.size,
    absencesToday: allAbs.filter((a) => a.date === today).length,
    unjustified: allAbs.filter((a) => !a.justified).length,
  };
}

export { sql, and, eq, inArray };

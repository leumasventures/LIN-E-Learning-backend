import bcrypt from "bcryptjs";

export type Role = "student" | "admin" | "lecturer";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  matric: string | null;
  role: Role;
  tenantName: string;
  passwordHash: string;
  isActive: boolean;
}

export interface CourseRecord {
  id: string;
  code: string;
  title: string;
  lecturerId: string | null;
  lecturerName: string;
  units: number;
  duration: string;
  certification: string;
  status: "Active" | "Draft";
  description?: string;
}

export interface LessonRecord {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  order: number;
  content: string;
}

export interface EnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  lessonsCompleted: number;
  enrolledAt: string;
}

export interface QuestionRecord {
  id: string;
  courseId: string;
  type: "MCQ" | "True/False";
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
}

export interface ExamRecord {
  id: string;
  title: string;
  courseId: string;
  durationMinutes: number;
  questionIds: string[];
  startDate: string;
  status: "Scheduled" | "Active" | "Closed";
}

export interface ResultRecord {
  id: string;
  userId: string;
  examId: string;
  courseId: string;
  score: number;
  total: number;
  submittedAt: string;
}

const hash = bcrypt.hashSync("Password123!", 10);

export const users: UserRecord[] = [];
export const courses: CourseRecord[] = [];
export const lessons: LessonRecord[] = [];
export const enrollments: EnrollmentRecord[] = [];
export const questions: QuestionRecord[] = [];
export const exams: ExamRecord[] = [];
export const results: ResultRecord[] = [];

/** refreshToken -> userId */
export const refreshStore = new Map<string, string>();

export function publicUser(u: UserRecord) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    matric: u.matric,
    tenantName: u.tenantName,
  };
}

export function findUserById(id: string) {
  return users.find((u) => u.id === id);
}

export function findUserByIdentifier(identifier: string) {
  const key = identifier.trim().toLowerCase();
  return users.find(
    (u) =>
      u.email.toLowerCase() === key ||
      (u.matric !== null && u.matric.toLowerCase() === key)
  );
}

export function nextId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
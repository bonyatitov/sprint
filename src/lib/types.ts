export type SubjectCategory = "course" | "extra";

export interface Subject {
  id: string;
  name: string;
  hours: number;
  category: SubjectCategory;
}

export interface SprintSettings {
  startDate: string; // ISO yyyy-mm-dd
  weeksCount: number;
  daysOff: number[]; // 0 = Sunday ... 6 = Saturday
}

export interface ScheduleEntry {
  subjectId: string;
  minutes: number;
  done: boolean;
}

export interface ScheduleDay {
  date: string; // ISO yyyy-mm-dd
  weekIndex: number;
  isWorkDay: boolean;
  entries: ScheduleEntry[];
}

export interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
}

export interface SmartLoadSettings {
  enabled: boolean;
  age: number;
}

export type WorkSchedulePattern = "manual" | "1/3" | "5/2" | "2/2";

export interface WorkScheduleSettings {
  pattern: WorkSchedulePattern;
  cycleStartDate: string; // ISO date of the first work day of the cycle
}

export interface AppState {
  subjects: Subject[];
  settings: SprintSettings;
  workDays: string[]; // ISO dates fully blocked (no study at all) — excluded from distribution
  lightDays: string[]; // ISO dates with a shift but evenings free — reduced load, not excluded
  workSchedule: WorkScheduleSettings;
  pomodoroSettings: PomodoroSettings;
  smartLoad: SmartLoadSettings;
  notes: Record<string, string>; // keyed by "date:subjectId" — a free-text note for that day's occurrence of a subject
  schedule: ScheduleDay[] | null;
}

import type {
  ScheduleDay,
  ScheduleEntry,
  SmartLoadSettings,
  SprintSettings,
  Subject,
  WorkSchedulePattern,
  WorkScheduleSettings,
} from "./types";

function toLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function previousIsoDate(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`);

  date.setDate(date.getDate() - 1);

  return toLocalIso(date);
}

/**
 * Simplified heuristic, not a medical or clinically validated figure: roughly how many
 * distinct subjects a day can juggle before context-switching starts hurting retention.
 * Younger learners get more slots; the cap tightens with age.
 */
export function maxSubjectsPerDayForAge(age: number): number {
  if (age < 30) return 3;
  if (age < 60) return 2;

  return 1;
}

/** Splits `total` items across `slots` buckets as evenly as possible; every bucket differs by at most 1. */
function distributeEvenly(total: number, slots: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < slots; i++) {
    const upTo = Math.floor(((i + 1) * total) / slots);
    const from = Math.floor((i * total) / slots);

    result.push(upTo - from);
  }

  return result;
}

export function buildStudyDates(
  settings: SprintSettings,
): { date: string; weekIndex: number }[] {
  const days: { date: string; weekIndex: number }[] = [];
  const start = new Date(`${settings.startDate}T00:00:00`);
  const totalCalendarDays = settings.weeksCount * 7;

  for (let i = 0; i < totalCalendarDays; i++) {
    const current = new Date(start);

    current.setDate(start.getDate() + i);
    if (settings.daysOff.includes(current.getDay())) continue;
    days.push({
      date: toLocalIso(current),
      weekIndex: Math.floor(i / 7),
    });
  }

  return days;
}

/**
 * work/rest day counts for every non-manual work schedule preset.
 * `blocksStudy` marks whether a work day leaves any energy for study at all:
 * true for shifts long enough to rule that out (24h, 12h), false for a
 * standard 8h day where evenings are still free — that day stays a (lighter)
 * study day instead of disappearing from the schedule.
 */
export const WORK_SCHEDULE_CYCLES: Record<
  Exclude<WorkSchedulePattern, "manual">,
  { work: number; rest: number; label: string; blocksStudy: boolean }
> = {
  "1/3": { work: 1, rest: 3, label: "Сутки/трое (24 часа)", blocksStudy: true },
  "5/2": { work: 5, rest: 2, label: "5/2 (8 часов)", blocksStudy: false },
  "2/2": { work: 2, rest: 2, label: "2/2 (12 часов)", blocksStudy: true },
};

/**
 * Fills in every work day a rotating shift pattern produces across the
 * sprint's date range, counting the cycle from `cycleStartDate` (the first
 * work day of the rotation) — e.g. 5/2 marks 5 work days, then skips 2, on
 * repeat, regardless of where that lands relative to the calendar week.
 *
 * The result is split by whether the shift leaves any study time: patterns
 * with `blocksStudy` land in `workDays` (fully excluded); the rest land in
 * `lightDays` (still a study day, just at reduced, evening-only capacity).
 */
export function generateWorkDaysFromPattern(
  settings: SprintSettings,
  workSchedule: WorkScheduleSettings,
): { workDays: string[]; lightDays: string[] } {
  if (workSchedule.pattern === "manual") return { workDays: [], lightDays: [] };

  const start = new Date(`${settings.startDate}T00:00:00`);
  const totalDays = settings.weeksCount * 7;

  // 5/2 means an ordinary calendar work week — Monday through Friday, every
  // single week — not a rolling cycle. Anchoring it to a cycle start date
  // (like the shift patterns below) would let the 5 work days drift onto
  // weekends instead of always landing on weekdays.
  if (workSchedule.pattern === "5/2") {
    const lightDays: string[] = [];

    for (let i = 0; i < totalDays; i++) {
      const current = new Date(start);

      current.setDate(start.getDate() + i);

      const weekday = current.getDay(); // 0 = Sunday … 6 = Saturday

      if (weekday >= 1 && weekday <= 5) lightDays.push(toLocalIso(current));
    }

    return { workDays: [], lightDays };
  }

  const cycle = WORK_SCHEDULE_CYCLES[workSchedule.pattern];
  const cycleLength = cycle.work + cycle.rest;
  const cycleStart = new Date(`${workSchedule.cycleStartDate}T00:00:00`);
  const msPerDay = 24 * 60 * 60 * 1000;
  const shiftDays: string[] = [];

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(start);

    current.setDate(start.getDate() + i);

    const diffDays = Math.round(
      (current.getTime() - cycleStart.getTime()) / msPerDay,
    );
    const positionInCycle =
      ((diffDays % cycleLength) + cycleLength) % cycleLength;

    if (positionInCycle < cycle.work) shiftDays.push(toLocalIso(current));
  }

  return cycle.blocksStudy
    ? { workDays: shiftDays, lightDays: [] }
    : { workDays: [], lightDays: shiftDays };
}

/**
 * Decides, for each study day, which subjects get any time at all.
 *
 * With smart load off, every subject is present every study day (the original
 * flat behaviour). With it on: the course subject(s) get priority every day,
 * extra subjects rotate round-robin through the remaining slots. Two kinds of
 * days are deliberately kept to the course alone instead of piling every
 * subject on top of a shift: the day right after a fully-blocked work shift
 * (a recovery day), and a "light" day itself — a shift that still leaves
 * evenings free, so it stays lighter rather than fully disappearing.
 *
 * A day's slot cap is never allowed to starve a whole subject category
 * forever: it's widened to fit at least all course subjects plus one extra
 * slot whenever extras exist, so nobody's hours end up with nowhere to go.
 */
function planSubjectPresence(
  studyDays: { date: string; weekIndex: number }[],
  subjects: Subject[],
  workDaySet: Set<string>,
  lightDaySet: Set<string>,
  smartLoad: SmartLoadSettings,
): Map<string, Set<string>> {
  const presence = new Map<string, Set<string>>();

  if (!smartLoad.enabled) {
    const allIds = subjects.map((s) => s.id);

    for (const day of studyDays) presence.set(day.date, new Set(allIds));

    return presence;
  }

  const courseIds = subjects
    .filter((s) => s.category === "course")
    .map((s) => s.id);
  const extraIds = subjects
    .filter((s) => s.category === "extra")
    .map((s) => s.id);
  const baseCap = maxSubjectsPerDayForAge(smartLoad.age);
  const minRequiredCap = courseIds.length + (extraIds.length > 0 ? 1 : 0);
  const normalCap = Math.max(baseCap, minRequiredCap, 1);

  let extraPointer = 0;

  for (const day of studyDays) {
    const isRecoveryDay =
      workDaySet.has(previousIsoDate(day.date)) || lightDaySet.has(day.date);
    const active = new Set<string>();

    if (isRecoveryDay) {
      if (courseIds.length > 0) {
        active.add(courseIds[0]);
      } else if (extraIds.length > 0) {
        active.add(extraIds[extraPointer % extraIds.length]);
        extraPointer += 1;
      }
    } else {
      for (const id of courseIds) {
        if (active.size >= normalCap) break;
        active.add(id);
      }

      const remainingSlots = normalCap - active.size;

      if (remainingSlots > 0 && extraIds.length > 0) {
        const count = Math.min(remainingSlots, extraIds.length);

        for (let i = 0; i < count; i++) {
          active.add(extraIds[(extraPointer + i) % extraIds.length]);
        }
        extraPointer += count;
      }
    }

    presence.set(day.date, active);
  }

  return presence;
}

export function generateSchedule(
  subjects: Subject[],
  settings: SprintSettings,
  workDays: string[],
  lightDays: string[],
  smartLoad: SmartLoadSettings,
): ScheduleDay[] {
  const candidates = buildStudyDates(settings);
  const workDaySet = new Set(workDays);
  const lightDaySet = new Set(lightDays);
  const studyDays = candidates.filter((day) => !workDaySet.has(day.date));

  if (studyDays.length === 0 || subjects.length === 0) {
    return candidates.map((day) => ({
      date: day.date,
      weekIndex: day.weekIndex,
      isWorkDay: workDaySet.has(day.date),
      entries: [],
    }));
  }

  const presenceByDate = planSubjectPresence(
    studyDays,
    subjects,
    workDaySet,
    lightDaySet,
    smartLoad,
  );

  const activeDatesBySubject = new Map<string, string[]>();

  for (const subject of subjects) activeDatesBySubject.set(subject.id, []);
  for (const day of studyDays) {
    const active = presenceByDate.get(day.date);

    if (!active) continue;
    for (const subjectId of active) {
      activeDatesBySubject.get(subjectId)?.push(day.date);
    }
  }

  // Safety net for pathological configs (e.g. every study day happens to be a
  // recovery day): a subject with hours booked must never end up scheduled
  // nowhere, so it falls back to every study day instead of losing its time.
  for (const subject of subjects) {
    if (subject.hours <= 0) continue;
    if (activeDatesBySubject.get(subject.id)!.length > 0) continue;

    const allDates = studyDays.map((d) => d.date);

    activeDatesBySubject.set(subject.id, allDates);
    for (const date of allDates) presenceByDate.get(date)?.add(subject.id);
  }

  const minutesBySubjectByDate = new Map<string, Map<string, number>>();

  for (const subject of subjects) {
    const dates = activeDatesBySubject.get(subject.id)!;
    const totalMinutes = Math.round(subject.hours * 60);
    const perDay = distributeEvenly(totalMinutes, Math.max(dates.length, 1));
    const byDate = new Map<string, number>();

    dates.forEach((date, i) => byDate.set(date, perDay[i]));
    minutesBySubjectByDate.set(subject.id, byDate);
  }

  return candidates.map((day) => {
    const isWorkDay = workDaySet.has(day.date);

    if (isWorkDay) {
      return {
        date: day.date,
        weekIndex: day.weekIndex,
        isWorkDay,
        entries: [],
      };
    }

    const activeIds = presenceByDate.get(day.date) ?? new Set<string>();
    const entries: ScheduleEntry[] = [];

    for (const subject of subjects) {
      if (!activeIds.has(subject.id)) continue;

      const minutes =
        minutesBySubjectByDate.get(subject.id)?.get(day.date) ?? 0;

      entries.push({ subjectId: subject.id, minutes, done: false });
    }

    return {
      date: day.date,
      weekIndex: day.weekIndex,
      isWorkDay: false,
      entries,
    };
  });
}

/** Carries "done" flags over from the previous schedule for entries that still exist (same date + subject), so editing hours or toggling work days doesn't wipe unrelated progress. */
export function preserveProgress(
  next: ScheduleDay[],
  previous: ScheduleDay[] | null,
): ScheduleDay[] {
  if (!previous) return next;

  const doneKeys = new Set<string>();

  for (const day of previous) {
    for (const entry of day.entries) {
      if (entry.done) doneKeys.add(`${day.date}:${entry.subjectId}`);
    }
  }

  if (doneKeys.size === 0) return next;

  return next.map((day) => ({
    ...day,
    entries: day.entries.map((entry) =>
      doneKeys.has(`${day.date}:${entry.subjectId}`)
        ? { ...entry, done: true }
        : entry,
    ),
  }));
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 мин";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;

  return `${h} ч ${m} мин`;
}

export const WEEKDAY_LABELS = [
  "Вс",
  "Пн",
  "Вт",
  "Ср",
  "Чт",
  "Пт",
  "Сб",
] as const;

export function formatDayLabel(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const day = date.getDate();
  const month = date.toLocaleDateString("ru-RU", { month: "short" });

  return `${weekday}, ${day} ${month}`;
}

export interface SubjectProgress {
  subjectId: string;
  totalMinutes: number;
  doneMinutes: number;
}

export function computeProgress(
  schedule: ScheduleDay[] | null,
  subjects: Subject[],
): {
  overallTotal: number;
  overallDone: number;
  bySubject: SubjectProgress[];
} {
  const bySubject: SubjectProgress[] = subjects.map((s) => ({
    subjectId: s.id,
    totalMinutes: 0,
    doneMinutes: 0,
  }));
  const byId = new Map(bySubject.map((p) => [p.subjectId, p]));

  if (schedule) {
    for (const day of schedule) {
      for (const entry of day.entries) {
        const progress = byId.get(entry.subjectId);

        if (!progress) continue;
        progress.totalMinutes += entry.minutes;
        if (entry.done) progress.doneMinutes += entry.minutes;
      }
    }
  }

  const overallTotal = bySubject.reduce((sum, p) => sum + p.totalMinutes, 0);
  const overallDone = bySubject.reduce((sum, p) => sum + p.doneMinutes, 0);

  return { overallTotal, overallDone, bySubject };
}

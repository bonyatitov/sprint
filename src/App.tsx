import type {
  AppState,
  PomodoroSettings,
  SmartLoadSettings,
  Subject,
  WorkScheduleSettings,
} from "@/lib/types";

import { useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useOverlayState } from "@heroui/react";

import { GradientBackdrop } from "@/components/GradientBackdrop";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { NoteModal } from "@/components/NoteModal";
import { ConfirmRegenerateModal } from "@/components/ConfirmRegenerateModal";
import { RestoreConfirmModal } from "@/components/RestoreConfirmModal";
import { SchedulePage } from "@/pages/SchedulePage";
import { NotesPage } from "@/pages/NotesPage";
import { HelpPage } from "@/pages/HelpPage";
import { useAppState, defaultState } from "@/hooks/useAppState";
import { usePomodoroTimers } from "@/hooks/usePomodoroTimers";
import { downloadBackup, parseBackupFile } from "@/lib/backup";
import {
  buildStudyDates,
  formatDayLabel,
  generateSchedule,
  generateWorkDaysFromPattern,
  preserveProgress,
} from "@/lib/schedule";

/** The active work/light-day lists: a running pattern (5/2, 2/2, 1/3) always recomputes them from the sprint's dates; "manual" leaves whatever was toggled by hand alone (and never produces light days — those only come from a running 5/2-style pattern). */
function deriveWorkSchedule(
  state: Pick<AppState, "settings" | "workSchedule" | "workDays">,
): { workDays: string[]; lightDays: string[] } {
  return state.workSchedule.pattern === "manual"
    ? { workDays: state.workDays, lightDays: [] }
    : generateWorkDaysFromPattern(state.settings, state.workSchedule);
}

/** Applies a partial change and, if a schedule already exists, rebuilds it from the updated state and carries over already-marked progress. A schedule that doesn't exist yet (never generated) is left untouched — the user still triggers the first generation manually. */
function withRegeneratedSchedule(
  prev: AppState,
  changes: Partial<AppState>,
): AppState {
  const merged = { ...prev, ...changes };
  const { workDays, lightDays } = deriveWorkSchedule(merged);
  const next = { ...merged, workDays, lightDays };
  const schedule = prev.schedule
    ? preserveProgress(
        generateSchedule(
          next.subjects,
          next.settings,
          next.workDays,
          next.lightDays,
          next.smartLoad,
        ),
        prev.schedule,
      )
    : prev.schedule;

  return { ...next, schedule };
}

function App() {
  const [state, setState] = useAppState();
  const confirmModal = useOverlayState();
  const settingsModal = useOverlayState();
  const restoreConfirmModal = useOverlayState();
  const pomodoro = usePomodoroTimers(state.pomodoroSettings);
  const [noteTarget, setNoteTarget] = useState<{
    date: string;
    subjectId: string;
  } | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<AppState | null>(null);

  const candidateDates = useMemo(
    () => buildStudyDates(state.settings),
    [state.settings],
  );
  const studyDaysCount = candidateDates.length;
  const workDaysCount = useMemo(
    () =>
      candidateDates.filter((day) => state.workDays.includes(day.date)).length,
    [candidateDates, state.workDays],
  );
  const lightDaysCount = useMemo(
    () =>
      candidateDates.filter((day) => state.lightDays.includes(day.date)).length,
    [candidateDates, state.lightDays],
  );

  const hasProgress = Boolean(
    state.schedule?.some((day) => day.entries.some((e) => e.done)),
  );

  const runGenerate = () => {
    setState((prev) => {
      const { workDays, lightDays } = deriveWorkSchedule(prev);

      return {
        ...prev,
        workDays,
        lightDays,
        schedule: preserveProgress(
          generateSchedule(
            prev.subjects,
            prev.settings,
            workDays,
            lightDays,
            prev.smartLoad,
          ),
          prev.schedule,
        ),
      };
    });
  };

  const handleToggleWorkDay = (date: string) => {
    setState((prev) =>
      withRegeneratedSchedule(prev, {
        // A hand-toggled day always wins: switch to manual so the pattern
        // generator doesn't overwrite it on the next settings change.
        workSchedule: { ...prev.workSchedule, pattern: "manual" },
        workDays: prev.workDays.includes(date)
          ? prev.workDays.filter((d) => d !== date)
          : [...prev.workDays, date],
      }),
    );
  };

  const handleGenerate = () => {
    if (hasProgress) {
      confirmModal.open();
    } else {
      runGenerate();
      settingsModal.close();
    }
  };

  const handleConfirmRegenerate = () => {
    runGenerate();
    settingsModal.close();
  };

  const handleAddSubject = (subject: Subject) => {
    setState((prev) =>
      withRegeneratedSchedule(prev, { subjects: [...prev.subjects, subject] }),
    );
  };

  const handleUpdateSubject = (id: string, patch: Partial<Subject>) => {
    setState((prev) =>
      withRegeneratedSchedule(prev, {
        subjects: prev.subjects.map((s) =>
          s.id === id ? { ...s, ...patch } : s,
        ),
      }),
    );
  };

  const handleRemoveSubject = (id: string) => {
    setState((prev) =>
      withRegeneratedSchedule(prev, {
        subjects: prev.subjects.filter((s) => s.id !== id),
      }),
    );
  };

  const handlePomodoroSettingsChange = (patch: Partial<PomodoroSettings>) => {
    setState((prev) => ({
      ...prev,
      pomodoroSettings: { ...prev.pomodoroSettings, ...patch },
    }));
  };

  const handleWorkScheduleChange = (patch: Partial<WorkScheduleSettings>) => {
    setState((prev) =>
      withRegeneratedSchedule(prev, {
        workSchedule: { ...prev.workSchedule, ...patch },
      }),
    );
  };

  const handleSmartLoadChange = (patch: Partial<SmartLoadSettings>) => {
    setState((prev) =>
      withRegeneratedSchedule(prev, {
        smartLoad: { ...prev.smartLoad, ...patch },
      }),
    );
  };

  const handleToggleEntry = (
    date: string,
    subjectId: string,
    done: boolean,
  ) => {
    setState((prev) => ({
      ...prev,
      schedule: prev.schedule
        ? prev.schedule.map((day) =>
            day.date === date
              ? {
                  ...day,
                  entries: day.entries.map((entry) =>
                    entry.subjectId === subjectId ? { ...entry, done } : entry,
                  ),
                }
              : day,
          )
        : prev.schedule,
    }));
  };

  const handleOpenNote = (date: string, subjectId: string) => {
    setNoteTarget({ date, subjectId });
  };

  const handleNoteValueChange = (value: string) => {
    if (!noteTarget) return;

    const key = `${noteTarget.date}:${noteTarget.subjectId}`;

    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, [key]: value },
    }));
  };

  const handleExportBackup = () => {
    downloadBackup(state);
  };

  const handleBackupFileSelected = async (file: File) => {
    try {
      const text = await file.text();
      const restored = parseBackupFile(text, defaultState());

      setBackupError(null);
      setPendingRestore(restored);
      restoreConfirmModal.open();
    } catch (err) {
      setBackupError(
        err instanceof Error ? err.message : "Не удалось прочитать файл.",
      );
    }
  };

  const handleConfirmRestore = () => {
    if (pendingRestore) setState(pendingRestore);
    setPendingRestore(null);
    settingsModal.close();
  };

  const noteKey = noteTarget
    ? `${noteTarget.date}:${noteTarget.subjectId}`
    : null;
  const noteSubjectName = noteTarget
    ? (state.subjects.find((s) => s.id === noteTarget.subjectId)?.name ?? "")
    : "";

  return (
    <div className="min-h-screen">
      <GradientBackdrop />
      <Header onOpenSettings={settingsModal.open} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Routes>
          <Route
            element={
              <SchedulePage
                notes={state.notes}
                pomodoro={pomodoro}
                schedule={state.schedule}
                subjects={state.subjects}
                weeksCount={state.settings.weeksCount}
                onOpenNote={handleOpenNote}
                onToggleEntry={handleToggleEntry}
                onToggleWorkDay={handleToggleWorkDay}
              />
            }
            path="/"
          />
          <Route
            element={
              <NotesPage
                notes={state.notes}
                schedule={state.schedule}
                subjects={state.subjects}
                onOpenNote={handleOpenNote}
              />
            }
            path="/notes"
          />
          <Route element={<HelpPage />} path="/help" />
        </Routes>
      </main>

      <SettingsModal
        backupPanelProps={{
          error: backupError,
          onExport: handleExportBackup,
          onFileSelected: handleBackupFileSelected,
        }}
        loadSettingsPanelProps={{
          settings: state.smartLoad,
          onChange: handleSmartLoadChange,
        }}
        pomodoroSettingsPanelProps={{
          settings: state.pomodoroSettings,
          onChange: handlePomodoroSettingsChange,
        }}
        settingsPanelProps={{
          settings: state.settings,
          studyDaysCount,
          workDaysCount,
          onChange: (patch) =>
            setState((prev) => ({
              ...prev,
              settings: { ...prev.settings, ...patch },
            })),
          onGenerate: handleGenerate,
        }}
        state={settingsModal}
        subjectsPanelProps={{
          subjects: state.subjects,
          onAdd: handleAddSubject,
          onRemove: handleRemoveSubject,
          onUpdate: handleUpdateSubject,
        }}
        workSchedulePanelProps={{
          settings: state.workSchedule,
          workDaysCount,
          lightDaysCount,
          onChange: handleWorkScheduleChange,
        }}
      />

      <ConfirmRegenerateModal
        state={confirmModal}
        onConfirm={handleConfirmRegenerate}
      />

      <RestoreConfirmModal
        state={restoreConfirmModal}
        onConfirm={handleConfirmRestore}
      />

      <NoteModal
        dateLabel={noteTarget ? formatDayLabel(noteTarget.date) : ""}
        isOpen={noteTarget !== null}
        subjectName={noteSubjectName}
        value={noteKey ? (state.notes[noteKey] ?? "") : ""}
        onChange={handleNoteValueChange}
        onClose={() => setNoteTarget(null)}
      />
    </div>
  );
}

export default App;

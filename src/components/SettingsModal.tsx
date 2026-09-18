import { useState } from "react";
import { Modal, Tabs, type UseOverlayStateReturn } from "@heroui/react";

import {
  SubjectsPanel,
  type SubjectsPanelProps,
} from "@/components/SubjectsPanel";
import {
  SettingsPanel,
  type SettingsPanelProps,
} from "@/components/SettingsPanel";
import {
  PomodoroSettingsPanel,
  type PomodoroSettingsPanelProps,
} from "@/components/PomodoroSettingsPanel";
import {
  LoadSettingsPanel,
  type LoadSettingsPanelProps,
} from "@/components/LoadSettingsPanel";
import {
  WorkScheduleSettingsPanel,
  type WorkScheduleSettingsPanelProps,
} from "@/components/WorkScheduleSettingsPanel";
import { BackupPanel, type BackupPanelProps } from "@/components/BackupPanel";

interface SettingsModalProps {
  state: UseOverlayStateReturn;
  subjectsPanelProps: SubjectsPanelProps;
  settingsPanelProps: SettingsPanelProps;
  workSchedulePanelProps: WorkScheduleSettingsPanelProps;
  pomodoroSettingsPanelProps: PomodoroSettingsPanelProps;
  loadSettingsPanelProps: LoadSettingsPanelProps;
  backupPanelProps: BackupPanelProps;
}

export function SettingsModal({
  state,
  subjectsPanelProps,
  settingsPanelProps,
  workSchedulePanelProps,
  pomodoroSettingsPanelProps,
  loadSettingsPanelProps,
  backupPanelProps,
}: SettingsModalProps) {
  const [tab, setTab] = useState("subjects");

  return (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Container scroll="inside" size="lg">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Настройки и планирование</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <Tabs
              selectedKey={tab}
              onSelectionChange={(k) => setTab(String(k))}
            >
              <Tabs.ListContainer>
                <Tabs.List aria-label="Разделы настроек">
                  <Tabs.Tab id="subjects">
                    Занятия
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="sprint">
                    Спринт
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="workSchedule">
                    Работа
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="pomodoro">
                    Помодоро
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="load">
                    Нагрузка
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="backup">
                    Данные
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel className="pt-4" id="subjects">
                <SubjectsPanel {...subjectsPanelProps} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-4" id="sprint">
                <SettingsPanel {...settingsPanelProps} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-4" id="workSchedule">
                <WorkScheduleSettingsPanel {...workSchedulePanelProps} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-4" id="pomodoro">
                <PomodoroSettingsPanel {...pomodoroSettingsPanelProps} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-4" id="load">
                <LoadSettingsPanel {...loadSettingsPanelProps} />
              </Tabs.Panel>
              <Tabs.Panel className="pt-4" id="backup">
                <BackupPanel {...backupPanelProps} />
              </Tabs.Panel>
            </Tabs>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

import { Link, useLocation } from "react-router-dom";
import { Button } from "@heroui/react";

import { ThemeSwitch } from "@/components/theme-switch";
import { SlidersIcon } from "@/components/icons";

interface HeaderProps {
  onOpenSettings: () => void;
}

const NAV_ITEMS = [
  { to: "/", label: "Расписание" },
  { to: "/notes", label: "Заметки" },
  { to: "/help", label: "Инструкция" },
];

export function Header({ onOpenSettings }: HeaderProps) {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-separator bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-semibold text-foreground leading-tight">
              Планировщик спринта
            </p>
            <p className="text-xs text-muted leading-tight">
              Расписание занятий на 3 недели
            </p>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                className={
                  pathname === item.to
                    ? "rounded-full bg-default px-3 py-1.5 text-sm font-medium text-foreground"
                    : "rounded-full px-3 py-1.5 text-sm text-muted hover:text-foreground"
                }
                to={item.to}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onPress={onOpenSettings}>
            <SlidersIcon size={16} />
            Настройки и планирование
          </Button>
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}

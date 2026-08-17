"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/** `scrolled` lets callers on a transparent-over-hero header keep the toggle
 * visible (white icon) before the header gains its opaque surface. */
export function ThemeToggle({ scrolled }: { scrolled?: boolean } = {}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Standard next-themes hydration guard: server-rendered markup can't know
  // the resolved theme, so this flips true only after client mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title="Toggle theme"
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className={cn(scrolled === false && "text-white hover:bg-white/10 hover:text-white")}
          />
        }
      >
        <span className="relative flex size-4 items-center justify-center">
          <Sun className="absolute size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            data-active={mounted && theme === value}
            className="gap-2 data-[active=true]:font-medium"
          >
            <Icon className="size-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { Button } from "@/components/shadcn/button";
import { Calendar, CalendarDays, CalendarRange, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewType = "day" | "week" | "month" | "agenda";

interface ViewToggleProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
    const views: {
        type: ViewType;
        label: string;
        icon: typeof Calendar;
        disabled?: boolean;
    }[] = [
        { type: "day", label: "Jour", icon: Calendar },
        { type: "week", label: "Semaine", icon: CalendarDays },
        { type: "month", label: "Mois", icon: CalendarRange },
        { type: "agenda", label: "Agenda", icon: List },
    ];

    return (
        <div className="flex items-center gap-1 border rounded-md p-1">
            {views.map((view) => {
                const Icon = view.icon;
                const isActive = currentView === view.type;

                return (
                    <Button
                        key={view.type}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() =>
                            !view.disabled && onViewChange(view.type)
                        }
                        disabled={view.disabled}
                        className={cn(
                            "gap-2",
                            view.disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{view.label}</span>
                    </Button>
                );
            })}
        </div>
    );
}

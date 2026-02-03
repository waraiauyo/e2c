"use client";

import { Button } from "@/components/shadcn/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Calendar, CalendarDays, CalendarRange, List, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewType = "day" | "week" | "month" | "agenda";

interface ViewToggleProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
}

const views: {
    type: ViewType;
    label: string;
    shortLabel: string;
    icon: typeof Calendar;
}[] = [
    { type: "day", label: "Jour", shortLabel: "Jour", icon: Calendar },
    { type: "week", label: "Semaine", shortLabel: "Sem.", icon: CalendarDays },
    { type: "month", label: "Mois", shortLabel: "Mois", icon: CalendarRange },
    { type: "agenda", label: "Agenda", shortLabel: "Agenda", icon: List },
];

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
    const currentViewData = views.find((v) => v.type === currentView) || views[1];
    const CurrentIcon = currentViewData.icon;

    return (
        <>
            {/* Version mobile : Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="sm:hidden gap-1 h-8 px-2"
                    >
                        <CurrentIcon className="h-4 w-4" />
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {views.map((view) => {
                        const Icon = view.icon;
                        return (
                            <DropdownMenuItem
                                key={view.type}
                                onClick={() => onViewChange(view.type)}
                                className={cn(
                                    "gap-2",
                                    currentView === view.type && "bg-accent"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {view.label}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Version desktop : Boutons */}
            <div className="hidden sm:flex items-center gap-1 border rounded-md p-1">
                {views.map((view) => {
                    const Icon = view.icon;
                    const isActive = currentView === view.type;

                    return (
                        <Button
                            key={view.type}
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onViewChange(view.type)}
                            className="gap-2"
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden md:inline">{view.label}</span>
                        </Button>
                    );
                })}
            </div>
        </>
    );
}

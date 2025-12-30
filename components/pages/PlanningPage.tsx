"use client";

import { useState, useEffect, useMemo } from "react";
import { WeekView } from "@/components/planning/calendar/WeekView";
import { DayView } from "@/components/planning/views/DayView";
import { MonthView } from "@/components/planning/views/MonthView";
import { AgendaView } from "@/components/planning/views/AgendaView";
import { EventDialog } from "@/components/planning/shared/EventDialog";
import { FilterSidebar } from "@/components/planning/sidebar/FilterSidebar";
import {
    ViewToggle,
    type ViewType,
} from "@/components/planning/shared/ViewToggle";
import { useEvents } from "@/lib/planning/hooks/useEvents";
import { useAppSelector } from "@/lib/redux/hooks";
import { Button } from "@/components/shadcn/button";
import { LoadingSpinner } from "@/components/shadcn/loading-spinner";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
    addWeeks,
    addDays,
    addMonths,
    formatDateLong,
} from "@/lib/planning/utils/dateUtils";
import type { Event, TargetRole } from "@/lib/planning/types";

export default function PlanningPage() {
    const { isLoading: userLoading } = useAppSelector((state) => state.user);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<ViewType>("week");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
    const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
    const [initialDate, setInitialDate] = useState<Date | undefined>();
    const [selectedRoles, setSelectedRoles] = useState<TargetRole[]>([]);

    // Charger la vue depuis localStorage
    useEffect(() => {
        const savedView = localStorage.getItem("planning-view");
        if (
            savedView &&
            ["day", "week", "month", "agenda"].includes(savedView)
        ) {
            setCurrentView(savedView as ViewType);
        }
    }, []);

    // Sauvegarder la vue dans localStorage
    useEffect(() => {
        localStorage.setItem("planning-view", currentView);
    }, [currentView]);

    // Charger les rôles filtrés depuis localStorage
    useEffect(() => {
        const savedRoles = localStorage.getItem("planning-filter-roles");
        if (savedRoles) {
            try {
                const roles = JSON.parse(savedRoles) as TargetRole[];
                setSelectedRoles(roles);
            } catch (e) {
                // Ignorer les erreurs de parsing
            }
        }
    }, []);

    // Sauvegarder les rôles filtrés dans localStorage
    useEffect(() => {
        localStorage.setItem(
            "planning-filter-roles",
            JSON.stringify(selectedRoles)
        );
    }, [selectedRoles]);

    // Récupérer les événements
    const { events, isLoading, error, refetch } = useEvents();

    // Filtrer les événements selon les rôles sélectionnés
    const filteredEvents = useMemo(() => {
        // Si aucun rôle sélectionné, afficher tous les événements
        if (selectedRoles.length === 0) return events;

        // Filtrer les événements dont target_roles contient au moins un des rôles sélectionnés
        return events.filter((event) =>
            event.target_roles.some((role) => selectedRoles.includes(role))
        );
    }, [events, selectedRoles]);

    // Navigation adaptée à la vue
    const goToPrevious = () => {
        if (currentView === "day") {
            setCurrentDate(addDays(currentDate, -1));
        } else if (currentView === "month") {
            setCurrentDate(addMonths(currentDate, -1));
        } else {
            setCurrentDate(addWeeks(currentDate, -1));
        }
    };

    const goToNext = () => {
        if (currentView === "day") {
            setCurrentDate(addDays(currentDate, 1));
        } else if (currentView === "month") {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addWeeks(currentDate, 1));
        }
    };

    const goToToday = () => setCurrentDate(new Date());

    // Handlers
    const handleEventClick = (event: Event) => {
        setSelectedEvent(event);
        setDialogMode("edit");
        setDialogOpen(true);
    };

    const handleTimeSlotClick = (date: Date, hour: number) => {
        const clickedDate = new Date(date);
        clickedDate.setHours(hour, 0, 0, 0);
        setInitialDate(clickedDate);
        setSelectedEvent(undefined);
        setDialogMode("create");
        setDialogOpen(true);
    };

    const handleCreateEvent = () => {
        setInitialDate(new Date());
        setSelectedEvent(undefined);
        setDialogMode("create");
        setDialogOpen(true);
    };

    const handleDayClick = (date: Date) => {
        setInitialDate(date);
        setSelectedEvent(undefined);
        setDialogMode("create");
        setDialogOpen(true);
    };

    const handleDialogSuccess = () => {
        refetch();
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-destructive font-semibold mb-2">
                        Erreur lors du chargement des événements
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {error.message}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Topbar */}
            <header className="border-b bg-background px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Navigation date */}
                    <div className="flex items-center gap-4">
                        {/* Navigation date (visible uniquement pour week/day/month) */}
                        {currentView !== "agenda" && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToToday}
                                >
                                    Aujourd'hui
                                </Button>

                                <div className="flex items-center border rounded-md">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={goToPrevious}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="px-4 py-1 text-sm font-medium min-w-[200px] text-center">
                                        {formatDateLong(currentDate)}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={goToNext}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <ViewToggle
                            currentView={currentView}
                            onViewChange={setCurrentView}
                        />
                        <Button onClick={handleCreateEvent}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvel événement
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar avec filtres */}
                <aside className="w-80 border-r bg-muted/10">
                    <FilterSidebar
                        selectedRoles={selectedRoles}
                        onRolesChange={setSelectedRoles}
                    />
                </aside>

                {/* Calendar area */}
                <main className="flex-1 overflow-hidden">
                    {isLoading || userLoading ? (
                        <LoadingSpinner size="lg" />
                    ) : (
                        <>
                            {currentView === "day" && (
                                <DayView
                                    currentDate={currentDate}
                                    events={filteredEvents}
                                    onEventClick={handleEventClick}
                                    onTimeSlotClick={handleTimeSlotClick}
                                />
                            )}
                            {currentView === "week" && (
                                <WeekView
                                    currentDate={currentDate}
                                    events={filteredEvents}
                                    onEventClick={handleEventClick}
                                    onTimeSlotClick={handleTimeSlotClick}
                                />
                            )}
                            {currentView === "month" && (
                                <MonthView
                                    currentDate={currentDate}
                                    events={filteredEvents}
                                    onEventClick={handleEventClick}
                                    onDayClick={handleDayClick}
                                />
                            )}
                            {currentView === "agenda" && (
                                <AgendaView
                                    currentDate={currentDate}
                                    events={filteredEvents}
                                    onEventClick={handleEventClick}
                                    onDateChange={setCurrentDate}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Event Dialog */}
            <EventDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                mode={dialogMode}
                event={selectedEvent}
                initialDate={initialDate}
                onSuccess={handleDialogSuccess}
            />
        </div>
    );
}

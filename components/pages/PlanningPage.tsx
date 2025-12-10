"use client";

import { useState, useEffect, useMemo } from "react";
import { WeekView } from "@/components/planning/calendar/WeekView";
import { DayView } from "@/components/planning/views/DayView";
import { MonthView } from "@/components/planning/views/MonthView";
import { AgendaView } from "@/components/planning/views/AgendaView";
import { EventDialog } from "@/components/planning/shared/EventDialog";
import {
    FilterSidebar,
    type FilterContext,
} from "@/components/planning/sidebar/FilterSidebar";
import {
    ViewToggle,
    type ViewType,
} from "@/components/planning/shared/ViewToggle";
import { useEvents } from "@/lib/planning/hooks/useEvents";
import { useAppSelector } from "@/lib/redux/hooks";
import { Button } from "@/components/shadcn/button";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader,
    Loader2,
    Plus,
} from "lucide-react";
import {
    addWeeks,
    addDays,
    addMonths,
    formatDateLong,
} from "@/lib/planning/utils/dateUtils";
import type { Event } from "@/lib/planning/types";

export default function PlanningPage() {
    const { isLoading: userLoading } = useAppSelector((state) => state.user);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<ViewType>("week");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
    const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
    const [initialDate, setInitialDate] = useState<Date | undefined>();
    const [filterContext, setFilterContext] = useState<FilterContext | null>(
        null
    );

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

    // Charger le contexte de filtrage depuis localStorage
    useEffect(() => {
        const savedContext = localStorage.getItem("planning-filter-context");
        if (savedContext) {
            try {
                const context = JSON.parse(savedContext) as FilterContext;
                setFilterContext(context);
            } catch (e) {
                // Ignorer les erreurs de parsing
            }
        }
    }, []);

    // Sauvegarder le contexte de filtrage dans localStorage
    useEffect(() => {
        if (filterContext) {
            localStorage.setItem(
                "planning-filter-context",
                JSON.stringify(filterContext)
            );
        }
    }, [filterContext]);

    // Récupérer les événements
    const { events, isLoading, error, refetch } = useEvents();

    // Filtrer les événements selon le contexte sélectionné
    const filteredEvents = useMemo(() => {
        if (!filterContext) return events;

        return events.filter((event) => {
            if (filterContext.type === "personal") {
                // Afficher uniquement les événements personnels de l'utilisateur
                return (
                    event.owner_type === "personal" &&
                    event.owner_id === filterContext.id
                );
            } else {
                // Afficher uniquement les événements du CLAS sélectionné
                return (
                    event.owner_type === "clas" &&
                    event.owner_id === filterContext.id
                );
            }
        });
    }, [events, filterContext]);

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
                    <div className="flex items-center gap-3">
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
                <aside className="w-64 border-r bg-muted/10">
                    <FilterSidebar
                        selectedContext={filterContext}
                        onContextChange={setFilterContext}
                    />
                </aside>

                {/* Calendar area */}
                <main className="flex-1 overflow-hidden">
                    {isLoading || userLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader2 className="animate-spin mx-auto " />
                            </div>
                        </div>
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
                filterContext={filterContext}
                onSuccess={handleDialogSuccess}
            />
        </div>
    );
}

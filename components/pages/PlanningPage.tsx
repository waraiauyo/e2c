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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/shadcn/sheet";
import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
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
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);

    useEffect(() => {
        const savedView = localStorage.getItem("planning-view");
        if (savedView && ["day", "week", "month", "agenda"].includes(savedView)) {
            setCurrentView(savedView as ViewType);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("planning-view", currentView);
    }, [currentView]);

    useEffect(() => {
        const savedRoles = localStorage.getItem("planning-filter-roles");
        if (savedRoles) {
            try {
                const roles = JSON.parse(savedRoles) as TargetRole[];
                setSelectedRoles(roles);
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("planning-filter-roles", JSON.stringify(selectedRoles));
    }, [selectedRoles]);

    const { events, isLoading, error, refetch } = useEvents();

    const filteredEvents = useMemo(() => {
        if (selectedRoles.length === 0) return events;
        return events.filter((event) =>
            event.target_roles.some((role) => selectedRoles.includes(role))
        );
    }, [events, selectedRoles]);

    const goToPrevious = () => {
        if (currentView === "day") setCurrentDate(addDays(currentDate, -1));
        else if (currentView === "month") setCurrentDate(addMonths(currentDate, -1));
        else setCurrentDate(addWeeks(currentDate, -1));
    };

    const goToNext = () => {
        if (currentView === "day") setCurrentDate(addDays(currentDate, 1));
        else if (currentView === "month") setCurrentDate(addMonths(currentDate, 1));
        else setCurrentDate(addWeeks(currentDate, 1));
    };

    const goToToday = () => setCurrentDate(new Date());

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
            <div className="flex items-center justify-center h-full bg-white">
                <div className="text-center p-6 bg-red-50 rounded-xl">
                    <p className="text-[#005E84] font-bold mb-2">
                        Oups, une erreur est survenue
                    </p>
                    <p className="text-sm text-gray-600">
                        {error.message}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Topbar stylisée */}
            <header className="border-b border-[#F4F4F4] px-2 sm:px-6 py-2 sm:py-4 bg-white sticky top-0 z-20">
                <div className="flex items-center justify-between gap-2">
                    {/* Navigation date */}
                    <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
                        {/* Bouton filtre mobile */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="lg:hidden h-8 w-8 shrink-0"
                            onClick={() => setFilterSheetOpen(true)}
                        >
                            <Filter className="h-4 w-4" />
                        </Button>

                        {currentView !== "agenda" && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToToday}
                                    className="border-[#005E84] text-[#005E84] hover:bg-[#005E84] hover:text-white font-medium hidden md:flex shrink-0"
                                >
                                    Aujourd&apos;hui
                                </Button>

                                <div className="flex items-center bg-[#F4F4F4] rounded-lg p-0.5 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-white hover:text-[#DEAA00] rounded-md shrink-0"
                                        onClick={goToPrevious}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <button
                                        onClick={goToToday}
                                        className="px-1 sm:px-3 py-1 text-xs sm:text-sm font-bold text-[#1E3231] text-center capitalize truncate min-w-0"
                                    >
                                        {formatDateLong(currentDate)}
                                    </button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-white hover:text-[#DEAA00] rounded-md shrink-0"
                                        onClick={goToNext}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <ViewToggle
                            currentView={currentView}
                            onViewChange={setCurrentView}
                        />
                        <Button
                            onClick={handleCreateEvent}
                            size="sm"
                            className="bg-[#005E84] hover:bg-[#004d6e] text-white shadow-md hover:shadow-lg transition-all h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                        >
                            <Plus className="h-4 w-4 sm:mr-1" />
                            <span className="font-semibold hidden sm:inline">Nouveau</span>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-72 border-r border-[#F4F4F4] bg-white hidden lg:block p-4">
                    <FilterSidebar
                        selectedRoles={selectedRoles}
                        onRolesChange={setSelectedRoles}
                    />
                </aside>

                <main className="flex-1 overflow-hidden bg-white relative">
                    {isLoading || userLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
                            <LoadingSpinner size="lg" className="text-[#005E84]" />
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

            <EventDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                mode={dialogMode}
                event={selectedEvent}
                initialDate={initialDate}
                onSuccess={handleDialogSuccess}
            />

            {/* Sheet mobile pour les filtres */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="border-b p-4">
                        <SheetTitle>Filtres</SheetTitle>
                        <SheetDescription>
                            Filtrer les événements par rôle
                        </SheetDescription>
                    </SheetHeader>
                    <FilterSidebar
                        selectedRoles={selectedRoles}
                        onRolesChange={setSelectedRoles}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
}

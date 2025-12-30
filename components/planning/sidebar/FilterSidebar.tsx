"use client";

import { Checkbox } from "@/components/shadcn/checkbox";
import { Label } from "@/components/shadcn/label";
import { Button } from "@/components/shadcn/button";
import {
    type TargetRole,
    ROLE_LABELS,
    ROLE_COLORS,
} from "@/lib/planning/types";
import { cn } from "@/lib/utils";

const ALL_ROLES: TargetRole[] = ["animator", "coordinator", "director"];

interface FilterSidebarProps {
    selectedRoles: TargetRole[];
    onRolesChange: (roles: TargetRole[]) => void;
}

export function FilterSidebar({
    selectedRoles,
    onRolesChange,
}: FilterSidebarProps) {
    const handleRoleToggle = (role: TargetRole, checked: boolean) => {
        if (checked) {
            onRolesChange([...selectedRoles, role]);
        } else {
            // Permettre de tout désélectionner pour voir tous les événements
            onRolesChange(selectedRoles.filter((r) => r !== role));
        }
    };

    const selectAllRoles = () => {
        onRolesChange([]); // Vide = tous les rôles
    };

    const isAllSelected = selectedRoles.length === 0;

    return (
        <div className="p-4 space-y-4">
            <div>
                <h3 className="font-semibold text-sm mb-3">Filtrer par rôle</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllRoles}
                    className={cn(
                        "w-full mb-3",
                        isAllSelected && "bg-primary hover:bg-primary/90"
                    )}
                >
                    {isAllSelected
                        ? "Tous les rôles (actif)"
                        : "Afficher tous les rôles"}
                </Button>
                {/* Checkboxes pour chaque rôle */}
                <div className="space-y-2">
                    {ALL_ROLES.map((role) => {
                        const isChecked = selectedRoles.includes(role);
                        return (
                            <Label
                                key={role}
                                htmlFor={role}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                    isChecked
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:bg-muted/50"
                                )}
                            >
                                <Checkbox
                                    id={role}
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                        handleRoleToggle(role, !!checked)
                                    }
                                />
                                <div className="flex items-center gap-2 flex-1">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor: ROLE_COLORS[role],
                                        }}
                                    />
                                    <span className="text-sm font-medium">
                                        {ROLE_LABELS[role]}
                                    </span>
                                </div>
                            </Label>
                        );
                    })}
                </div>
            </div>
            <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                    {isAllSelected
                        ? "Affichage de tous les événements"
                        : selectedRoles.length === 0
                          ? "Aucun filtre actif"
                          : `Filtrage: ${selectedRoles.map((r) => ROLE_LABELS[r]).join(", ")}`}
                </p>
            </div>
            <div className="pt-4 border-t">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    Légende des couleurs
                </h4>
                <div className="space-y-1">
                    {ALL_ROLES.map((role) => (
                        <div key={role} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: ROLE_COLORS[role] }}
                            />
                            <span className="text-xs text-muted-foreground">
                                {ROLE_LABELS[role]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

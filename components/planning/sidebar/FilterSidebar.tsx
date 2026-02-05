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
        <div className="p-4 space-y-5">
            <div>
                <h3 className="font-bold text-[#005E84] text-sm mb-3">
                    Filtrer par rôle
                </h3>
                <Button
                    type="button"
                    variant={isAllSelected ? "default" : "outline"}
                    size="sm"
                    onClick={selectAllRoles}
                    className={cn(
                        "w-full mb-3 transition-all duration-200 shadow-sm",
                        isAllSelected
                            ? "bg-[#005E84] text-white hover:bg-[#004d6e] border-transparent" // ACTIF: Fond Bleu, Texte Blanc
                            : "bg-white text-[#1E3231] border-[#E2E8F0] hover:border-[#005E84] hover:text-[#005E84] hover:bg-[#F4F4F4]" // INACTIF: Fond Blanc, Texte Foncé
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
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 group",
                                    isChecked
                                        ? "border-[#E9B44C] bg-[#FFFDF5] shadow-sm" // Sélectionné : Bordure Jaune, Fond très pâle
                                        : "border-transparent hover:bg-[#F4F4F4]" // Non sélectionné : Fond transparent
                                )}
                            >
                                <Checkbox
                                    id={role}
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                        handleRoleToggle(role, !!checked)
                                    }
                                    className="data-[state=checked]:bg-[#005E84] data-[state=checked]:border-[#005E84]"
                                />
                                <div className="flex items-center gap-2 flex-1">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm"
                                        style={{
                                            backgroundColor: ROLE_COLORS[role],
                                        }}
                                    />
                                    <span
                                        className={cn(
                                            "text-sm font-medium transition-colors",
                                            isChecked
                                                ? "text-[#005E84]"
                                                : "text-[#1E3231]"
                                        )}
                                    >
                                        {ROLE_LABELS[role]}
                                    </span>
                                </div>
                            </Label>
                        );
                    })}
                </div>
            </div>

            <div className="pt-4 border-t border-[#F4F4F4]">
                <p className="text-xs text-muted-foreground italic">
                    {isAllSelected
                        ? "Affichage de tous les événements"
                        : selectedRoles.length === 0
                          ? "Aucun filtre actif"
                          : `Filtrage: ${selectedRoles.map((r) => ROLE_LABELS[r]).join(", ")}`}
                </p>
            </div>
        </div>
    );
}

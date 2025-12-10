"use client";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { 
    setSearchQuery, 
    setLevelFilter, 
    setAllophoneFilter 
} from "@/lib/redux/features/clas/slice";
import { selectClasFilters } from "@/lib/redux/features/clas/selectors";

import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectClasFilters);

  // Style commun pour les items du select : force le texte noir et le fond gris au survol
  const selectItemClass = "text-black focus:bg-gray-100 focus:!text-black cursor-pointer";

  return (
    <div className="h-full flex flex-col bg-white text-black border-r border-gray-200 p-6 overflow-y-auto">
      
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">
          Département de la Mayenne
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Recherchez et filtrez les dispositifs CLAS du département.
        </p>
      </div>

      <div className="mb-6 space-y-2">
        <Label htmlFor="search" className="font-bold text-black">
          Rechercher un CLAS
        </Label>
        <Input
          type="text"
          id="search"
          placeholder="Ville ou nom du CLAS..."
          className="bg-white text-black border-gray-300 placeholder:text-gray-500 focus-visible:ring-gray-400"
          value={filters.searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
        />
      </div>

      <Separator className="my-6 bg-gray-200" />

      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Filtres
        </h2>

        <div className="space-y-2">
          <Label className="font-bold text-black">Niveau scolaire</Label>
          <Select 
            value={filters.level} 
            onValueChange={(value: "all" | "primaire" | "college") => dispatch(setLevelFilter(value))}
          >
            <SelectTrigger className="w-full bg-white text-black border-gray-300 focus:ring-gray-400">
              <SelectValue placeholder="Choisir un niveau" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="all" className={selectItemClass}>
                Tous les niveaux
              </SelectItem>
              <SelectItem value="primaire" className={selectItemClass}>
                Primaire
              </SelectItem>
              <SelectItem value="college" className={selectItemClass}>
                Collège
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-black">Accueil Allophones</Label>
          <Select 
            value={filters.allophone}
            onValueChange={(value: "all" | "yes" | "no") => dispatch(setAllophoneFilter(value))}
          >
            <SelectTrigger className="w-full bg-white text-black border-gray-300 focus:ring-gray-400">
              <SelectValue placeholder="Peu importe" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="all" className={selectItemClass}>
                Peu importe
              </SelectItem>
              <SelectItem value="yes" className={selectItemClass}>
                Oui
              </SelectItem>
              <SelectItem value="no" className={selectItemClass}>
                Non
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { ClasFilters } from "@/lib/redux/features/clas/types";

interface SidebarViewProps {
  filters: ClasFilters;
  onSearchChange: (value: string) => void;
  onLevelChange: (value: ClasFilters["level"]) => void;
  onAllophoneChange: (value: ClasFilters["allophone"]) => void;
}

export const SidebarView = ({ filters, onSearchChange, onLevelChange, onAllophoneChange }: SidebarViewProps) => (
  <div className="h-full flex flex-col bg-white text-black border-r border-gray-200 p-6 overflow-y-auto">
    <div className="mb-8">
      <h1 className="text-xl font-bold text-gray-900">Département de la Mayenne</h1>
      <p className="text-sm text-gray-500 mt-2">Recherchez et filtrez les dispositifs CLAS.</p>
    </div>

    <div className="mb-6 space-y-2">
      <Label htmlFor="search" className="font-bold text-black">Recherche rapide</Label>
      <Input
        id="search"
        type="text"
        placeholder="Ville ou nom..."
        className="bg-white text-black border-gray-300 placeholder:text-gray-500"
        value={filters.searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>

    <Separator className="my-6 bg-gray-200" />

    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Filtres</h2>
      
      <div className="space-y-2">
        <Label className="font-bold text-black">Niveau scolaire</Label>
        <Select value={filters.level} onValueChange={onLevelChange}>
          <SelectTrigger className="w-full bg-white text-black border-gray-300">
            <SelectValue placeholder="Choisir un niveau" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-300">
            <SelectItem value="all" className="text-black focus:bg-gray-100">Tous les niveaux</SelectItem>
            <SelectItem value="primaire" className="text-black focus:bg-gray-100">Primaire</SelectItem>
            <SelectItem value="college" className="text-black focus:bg-gray-100">Collège</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="font-bold text-black">Accueil Allophones</Label>
        <Select value={filters.allophone} onValueChange={onAllophoneChange}>
          <SelectTrigger className="w-full bg-white text-black border-gray-300">
            <SelectValue placeholder="Peu importe" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-300">
            <SelectItem value="all" className="text-black focus:bg-gray-100">Peu importe</SelectItem>
            <SelectItem value="yes" className="text-black focus:bg-gray-100">Oui</SelectItem>
            <SelectItem value="no" className="text-black focus:bg-gray-100">Non</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);
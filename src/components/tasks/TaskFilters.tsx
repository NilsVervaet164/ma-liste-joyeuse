import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type TaskFiltersProps = {
  filterProjet: string | null;
  setFilterProjet: (id: string | null) => void;
  filterType: string | null;
  setFilterType: (id: string | null) => void;
  sortBy: "importance" | "priorite" | "taille";
  setSortBy: (sort: "importance" | "priorite" | "taille") => void;
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
};

const TaskFilters = ({
  filterProjet,
  setFilterProjet,
  filterType,
  setFilterType,
  sortBy,
  setSortBy,
  showCompleted,
  setShowCompleted,
}: TaskFiltersProps) => {
  const [projets, setProjets] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchProjets();
    fetchTypes();
  }, []);

  const fetchProjets = async () => {
    const { data } = await supabase.from('projets').select('*');
    setProjets(data || []);
  };

  const fetchTypes = async () => {
    const { data } = await supabase.from('types').select('*');
    setTypes(data || []);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Projet</Label>
        <Select
          value={filterProjet || "all"}
          onValueChange={(v) => setFilterProjet(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projets.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Type</Label>
        <Select
          value={filterType || "all"}
          onValueChange={(v) => setFilterType(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Trier par</Label>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="importance">Importance</SelectItem>
            <SelectItem value="priorite">Priorité</SelectItem>
          <SelectItem value="taille">Taille</SelectItem>
        </SelectContent>
      </Select>
    </div>

      <div className="space-y-2 flex items-center gap-2">
        <Switch 
          id="show-completed" 
          checked={showCompleted}
          onCheckedChange={setShowCompleted}
        />
        <Label htmlFor="show-completed" className="cursor-pointer">
          Afficher terminées
        </Label>
      </div>
    </div>
  );
};

export default TaskFilters;

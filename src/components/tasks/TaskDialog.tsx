import { useEffect, useState, useRef } from "react";
import { Task } from "./TasksTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onDelete?: (id: string) => void;
};

const TAILLES = [1, 2, 3, 5, 8, 13, 21, 34];

const TaskDialog = ({ open, onOpenChange, task, onDelete }: TaskDialogProps) => {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [priorite, setPriorite] = useState(50);
  const [importance, setImportance] = useState(50);
  const [taille, setTaille] = useState<number | null>(null);
  const [typeId, setTypeId] = useState<string>("");
  const [projetId, setProjetId] = useState<string>("");
  const [types, setTypes] = useState<any[]>([]);
  const [projets, setProjets] = useState<any[]>([]);
  const { toast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchTypes();
    fetchProjets();
  }, []);

  useEffect(() => {
    if (task) {
      setTitre(task.titre);
      setDescription(task.description || "");
      // Importance et priorité uniquement pour les tâches principales
      if (!task.parent_id) {
        setPriorite(task.priorite);
        setImportance(task.importance);
      }
      setTaille(task.taille);
      setTypeId(task.type_id || "");
      // Projet uniquement pour les tâches principales
      if (!task.parent_id) {
        setProjetId(task.projet_id || "");
      }
    } else {
      resetForm();
    }
  }, [task, open]);

  const fetchTypes = async () => {
    const { data } = await supabase.from('types').select('*');
    setTypes(data || []);
  };

  const fetchProjets = async () => {
    const { data } = await supabase.from('projets').select('*');
    setProjets(data || []);
  };

  const resetForm = () => {
    setTitre("");
    setDescription("");
    setPriorite(50);
    setImportance(50);
    setTaille(null);
    setTypeId("");
    setProjetId("");
  };

  const autoSave = async (updates: Partial<Task>) => {
    if (!task) return;

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder",
        variant: "destructive",
      });
    }
  };

  const debouncedAutoSave = (updates: Partial<Task>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      autoSave(updates);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titre.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est requis",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      titre,
      description: description || null,
      priorite,
      importance,
      taille,
      type_id: typeId || null,
      projet_id: projetId || null,
    };

    const { error } = await supabase
      .from('tasks')
      .insert(taskData);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Tâche créée",
    });

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {task 
              ? (task.parent_id ? "Modifier la sous-tâche" : "Modifier la tâche")
              : "Nouvelle tâche"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => {
                setTitre(e.target.value);
                if (task) debouncedAutoSave({ titre: e.target.value });
              }}
              placeholder="Ma tâche..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (task) debouncedAutoSave({ description: e.target.value || null });
              }}
              placeholder="Détails de la tâche..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={typeId} onValueChange={(value) => {
                setTypeId(value);
                if (task) autoSave({ type_id: value || null });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Projet uniquement pour les tâches principales */}
            {(!task || !task.parent_id) && (
              <div className="space-y-2">
                <Label htmlFor="projet">Projet</Label>
                <Select value={projetId} onValueChange={(value) => {
                  setProjetId(value);
                  if (task) autoSave({ projet_id: value || null });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projets.map((projet) => (
                      <SelectItem key={projet.id} value={projet.id}>
                        {projet.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="taille">Taille (Fibonacci)</Label>
            <Select
              value={taille?.toString() || ""}
              onValueChange={(v) => {
                const newTaille = v ? parseInt(v) : null;
                setTaille(newTaille);
                if (task) autoSave({ taille: newTaille });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une taille" />
              </SelectTrigger>
              <SelectContent>
                {TAILLES.map((t) => (
                  <SelectItem key={t} value={t.toString()}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Importance et priorité uniquement pour les tâches principales */}
          {(!task || !task.parent_id) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Importance: {importance}</Label>
                <Slider
                  value={[importance]}
                  onValueChange={([v]) => {
                    setImportance(v);
                    if (task) autoSave({ importance: v });
                  }}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Priorité: {priorite}</Label>
                <Slider
                  value={[priorite]}
                  onValueChange={([v]) => {
                    setPriorite(v);
                    if (task) autoSave({ priorite: v });
                  }}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-secondary"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3">
            {task && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Supprimer
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fermer
              </Button>
              {!task && (
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Créer
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;

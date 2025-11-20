import { useEffect, useState } from "react";
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
};

const TAILLES = [1, 2, 3, 5, 8, 13, 21, 34];

const TaskDialog = ({ open, onOpenChange, task }: TaskDialogProps) => {
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

  useEffect(() => {
    fetchTypes();
    fetchProjets();
  }, []);

  useEffect(() => {
    if (task) {
      setTitre(task.titre);
      setDescription(task.description || "");
      setPriorite(task.priorite);
      setImportance(task.importance);
      setTaille(task.taille);
      setTypeId(task.type_id || "");
      setProjetId(task.projet_id || "");
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

    if (task) {
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', task.id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier la tâche",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Succès",
        description: "Tâche modifiée",
      });
    } else {
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
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ma tâche..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails de la tâche..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={typeId} onValueChange={setTypeId}>
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

            <div className="space-y-2">
              <Label htmlFor="projet">Projet</Label>
              <Select value={projetId} onValueChange={setProjetId}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="taille">Taille (Fibonacci)</Label>
            <Select
              value={taille?.toString() || ""}
              onValueChange={(v) => setTaille(v ? parseInt(v) : null)}
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Importance: {importance}</Label>
              <Slider
                value={[importance]}
                onValueChange={([v]) => setImportance(v)}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Priorité: {priorite}</Label>
              <Slider
                value={[priorite]}
                onValueChange={([v]) => setPriorite(v)}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-secondary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              {task ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;

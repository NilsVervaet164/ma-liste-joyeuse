import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProjetDialog from "./ProjetDialog";
import ProjetList from "./ProjetList";

export type Projet = {
  id: string;
  nom: string;
  categorie: string | null;
  couleur: string;
  created_at: string;
  updated_at: string;
};

const ProjetsTab = () => {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProjet, setEditingProjet] = useState<Projet | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjets();
  }, []);

  const fetchProjets = async () => {
    const { data, error } = await supabase
      .from('projets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
      return;
    }

    setProjets(data || []);
  };

  const handleEdit = (projet: Projet) => {
    setEditingProjet(projet);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Check if project has tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('projet_id', id)
      .limit(1);

    if (tasks && tasks.length > 0) {
      toast({
        title: "Impossible de supprimer",
        description: "Ce projet contient des tâches. Supprimez-les d'abord.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('projets')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Projet supprimé",
    });
    fetchProjets();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingProjet(null);
            setIsDialogOpen(true);
          }}
          className="btn-playful bg-secondary text-secondary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un projet
        </Button>
      </div>

      <ProjetList
        projets={projets}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ProjetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        projet={editingProjet}
        onSuccess={fetchProjets}
      />
    </div>
  );
};

export default ProjetsTab;

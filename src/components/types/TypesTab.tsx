import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TypeDialog from "./TypeDialog";
import TypeList from "./TypeList";

export type Type = {
  id: string;
  nom: string;
  created_at: string;
};

const TypesTab = () => {
  const [types, setTypes] = useState<Type[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<Type | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    const { data, error } = await supabase
      .from('types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les types",
        variant: "destructive",
      });
      return;
    }

    setTypes(data || []);
  };

  const handleEdit = (type: Type) => {
    setEditingType(type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Check if type has tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('type_id', id)
      .limit(1);

    if (tasks && tasks.length > 0) {
      toast({
        title: "Impossible de supprimer",
        description: "Ce type est utilisé par des tâches",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('types')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le type",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Type supprimé",
    });
    fetchTypes();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingType(null);
            setIsDialogOpen(true);
          }}
          className="btn-playful bg-accent text-accent-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un type
        </Button>
      </div>

      <TypeList
        types={types}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TypeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type={editingType}
        onSuccess={fetchTypes}
      />
    </div>
  );
};

export default TypesTab;

import { useEffect, useState } from "react";
import { Type } from "./TypesTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: Type | null;
  onSuccess: () => void;
};

const TypeDialog = ({ open, onOpenChange, type, onSuccess }: TypeDialogProps) => {
  const [nom, setNom] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (type) {
      setNom(type.nom);
    } else {
      setNom("");
    }
  }, [type, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est requis",
        variant: "destructive",
      });
      return;
    }

    if (type) {
      const { error } = await supabase
        .from('types')
        .update({ nom })
        .eq('id', type.id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le type",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Succès",
        description: "Type modifié",
      });
    } else {
      const { error } = await supabase
        .from('types')
        .insert({ nom });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le type",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Succès",
        description: "Type créé",
      });
    }

    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {type ? "Modifier le type" : "Nouveau type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Mon type..."
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="bg-accent text-accent-foreground">
              {type ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TypeDialog;

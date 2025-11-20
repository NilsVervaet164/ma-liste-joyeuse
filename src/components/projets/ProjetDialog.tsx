import { useEffect, useState } from "react";
import { Projet } from "./ProjetsTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ProjetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projet: Projet | null;
  onSuccess: () => void;
};

const COLORS = [
  "#A78BFA", "#FDBA74", "#6EE7B7", "#FB7185", "#7DD3FC",
  "#F472B6", "#FBBF24", "#34D399", "#60A5FA", "#C084FC",
  "#FCA5A5", "#FCD34D", "#5EEAD4", "#93C5FD", "#D8B4FE",
  "#FED7AA", "#86EFAC", "#F9A8D4", "#FDBA8C", "#BAE6FD",
];

const ProjetDialog = ({ open, onOpenChange, projet, onSuccess }: ProjetDialogProps) => {
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState<string>("");
  const [couleur, setCouleur] = useState(COLORS[0]);
  const { toast } = useToast();

  useEffect(() => {
    if (projet) {
      setNom(projet.nom);
      setCategorie(projet.categorie || "");
      setCouleur(projet.couleur);
    } else {
      resetForm();
    }
  }, [projet, open]);

  const resetForm = () => {
    setNom("");
    setCategorie("");
    setCouleur(COLORS[0]);
  };

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

    const projetData = {
      nom,
      categorie: categorie || null,
      couleur,
    };

    if (projet) {
      const { error } = await supabase
        .from('projets')
        .update(projetData)
        .eq('id', projet.id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le projet",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Succès",
        description: "Projet modifié",
      });
    } else {
      const { error } = await supabase
        .from('projets')
        .insert(projetData);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le projet",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Succès",
        description: "Projet créé",
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
            {projet ? "Modifier le projet" : "Nouveau projet"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Mon projet..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categorie">Catégorie</Label>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pro">Professionnel</SelectItem>
                <SelectItem value="perso">Personnel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="grid grid-cols-10 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCouleur(color)}
                  className={`w-full aspect-square rounded-lg transition-all hover:scale-110 ${
                    couleur === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
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
            <Button type="submit" className="bg-secondary text-secondary-foreground">
              {projet ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjetDialog;

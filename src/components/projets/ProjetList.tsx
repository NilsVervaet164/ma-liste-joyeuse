import { Projet } from "./ProjetsTab";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Briefcase, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProjetListProps = {
  projets: Projet[];
  onEdit: (projet: Projet) => void;
  onDelete: (id: string) => void;
};

const ProjetList = ({ projets, onEdit, onDelete }: ProjetListProps) => {
  if (projets.length === 0) {
    return (
      <div className="card-soft p-12 text-center">
        <p className="text-muted-foreground text-lg">
          Aucun projet pour le moment 📁
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projets.map((projet) => (
        <div
          key={projet.id}
          className="card-soft p-6 space-y-3"
          style={{ borderLeft: `4px solid ${projet.couleur}` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">
                {projet.nom}
              </h3>
              {projet.categorie && (
                <Badge 
                  variant="outline" 
                  className="mt-2"
                >
                  {projet.categorie === "pro" ? (
                    <>
                      <Briefcase className="w-3 h-3 mr-1" />
                      Pro
                    </>
                  ) : (
                    <>
                      <Home className="w-3 h-3 mr-1" />
                      Perso
                    </>
                  )}
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(projet)}
                className="h-8 w-8 hover:bg-primary/10"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(projet.id)}
                className="h-8 w-8 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div
            className="w-full h-8 rounded-lg"
            style={{ backgroundColor: projet.couleur }}
          />
        </div>
      ))}
    </div>
  );
};

export default ProjetList;

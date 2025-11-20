import { Type } from "./TypesTab";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

type TypeListProps = {
  types: Type[];
  onEdit: (type: Type) => void;
  onDelete: (id: string) => void;
};

const TypeList = ({ types, onEdit, onDelete }: TypeListProps) => {
  if (types.length === 0) {
    return (
      <div className="card-soft p-12 text-center">
        <p className="text-muted-foreground text-lg">
          Aucun type pour le moment 🏷️
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {types.map((type) => (
        <div key={type.id} className="card-soft p-4 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-foreground">{type.nom}</h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(type)}
                className="h-7 w-7 hover:bg-primary/10"
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(type.id)}
                className="h-7 w-7 hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TypeList;

-- Ajouter les colonnes pour la hiérarchie des tâches
ALTER TABLE public.tasks 
ADD COLUMN parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
ADD COLUMN niveau INTEGER NOT NULL DEFAULT 0,
ADD COLUMN ordre INTEGER NOT NULL DEFAULT 0;

-- Ajouter une contrainte pour limiter à 3 niveaux (0, 1, 2)
ALTER TABLE public.tasks 
ADD CONSTRAINT niveau_max_check CHECK (niveau <= 2);

-- Créer des index pour améliorer les performances
CREATE INDEX idx_tasks_parent_id ON public.tasks(parent_id);
CREATE INDEX idx_tasks_niveau ON public.tasks(niveau);
CREATE INDEX idx_tasks_parent_ordre ON public.tasks(parent_id, ordre);

-- Fonction pour valider la hiérarchie lors de l'insertion/mise à jour
CREATE OR REPLACE FUNCTION public.validate_task_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_niveau INTEGER;
BEGIN
  -- Si c'est une tâche racine (pas de parent), niveau doit être 0
  IF NEW.parent_id IS NULL THEN
    NEW.niveau := 0;
    RETURN NEW;
  END IF;

  -- Récupérer le niveau du parent
  SELECT niveau INTO parent_niveau
  FROM public.tasks
  WHERE id = NEW.parent_id;

  -- Vérifier que le parent existe
  IF parent_niveau IS NULL THEN
    RAISE EXCEPTION 'Parent task does not exist';
  END IF;

  -- Le niveau doit être parent_niveau + 1
  NEW.niveau := parent_niveau + 1;

  -- Vérifier qu'on ne dépasse pas le niveau max
  IF NEW.niveau > 2 THEN
    RAISE EXCEPTION 'Maximum hierarchy depth (3 levels) exceeded';
  END IF;

  -- Les sous-tâches héritent du projet_id du parent
  IF NEW.niveau > 0 THEN
    SELECT projet_id INTO NEW.projet_id
    FROM public.tasks
    WHERE id = NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour valider la hiérarchie
CREATE TRIGGER validate_task_hierarchy_trigger
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.validate_task_hierarchy();

-- Fonction pour mettre à jour la complétion en cascade
CREATE OR REPLACE FUNCTION public.cascade_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si une tâche parent est marquée comme complétée
  IF NEW.completed = true AND OLD.completed = false THEN
    -- Marquer toutes les sous-tâches comme complétées
    UPDATE public.tasks
    SET completed = true, completed_at = NEW.completed_at
    WHERE parent_id = NEW.id;
  END IF;

  -- Si une tâche parent est décochée
  IF NEW.completed = false AND OLD.completed = true THEN
    -- Décocher toutes les sous-tâches
    UPDATE public.tasks
    SET completed = false, completed_at = NULL
    WHERE parent_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour la complétion en cascade
CREATE TRIGGER cascade_task_completion_trigger
AFTER UPDATE OF completed ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.cascade_task_completion();
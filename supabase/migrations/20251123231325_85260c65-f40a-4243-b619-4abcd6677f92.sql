-- Corriger les fonctions pour définir le search_path et éviter les problèmes de sécurité

-- Recréer la fonction de validation de hiérarchie avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.validate_task_hierarchy()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recréer la fonction de complétion en cascade avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.cascade_task_completion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
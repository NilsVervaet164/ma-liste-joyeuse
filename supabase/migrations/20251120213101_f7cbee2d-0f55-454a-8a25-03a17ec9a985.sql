-- Create types table
CREATE TABLE IF NOT EXISTS public.types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create projets table
CREATE TABLE IF NOT EXISTS public.projets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL,
  categorie VARCHAR(50) CHECK (categorie IN ('pro', 'perso')),
  couleur VARCHAR(7) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  priorite FLOAT DEFAULT 50 CHECK (priorite >= 0 AND priorite <= 100),
  importance FLOAT DEFAULT 50 CHECK (importance >= 0 AND importance <= 100),
  taille INTEGER CHECK (taille IN (1, 2, 3, 5, 8, 13, 21, 34)),
  type_id UUID REFERENCES public.types(id) ON DELETE SET NULL,
  projet_id UUID REFERENCES public.projets(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Insert default types
INSERT INTO public.types (nom) VALUES
  ('Tâche'),
  ('Bug'),
  ('Amélioration'),
  ('Idée');

-- Enable Row Level Security
ALTER TABLE public.types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations (single-user app)
CREATE POLICY "Allow all operations on types" ON public.types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on projets" ON public.projets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_tasks_type_id ON public.tasks(type_id);
CREATE INDEX idx_tasks_projet_id ON public.tasks(projet_id);
CREATE INDEX idx_tasks_completed ON public.tasks(completed);
CREATE INDEX idx_tasks_completed_at ON public.tasks(completed_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_projets_updated_at
  BEFORE UPDATE ON public.projets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
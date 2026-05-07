
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS group_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS folders_group_id_uniq ON public.folders(group_id) WHERE group_id IS NOT NULL;
ALTER TABLE public.folders ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.folders ALTER COLUMN created_by_name DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_group_to_folder()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  parent_folder_path text;
  new_path text;
  existing_folder_id uuid;
  actor_id uuid;
  actor_name text;
BEGIN
  actor_id := auth.uid();
  SELECT username INTO actor_name FROM public.profiles WHERE user_id = actor_id;
  IF actor_name IS NULL THEN actor_name := 'Système'; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_id IS NOT NULL THEN
      SELECT path INTO parent_folder_path FROM public.folders WHERE group_id = NEW.parent_id;
    END IF;
    new_path := COALESCE(parent_folder_path, '') || '/' || NEW.name;
    SELECT id INTO existing_folder_id FROM public.folders WHERE path = new_path;
    IF existing_folder_id IS NOT NULL THEN
      UPDATE public.folders SET group_id = NEW.id WHERE id = existing_folder_id;
    ELSE
      INSERT INTO public.folders (name, path, parent_path, created_by, created_by_name, group_id)
      VALUES (NEW.name, new_path, parent_folder_path, actor_id, actor_name, NEW.id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.name <> OLD.name OR COALESCE(NEW.parent_id::text,'') <> COALESCE(OLD.parent_id::text,'') THEN
      IF NEW.parent_id IS NOT NULL THEN
        SELECT path INTO parent_folder_path FROM public.folders WHERE group_id = NEW.parent_id;
      END IF;
      new_path := COALESCE(parent_folder_path, '') || '/' || NEW.name;
      UPDATE public.folders
        SET name = NEW.name, path = new_path, parent_path = parent_folder_path
        WHERE group_id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_group_to_folder ON public.groups;
CREATE TRIGGER trg_sync_group_to_folder
AFTER INSERT OR UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.sync_group_to_folder();

CREATE OR REPLACE FUNCTION public.sync_folder_to_group()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  parent_group_id uuid;
  matched_gid uuid;
  new_group_id uuid;
BEGIN
  IF NEW.group_id IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.parent_path IS NOT NULL THEN
    SELECT group_id INTO parent_group_id FROM public.folders WHERE path = NEW.parent_path;
  END IF;
  -- Try to link to an existing group by name (+parent)
  SELECT id INTO matched_gid FROM public.groups
   WHERE name = NEW.name AND COALESCE(parent_id::text,'') = COALESCE(parent_group_id::text,'')
   LIMIT 1;
  IF matched_gid IS NOT NULL THEN
    UPDATE public.folders SET group_id = matched_gid WHERE id = NEW.id;
  ELSE
    INSERT INTO public.groups (name, parent_id, icon)
    VALUES (NEW.name, parent_group_id, '📁')
    RETURNING id INTO new_group_id;
    UPDATE public.folders SET group_id = new_group_id WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_folder_to_group ON public.folders;
CREATE TRIGGER trg_sync_folder_to_group
AFTER INSERT ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.sync_folder_to_group();

CREATE OR REPLACE FUNCTION public.sync_group_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN OLD; END IF;
  DELETE FROM public.folders WHERE group_id = OLD.id;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_group_delete ON public.groups;
CREATE TRIGGER trg_sync_group_delete
AFTER DELETE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.sync_group_delete();

CREATE OR REPLACE FUNCTION public.sync_folder_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN OLD; END IF;
  IF OLD.group_id IS NOT NULL THEN
    DELETE FROM public.groups WHERE id = OLD.group_id;
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_folder_delete ON public.folders;
CREATE TRIGGER trg_sync_folder_delete
AFTER DELETE ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.sync_folder_delete();

-- Backfill: link existing folders to groups by name+parent, create only if missing
DO $$
DECLARE
  f RECORD;
  parent_gid uuid;
  matched_gid uuid;
  new_gid uuid;
BEGIN
  FOR f IN SELECT * FROM public.folders WHERE group_id IS NULL ORDER BY length(path) ASC LOOP
    parent_gid := NULL;
    IF f.parent_path IS NOT NULL THEN
      SELECT group_id INTO parent_gid FROM public.folders WHERE path = f.parent_path;
    END IF;
    SELECT id INTO matched_gid FROM public.groups
      WHERE name = f.name AND COALESCE(parent_id::text,'') = COALESCE(parent_gid::text,'')
      LIMIT 1;
    IF matched_gid IS NOT NULL THEN
      UPDATE public.folders SET group_id = matched_gid WHERE id = f.id;
    ELSE
      INSERT INTO public.groups (name, parent_id, icon)
      VALUES (f.name, parent_gid, '📁')
      RETURNING id INTO new_gid;
      UPDATE public.folders SET group_id = new_gid WHERE id = f.id;
    END IF;
  END LOOP;
END $$;

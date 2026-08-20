import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppLocale } from '@/lib/i18n';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';
import { fetchUserProjects } from '@/lib/projectDueDateSchema';
import { buildLiveCapturePreview, type LiveCapturePreview } from '@/lib/liveCapturePreview';
import { useUserLifeAreas } from '@/hooks/useUserLifeAreas';

const DEBOUNCE_MS = 220;
const MIN_CHARS = 4;

type UseLiveCaptureOrganizationArgs = {
  text: string;
  locale: AppLocale;
  userId: string | undefined;
  enabled?: boolean;
};

export function useLiveCaptureOrganization({
  text,
  locale,
  userId,
  enabled = true,
}: UseLiveCaptureOrganizationArgs) {
  const [projects, setProjects] = useState<ProjectForMatch[]>([]);
  const [preview, setPreview] = useState<LiveCapturePreview | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { config: lifeAreasConfig } = useUserLifeAreas(userId);

  const loadProjects = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      return;
    }
    const { data } = await fetchUserProjects(userId);
    setProjects((data ?? []).map((p) => ({ id: p.id, name: p.name })));
  }, [userId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!enabled) {
      setPreview(null);
      setIsUpdating(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = text.trim();
    if (trimmed.length < MIN_CHARS) {
      setPreview(null);
      setIsUpdating(false);
      return;
    }

    setIsUpdating(true);
    timerRef.current = setTimeout(() => {
      try {
        const next = buildLiveCapturePreview(trimmed, locale, projects, {
          stableIds: true,
          lifeAreasConfig: lifeAreasConfig,
        });
        setPreview(next);
      } catch {
        setPreview(null);
      } finally {
        setIsUpdating(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, lifeAreasConfig, locale, projects, text]);

  const itemCount = preview?.items.length ?? 0;
  const areaCount = preview?.areaChips.length ?? 0;
  /** Solo true cuando aún no hay preview (primera carga). */
  const isThinking = isUpdating && !preview;

  const projectsMeta = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        due_date: null as string | null,
      })),
    [projects],
  );

  return {
    preview,
    isThinking,
    isUpdating,
    itemCount,
    areaCount,
    projects,
    projectsMeta,
    reloadProjects: loadProjects,
  };
}

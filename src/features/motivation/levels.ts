import type { TFunction } from '../../i18n/t';
import { LEVEL_TITLE_COUNT } from '../../storage/motivation';

/** A level's name: the twelve named ones, then "Compiler Whisperer 2", "… 3". */
export function levelTitle(level: number, t: TFunction): string {
  if (level <= LEVEL_TITLE_COUNT) {
    return t(`motivation.level${Math.max(1, Math.floor(level))}` as Parameters<TFunction>[0]);
  }
  return t('motivation.levelBeyond', { n: level - LEVEL_TITLE_COUNT + 1 });
}

/** A badge's name, from its id (module badges are named after their module). */
export function badgeKeyTitle(id: string, t: TFunction, moduleTitle?: string): string {
  if (id.startsWith('module:')) return t('badges.moduleTitle', { title: moduleTitle ?? id.slice(7) });
  return t(`badges.${id}.title` as Parameters<TFunction>[0]);
}

export function badgeKeyDescription(id: string, t: TFunction, moduleTagline?: string): string {
  if (id.startsWith('module:')) return moduleTagline ?? '';
  return t(`badges.${id}.description` as Parameters<TFunction>[0]);
}

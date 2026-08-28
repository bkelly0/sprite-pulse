export type SyncId = string | number;

export type SyncByIdOptions<TItem extends { id: SyncId }, TTarget> = {
  currentItems: readonly TItem[];
  previousItems?: readonly TItem[];
  targetsById: Map<SyncId, TTarget>;
  createTarget: (item: TItem) => TTarget;
  updateTarget: (
    target: TTarget,
    currentItem: TItem,
    previousItem?: TItem,
  ) => void;
  removeMissing?: boolean;
};

export function computeInterpolationAlpha(
  elapsedMs: number,
  tickIntervalMs: number,
  maxAlpha = 1.5,
): number {
  if (tickIntervalMs <= 0) {
    return maxAlpha;
  }

  return Math.max(0, Math.min(maxAlpha, elapsedMs / tickIntervalMs));
}

export function syncById<TItem extends { id: SyncId }, TTarget>(
  options: SyncByIdOptions<TItem, TTarget>,
): void {
  const previousItemsById = new Map<SyncId, TItem>();
  for (const item of options.previousItems ?? []) {
    previousItemsById.set(item.id, item);
  }

  const currentIds = new Set<SyncId>();

  for (const currentItem of options.currentItems) {
    currentIds.add(currentItem.id);

    const existingTarget = options.targetsById.get(currentItem.id);
    if (!existingTarget) {
      options.targetsById.set(currentItem.id, options.createTarget(currentItem));
      continue;
    }

    options.updateTarget(
      existingTarget,
      currentItem,
      previousItemsById.get(currentItem.id),
    );
  }

  if (!options.removeMissing) {
    return;
  }

  for (const targetId of options.targetsById.keys()) {
    if (!currentIds.has(targetId)) {
      options.targetsById.delete(targetId);
    }
  }
}
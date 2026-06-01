// Plant growth stages. Growth accumulates with total completions; misses only make the
// plant rest, never shrink it (invariant 3).
export const STAGE_NAME = ["Seed", "Sprouting", "Growing", "Budding", "Blooming", "Flourishing"];
export const STAGE_H = [14, 44, 76, 106, 132, 150];
export const STAGE_LEAVES = [0, 1, 2, 3, 3, 4];
export const stageFor = (t: number) => (t < 1 ? 0 : t < 5 ? 1 : t < 15 ? 2 : t < 30 ? 3 : t < 60 ? 4 : 5);

// App-level view models (what the UI works with — distinct from raw DB rows).

// A habit shaped for the UI: DB fields + derived colors + joined identity/anchor.
export type Habit = {
  id: string;
  status: string;
  name: string;
  tiny: string;
  activation_order: number | null;
  identity: string;
  anchor: string;
  hue: number;
  c1: string;
  c2: string;
};

export type Goal = { id: string; identity_id: string | null; title: string; status: string };

export type Proposal = {
  id: string;
  change_type: string;
  details: string;
  rationale: string | null;
  status: string;
  created_at: string;
};

// Fields the accept sheet collects, per change_type.
export type AcceptPayload = {
  habitId?: string;
  anchor?: string;
  tiny?: string;
  name?: string;
  goalId?: string;
};

export type HabitHistory = { grid: string[][]; total: number; month: number; cur: number; best: number };

// One habit + its computed history (what Garden/Progress iterate over).
export type HistoryEntry = HabitHistory & { habit: Habit };

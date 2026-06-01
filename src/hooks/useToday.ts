import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../lib/useAuth";
import { vibrate } from "../lib/format";
import { fetchTodayState } from "../data/habits";
import { logDone, logSkipped, removeLog } from "../data/logs";
import { fetchPending, applyProposal, rejectProposal as rejectProposalDb } from "../data/proposals";
import { reflectWeek as reflectWeekApi } from "../data/coach";
import type { Habit, Goal, Proposal, AcceptPayload } from "../types";

// Owns the Today/Plan/Progress data: habits, today's done/skipped, history, proposals, and
// all their mutations (optimistic with revert). DisciplineOS just routes tabs + renders.
export function useToday() {
  const { session } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [historyByHabit, setHistoryByHabit] = useState<Map<string, Set<string>>>(new Map());

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const s = await fetchTodayState(todayISO);
      if (cancelled) return;
      setHabits(s.habits);
      setGoals(s.goals);
      setDone(s.done);
      setSkipped(s.skipped);
      setHistoryByHabit(s.historyByHabit);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session, todayISO]);

  // done and skipped share the day's single row, so completing clears a skip and vice-versa.
  const completeHabit = useCallback(async (habitId: string) => {
    const wasSkipped = skipped.has(habitId);
    setDone((prev) => { const n = new Set(prev); n.add(habitId); return n; });
    setSkipped((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
    const { error } = await logDone(session!.user.id, habitId, todayISO);
    if (error) {
      setDone((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
      if (wasSkipped) setSkipped((prev) => { const n = new Set(prev); n.add(habitId); return n; });
    }
  }, [session, todayISO, skipped]);

  const undoHabit = useCallback(async (habitId: string) => {
    setDone((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
    const { error } = await removeLog(habitId, todayISO);
    if (error) setDone((prev) => { const n = new Set(prev); n.add(habitId); return n; });
  }, [todayISO]);

  const skipHabit = useCallback(async (habitId: string) => {
    const wasDone = done.has(habitId);
    setSkipped((prev) => { const n = new Set(prev); n.add(habitId); return n; });
    setDone((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
    const { error } = await logSkipped(session!.user.id, habitId, todayISO);
    if (error) {
      setSkipped((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
      if (wasDone) setDone((prev) => { const n = new Set(prev); n.add(habitId); return n; });
    }
  }, [session, todayISO, done]);

  const unskipHabit = useCallback(async (habitId: string) => {
    setSkipped((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
    const { error } = await removeLog(habitId, todayISO);
    if (error) setSkipped((prev) => { const n = new Set(prev); n.add(habitId); return n; });
  }, [todayISO]);

  const loadProposals = useCallback(async () => {
    if (!session) return;
    setProposals(await fetchPending());
  }, [session]);

  const acceptProposal = useCallback(async (proposal: Proposal, payload: AcceptPayload) => {
    try {
      const applied = await applyProposal(session!.user.id, proposal, payload, habits);
      setHabits(applied);
      setProposals((ps) => ps.filter((x) => x.id !== proposal.id));
      vibrate([10, 24, 12]);
    } catch (e) {
      console.error("acceptProposal failed", e); // proposal stays; nothing applied
      vibrate(4);
    }
  }, [session, habits]);

  const rejectProposal = useCallback(async (proposal: Proposal) => {
    await rejectProposalDb(proposal);
    setProposals((ps) => ps.filter((x) => x.id !== proposal.id));
    vibrate(8);
  }, []);

  const reflectWeek = useCallback(() => reflectWeekApi(session!.access_token), [session]);

  const active = habits.filter((h) => h.status === "active");
  const queued = habits.filter((h) => h.status === "queued");
  const warmth = active.length
    ? [...done].filter((id) => active.some((h) => h.id === id)).length / active.length
    : 0;

  return {
    session, habits, active, queued, goals, done, skipped, loading, proposals, historyByHabit, warmth,
    completeHabit, undoHabit, skipHabit, unskipHabit, loadProposals, acceptProposal, rejectProposal, reflectWeek,
  };
}

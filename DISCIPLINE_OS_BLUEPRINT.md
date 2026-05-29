# Discipline OS — Blueprint

*A research-grounded design for a personal, chat-based habit & discipline coach — and the structured plan to run yourself through it.*

Working title only; brand it whatever you like (it slots naturally alongside Potheads / LearnLang).

---

## 0. What you actually asked for

Three things, braided together:

1. **A way to state your intentions** and turn them into a structured, research-backed plan for building good habits and discipline.
2. **An app design** for a customizable, chat-based coach that learns about you, holds you accountable, and makes the process enjoyable — grounded in behavioral science, UX research, and coaching practice.
3. **A concrete plan for your five goals**: system-design interviews, working out, Spanish, guitar, and pottery.

This document is written through the three expert lenses you asked for — a behavioral-science PhD, a UX designer, and an AI-coaching architect — then synthesized into a buildable design and a personal plan. Every major claim is grounded in the research summarized in §1.

---

## 1. The research foundation (what actually works)

This is the evidence base. The rest of the document is downstream of it.

### 1.1 How habits actually form

- **Forget "21 days."** A 2024 systematic review and meta-analysis from the University of South Australia (Singh, Murphy, Maher & Smith, *Healthcare*, 20 studies / 2,601 participants) found a **median time to automaticity of ~59–66 days**, with means stretching to **106–154 days** and an individual range of **18 to 254 days**. This confirms Phillippa Lally's earlier UCL work (avg ~66 days).
- **Complex / effortful habits take longest.** Simple behaviors (a glass of water after breakfast) automate in a few weeks; **exercise habits routinely took 100+ days** because they involve planning, exertion, and recovery. Your workout and guitar habits are in the slow lane — design for that.
- **Context stability + repetition is the engine.** Automaticity comes from repeating a behavior in a *stable context*. The same cue, same place, same time. Morning routines tended to stick better than evening ones (more energy, fewer competing demands).
- **Most of life is already habitual.** Wendy Wood's research finds ~**65% of daily behavior is triggered automatically** rather than consciously decided. Discipline is less about willpower in the moment and more about engineering the cues that fire automatically.

**Design implication:** the app's job is to help you repeat a *small, well-anchored* behavior in a *stable context* long enough (months) for it to go automatic — and to keep you from quitting during the long pre-automaticity slog where it still feels effortful.

### 1.2 The mechanics that move behavior

A short, high-leverage toolkit drawn from the established literature:

- **Fogg Behavior Model — B = MAP.** A behavior happens when **M**otivation, **A**bility, and a **P**rompt converge at the same moment. Motivation is unreliable and fluctuates; the durable lever is **raising ability by shrinking the behavior** ("floss one tooth," "play one chord change") and **installing a reliable prompt**. Then *celebrate immediately* — emotion is what wires the habit in.
- **Implementation intentions (Gollwitzer).** "When [situation], I will do [behavior]." This if-then format has a robust medium-to-large effect across hundreds of studies. It pre-decides the behavior so you don't negotiate with yourself in the moment.
- **Habit stacking / anchoring.** Attach the new behavior to an existing rock-solid routine: "After I pour my morning coffee, I sketch one system-design component." The existing habit *is* the prompt.
- **Identity-based habits (Clear).** The most durable framing isn't outcome-based ("I want to get fit") but identity-based ("I'm someone who trains"). Every action is a small vote for that identity. The app should track identity, not just tasks.
- **Self-monitoring is itself a powerful intervention.** Harkin et al. (2016), a meta-analysis of 138 studies / 19,000+ participants, found that *tracking alone* — no coach, no group — significantly improves goal attainment. Logging is not bookkeeping; it's an active behavior-change technique. This is the app's beating heart.
- **Temptation bundling (Milkman).** Pair a "want" with a "should": only listen to your favorite podcast while working out. Couples an immediate reward to a delayed-payoff behavior.
- **Goal-setting theory (Locke & Latham).** Specific + moderately challenging goals with feedback beat "do your best." But the *goal* and the *daily habit* are different objects — the app must model both.
- **Deliberate practice (Ericsson).** For skill goals (guitar, pottery, system design), reps aren't enough — you need focused practice at the edge of ability with feedback. The coach's role is to keep pushing the edge.

### 1.3 Why these apps fail (so we can not)

- **The curve is brutally front-loaded.** A scoping review (525,824 participants) found a **median 70% of users abandon health apps within 100 days**, and other studies put activity-tracker abandonment at **50–62% within the first two weeks**.
- **Setup friction is the #1 killer** — not missing features. Every extra onboarding step raises Day-1 churn. The fix: **start with ≤3 habits**, near-zero logging friction, "learn by doing" (progressive disclosure) instead of tutorials.
- **Generic goals fail; tailoring wins.** One-size interventions don't fit individual needs — personalization in real time is the differentiator.
- **Apps set users up for disappointment.** They imply linear progress, then a single missed day feels like total failure and people quit. Designing for setbacks (planned flex days, graceful recovery) is essential.
- **Notification spam is now treated as spam.** Generic pings churn users. Notifications must be *contextual* — triggered by behavior, delivered at the moment of need.

### 1.4 The motivation trap (this is the most important section)

Self-Determination Theory (Ryan & Deci) is the hinge the whole design turns on. Behavior is sustained by **autonomous motivation** (you do it because it matters to you / is intrinsically rewarding), and undermined by **controlled motivation** (guilt, external pressure). Three psychological needs drive autonomous motivation:

- **Autonomy** — I chose this; I have meaningful control.
- **Competence** — I can see myself getting better.
- **Relatedness** — I'm connected to someone who cares about my progress.

The critical finding for a *gamified* app: **gamification can either feed or starve these needs.** Points and badges deployed as controls ("do X to earn Y") and **streaks enforced by loss/shame produce introjected regulation — short-term compliance that collapses.** The same mechanics deployed to give *competence feedback*, *meaningful choice*, and *social connection* produce durable engagement and real behavior change. Autonomous motivation predicts long-term maintenance **far better** than controlled motivation.

**This is the design constraint that separates a coach you love from an app you delete:** every game mechanic must be auditable against "does this support autonomy/competence/relatedness, or does it coerce?"

### 1.5 Does an AI coach actually help?

Yes, and the recent evidence is surprisingly strong:

- **Therabot RCT (NEJM AI, 2025):** a generative-AI mental-health chatbot produced statistically significant symptom reductions vs. controls, **95% of participants engaged** (~260 messages over 4 weeks), and users formed a **therapeutic alliance comparable to human outpatient therapy.** People *do* bond with and adhere to a well-designed conversational agent.
- **Relational matters more than informational.** A physical-activity chatbot study found that chatbots using warm, *relational* communication strategies built stronger alliance and better adherence than purely informational ones. A behaviorally-informed chatbot beat one-way reminders at changing behavior (Nat. Hum. Behav., 2024).
- **Rule-based bots fade; personalized/generative ones sustain.** Topic-based rule-bots showed short-term gains that *didn't persist* — researchers explicitly called for greater personalization and hybrid generative approaches for long-term outcomes.

**Design implication:** the coach should be generative, relational (not just a reminder engine), and deeply personalized through memory. That's exactly the thing an LLM-native app can do that a Habitica or a Streaks app structurally cannot.

---

## 2. Three expert lenses

The same evidence, refracted through the three perspectives you asked for. Each ends with non-negotiables for the build.

### 2.1 🎓 The Behavioral-Science PhD

> *"You're not building a tracker. You're building a machine for repeating small behaviors in stable contexts until they go automatic, while protecting the user's autonomous motivation through the months it takes."*

**Core model.** Model the user as a stack: **Identity → Goal → Keystone Habit → Implementation Intention → Daily Action → Reflection.** Most apps only model "Daily Action" (the checkbox). The leverage is in the layers above and below it.

**Sequencing over stacking.** The research says start with ≤3 habits. Five simultaneous new habits is the highest-probability path to abandoning all five. **Stagger them.** Anchor 2–3 keystone habits until they're automatic (weeks), *then* layer in the next. The coach should actively resist the user's urge to do everything at once — that resistance is a feature.

**Make the habit absurdly small to start.** The committed daily minimum should be something you'd do on your worst day: "put on running shoes," "one chord change," "read one paragraph of a system-design pattern." Volume is a bonus, not the requirement. This is the single biggest predictor of getting past the two-week cliff.

**Design for the miss.** Lally's data showed a single missed day does *not* meaningfully harm habit formation. Build this into the product: planned flex days, a "you missed yesterday — totally fine, here's the smallest possible re-entry" flow, and *never* a guilt mechanic. The goal is "never miss twice," framed with compassion.

**Differentiate goal-type.** Frequency habits (workout, Spanish review) and skill-mastery goals (guitar, pottery, system design) need different scaffolding. Skill goals need *deliberate practice* prompts ("what was at the edge of your ability today?"), not just attendance.

**Non-negotiables:** identity layer; implementation-intentions as first-class objects; tiny default actions; compassionate miss-recovery; staggered onboarding; self-monitoring as the core loop.

### 2.2 🎨 The UX Designer

> *"The user will give you about ninety seconds of patience and two weeks of benefit-of-the-doubt. If the daily loop isn't a delight by then, you've lost them — and most well-being apps lose them right here."*

**Onboarding = progressive disclosure.** No tutorial walls. The user states an intention in plain language to the coach, and the coach *does the structuring* conversationally — proposing an identity, a keystone habit, a tiny version, an anchor. The user learns the model by using it, not by reading it. First session ends with one habit defined and the first (trivially easy) action available.

**The daily loop must be sub-10-seconds.** Open → see today's anchored action → one tap to log → a moment of earned delight (a satisfying animation, a piece of the visual progress filling in, a one-line note from the coach). Logging friction is where apps die. Optional depth (a reflection, a chat) is *available* but never *required*.

**Visual progress that signals competence, not compliance.** A heatmap / "garden growing" / mastery-curve view that makes the user *feel themselves getting better.* This satisfies the competence need directly. Avoid the angry red "you broke your streak" pattern — show the long arc, not the broken chain.

**Match the mechanic to the person.** Different people are moved by different mechanics — loss-aversion (streaks), variable reward (surprise), or pure visual progress (completion maps). Let the user (and over time, the coach) tune which mechanics are active. Forced streaks for a streak-averse person = uninstall.

**Contextual, earned notifications.** Notifications fire from *behavior and context* ("it's your anchored 8am study block" / "you usually practice guitar around now — 5 minutes?"), not on a generic schedule. A notification the user didn't find useful should make the system *less* likely to send that type again.

**Aesthetics carry real weight.** You care about game art; use it. A coherent, characterful visual world (you've analyzed Hades, Fields of Mistria, Cuphead — that sensibility) makes the daily return *intrinsically* pleasant, which is itself a competence/autonomy-supporting reward rather than a coercive one.

**Non-negotiables:** ≤90s onboarding-to-first-action; ≤10s daily loop; progress visualization framed as growth; user-tunable mechanics; behavior-triggered notifications; characterful, non-generic UI.

### 2.3 🤖 The AI-Coaching Architect

> *"The product *is* the relationship. The LLM's job isn't to answer questions — it's to be a coach who genuinely remembers you, adapts to you, and is on your side over months. Memory is the entire moat."*

**Coaching stance: motivational interviewing, not nagging.** The coach asks more than it tells; reflects the user's own reasons for change back to them; rolls with resistance instead of arguing; and celebrates wins specifically and immediately (the Fogg "celebration wires the habit" mechanism). It is warm and relational — the relational quality is what the RCTs show drives adherence.

**Memory architecture (three tiers).** This is the part most "AI habit apps" get wrong by stuffing everything into one prompt:

1. **Structured state (always in context).** The current Identity → Goal → Habit → Intention tree, today's actions, current streaks/cadence, this week's focus, recent miss/hit pattern. This is *data*, injected as compact structured text every turn. It's cheap and authoritative.
2. **Semantic profile (retrieved).** Durable facts about the user: what motivates them, what their obstacles are, their schedule constraints, their preferences, their wins they're proud of. The coach *writes to this itself* ("Coach notes: Nicho disengages when a plan feels rigid; responds well to systems framing"). Retrieved by relevance.
3. **Episodic log (summarized + retrieved).** Past check-ins and reflections. Rolling weekly summaries keep it compact; specific episodes retrieved when relevant ("three weeks ago you said evenings were your weak point for guitar — how's that going?").

**The coach maintains its own notes about the user.** After meaningful interactions, the LLM updates tier-2 with observations. This is what makes it feel like it *knows you* rather than re-meeting you each session — the explicit thing you said you want.

**Adaptive difficulty via the coach.** When the user is crushing it, the coach proposes raising the bar (autonomy-respecting: it *proposes*, the user *decides*). When they're struggling, it proposes shrinking the habit rather than pushing harder — protecting motivation over short-term output.

**Guardrails.** The coach should not become the user's only source of support or accountability, should be honest rather than flattering (real coaches push back), and should hand off appropriately on anything outside its lane (it's a habit coach, not a therapist).

**Non-negotiables:** three-tier memory; coach-authored notes; MI-style stance; coach proposes / user decides; honest over sycophantic; warm/relational tone.

---

## 3. The synthesized app design

### 3.1 The core loop

```
STATE INTENTION  →  COACH STRUCTURES IT  →  TINY ANCHORED ACTION
        ↑                                              ↓
   WEEKLY REVIEW  ←  COACH REFLECTION  ←  ONE-TAP LOG + DELIGHT
   (adapt/level)        (memory write)
```

Daily: open → anchored action → one-tap log → micro-delight → (optional) chat. Weekly: a coached review ritual that looks at the week's pattern, celebrates, and adapts the plan. Both loops write to memory.

### 3.2 Data model (the layers, as objects)

| Object | Holds | Why it exists |
|---|---|---|
| **Identity** | "Someone who trains," "An engineer who thinks in systems" | Durable motivation; every action is a vote for it |
| **Goal** | Specific, time-bound outcome (Locke & Latham) | Direction + feedback target |
| **Habit** | The recurring behavior serving a goal | The thing that goes automatic |
| **Implementation Intention** | Anchor (cue) + tiny behavior + context (when/where) | Pre-decides the behavior; the prompt |
| **Session/Log** | Did it / didn't / how it went / deliberate-practice note | Self-monitoring (the active ingredient) |
| **Reflection** | User + coach notes on a check-in or week | Episodic memory; adaptation input |
| **Coach Memory** | Semantic profile + coach-authored notes | The relationship / personalization moat |

Note the separation of **Goal** (outcome) from **Habit** (process) from **Implementation Intention** (the exact when/where). Collapsing these is the modeling mistake most apps make.

### 3.3 Gamification, SDT-audited

Every mechanic, checked against the three needs (§1.4):

| Mechanic | Implementation | Need served | Trap to avoid |
|---|---|---|---|
| Progress visualization | Heatmap / growing garden / mastery curve | Competence | Don't frame as "broken chain" |
| Streaks | *Optional, per-user*, with built-in flex days | Competence (if chosen) | Never shame-enforce; never the only mechanic |
| Leveling / mastery | Skill goals show a competence curve | Competence | Don't gate intrinsic activity behind points |
| Coach relationship | Warm, remembering, celebrating | Relatedness | Don't let it become the *only* support |
| User-tuned goals/cadence | User sets and renegotiates everything | Autonomy | Don't impose rigid plans |
| Variable delight | Occasional surprise notes/visuals | Engagement | Keep it a garnish, not the diet |
| Identity reinforcement | "That's 12 votes for the engineer you're becoming" | Autonomy + competence | — |

**Rule of thumb:** if a mechanic makes the user feel *watched and judged*, cut it. If it makes them feel *capable, in control, and seen*, keep it.

### 3.4 The coach's system prompt (sketch)

The coach is defined by a system prompt plus injected memory. Skeleton:

```
You are [user]'s personal habit coach. Your job is to help them build
durable habits and discipline toward their stated goals, over months.

STANCE: Motivational interviewing. Ask more than you tell. Reflect their
own reasons back. Roll with resistance. Celebrate wins specifically and
immediately. Be warm but honest — push back when a plan is unrealistic
or when they're avoiding. You are a coach, not a cheerleader and not a
therapist.

METHOD: Work the layers — Identity → Goal → Habit → Implementation
Intention → tiny daily action. Keep new habits ≤3 at a time; resist
over-commitment. Make actions absurdly small to start. Design for misses
with compassion ("never miss twice"). For skill goals, push deliberate
practice at the edge of ability.

ADAPT: When they're thriving, PROPOSE raising the bar — they decide.
When struggling, PROPOSE shrinking the habit, not pushing harder.

MEMORY: After meaningful exchanges, write durable observations about what
motivates them, their obstacles, and what's working to COACH_NOTES.

[INJECTED: structured state — current tree, today's actions, streaks,
this week's focus, recent hit/miss pattern]
[RETRIEVED: relevant semantic profile + coach notes + episodic summaries]
```

---

## 4. Your personal plan

A note first, in the spirit of the honest-coach stance: **five new habits at once is the research-backed way to abandon all five.** So this plan *sequences* them. Two keystone habits start now; the rest phase in as the first ones automate (≈4–8 weeks each). You can disagree — you have full autonomy here — but this is what the evidence says gives you the best odds.

Suggested sequence, based on leverage and your current life: **Workout + System Design first** (highest stakes — health and the job search you're in right now), then **Spanish** (you already have the SRS muscle from LearnLang), then **Guitar**, then **Pottery** (you're already a committed TPS member, so this one's about consistency, not ignition).

For each goal: identity, the keystone habit, the tiny version (your worst-day minimum), the anchor, weekly cadence, the deliberate-practice angle where relevant, and what to actually measure.

### Goal 1 — System Design Interviews  *(start now)*
- **Identity:** "An engineer who thinks in systems." (Not "someone cramming for interviews.")
- **Keystone habit:** One focused study block.
- **Tiny version:** Read and sketch *one* component/pattern for 10 minutes.
- **Anchor:** "After my morning coffee, before opening work Slack, I do one system-design block." (Mornings stick best; this also front-runs the workday.)
- **Cadence:** Daily tiny block on weekdays; one full **timed mock problem** on weekends.
- **Deliberate practice:** Don't just read — *produce*. Whiteboard a design out loud, then compare against a reference. Keep a running list of patterns (sharding, caching, queues, consistency models) and **spaced-repeat** them — you know this technique cold from LearnLang.
- **Measure:** Mock problems completed; patterns you can now design from memory. *Not* hours.
- **Milestone:** From 10-min sketches → one full 45-min mock/week → mocks with a peer.

### Goal 2 — Working Out  *(start now)*
- **Identity:** "Someone who trains."
- **Keystone habit:** Show up to train.
- **Tiny version:** Put on workout clothes and do one set. (On a bad day, that's the whole requirement.)
- **Anchor:** Morning, anchored to an existing fixed routine ("After I brush my teeth, I change into training clothes").
- **Cadence:** Start at 3×/week. Patience is mandatory here — **exercise habits often take 100+ days to automate**, the slowest of all your goals.
- **Temptation bundle:** Reserve a specific podcast/playlist for training only.
- **Measure:** Sessions completed per week (a process metric). Ignore body-composition outcomes for the first ~3 months — they'll lag and discourage you.
- **Milestone:** 3×/week automatic → progressive overload / structured program.

### Goal 3 — Spanish  *(phase in ~week 5–6)*
- **Identity:** "A Spanish speaker." (You're already "a Vietnamese language student" — same muscle, new target.)
- **Keystone habit:** Daily review + a little output.
- **Tiny version:** 5 minutes of spaced-repetition review.
- **Anchor:** Lunchtime or commute — a dead-time slot you don't have to defend against other priorities.
- **Cadence:** Daily SRS (short); 1–2×/week active output (speaking/writing a few sentences).
- **Dogfood angle:** You built LearnLang. Run your Spanish through it where it fits — using your own tool keeps you close to both goals, and it's a feedback loop for the product.
- **Measure:** Daily review consistency (gently); words/phrases you can *produce*, not just recognize.
- **Milestone:** Recognition → a short spoken self-intro → a few minutes of unscripted conversation.

### Goal 4 — Guitar  *(phase in ~week 9–10)*
- **Identity:** "A guitarist."
- **Keystone habit:** Pick up the guitar and practice deliberately.
- **Tiny version:** One chord-change drill (e.g., G→C clean, 10 reps).
- **Anchor:** Evening wind-down ("After dinner, before screens, I pick up the guitar"). Evenings are weaker for automaticity, so keep this one *especially* tiny and forgiving.
- **Deliberate practice:** Don't just strum songs you know — drill the specific thing that's currently hard (a transition, a strum pattern, a scale) at the edge of your ability.
- **Measure:** Practice sessions; one concrete skill unlocked per 2–3 weeks (a song, a transition, a technique).
- **Milestone:** Chord changes → a full song → playing something you enjoy without thinking about it.

### Goal 5 — Pottery  *(phase in ~week 13+, lowest urgency)*
- **Identity:** "A potter." (Already true — you're a Pottery Studio Brooklyn member, working cone-10 reduction glazes.) This goal isn't about *ignition*; it's about *consistency and finishing*.
- **Keystone habit:** Regular studio reps + moving pieces through stages.
- **Tiny version:** On a non-studio day, 10 minutes of centering practice or wedging; on studio days, throw at least 2 pieces.
- **Anchor:** Your existing studio days are the cue — formalize them as protected, recurring blocks.
- **Deliberate practice:** Pick one skill per stretch (centering consistency, pulling even walls, trimming) and drill it rather than making one-offs.
- **Dogfood angle:** This maps directly onto **Potheads** — your Drying → Bisque → Glazed → Finished pipeline *is* the self-monitoring loop. Pottery progress can literally live in the app you already built.
- **Measure:** Pieces completed through to Finished; the skill you're currently drilling.
- **Milestone:** Consistent centering → even walls → a cohesive series in your favorite glazes (Pete's Cranberry, Ohata Red).

### Cross-goal scheduling reality check
Two keystone habits now (workout AM, system-design AM, both before work) is realistic. Layering Spanish into a lunch/commute slot is low-conflict. Guitar in the evening and pottery on existing studio days don't compete with the mornings. The plan is built so no two habits fight for the same slot — which is exactly what stable-context repetition requires.

---

## 5. Build roadmap (your stack)

You'll build this the way you built Potheads and LearnLang: **Vite + React 19, Tailwind v4, Supabase, Vercel**, with **Claude via Supabase Edge Functions** (keep the API key server-side; don't ship it client-side like the artifact pattern does). You can lift components and patterns straight from your existing two apps.

**Phase 0 — Schema.** Supabase tables mirroring §3.2: `identities`, `goals`, `habits`, `implementation_intentions`, `sessions`, `reflections`, `coach_memory` (split: `semantic_profile` rows + `coach_notes` + `weekly_summaries`). RLS on by default. *(You can reuse your auth + Supabase setup from LearnLang almost wholesale.)*

**Phase 1 — Coached onboarding (progressive disclosure).** A chat screen where you state an intention in plain language; an Edge Function calls Claude to structure it into the Identity→Goal→Habit→Intention tree and writes it. **Hard-cap active habits at 3.** Ends with the first trivially-easy action queued. *Ship this and use it before building anything else.*

**Phase 2 — The daily loop + self-monitoring.** Today view, one-tap logging (<10s), micro-delight animation, progress visualization (heatmap or your game-art "growing world"). This alone — per Harkin et al. — already changes behavior. **This is your MVP.**

**Phase 3 — The coach with memory.** Edge Function that assembles the prompt: system prompt (§3.4) + structured state (always) + retrieved semantic profile / coach notes / episodic summaries. Coach writes back to `coach_notes` after meaningful turns. This is the part that makes it *yours* and is the hardest to copy.

**Phase 4 — Weekly review ritual + adaptation.** A coached weekly check-in that reviews the hit/miss pattern, celebrates, and *proposes* (you approve) leveling up or shrinking habits. Add behavior-triggered notifications here, not before.

**Phase 5 — SDT-audited gamification + polish.** Layer in the §3.3 mechanics, each toggleable. Bring your game-art sensibility to the visual world. Audit every mechanic against autonomy/competence/relatedness before shipping it.

**Sequencing principle for the build mirrors the habit plan:** ship Phases 1–2 and *actually run your own workout + system-design habits through it for two weeks* before building the coach. Dogfood the cliff your real users will hit.

---

## 6. The one-paragraph version

Habits take ~2–4 months to automate (longer for exercise), so the app's whole job is to keep a *tiny, well-anchored* behavior repeating in a *stable context* without you quitting during the long effortful stretch — and to do it while feeding autonomy, competence, and relatedness rather than coercing you with shame-streaks. Self-monitoring alone changes behavior; a warm, remembering, generative AI coach measurably boosts adherence on top of that. Start with two keystone habits (workout + system design, both anchored to your morning), phase the rest in as they stick, keep the daily loop under ten seconds, design compassionately for missed days, and build memory as the moat. The plan is sequenced, the app is buildable on the stack you already use, and pottery + Spanish can dogfood the tools you've already shipped.

---

*Sources grounding this document include: Singh et al. 2024 habit-formation meta-analysis (UniSA, Healthcare); Lally et al. (UCL); Wood (habit automaticity); Fogg (Behavior Model / Tiny Habits); Clear (identity-based habits); Gollwitzer (implementation intentions); Locke & Latham (goal-setting); Harkin et al. 2016 (self-monitoring meta-analysis); Ryan & Deci (Self-Determination Theory) and SDT-gamification reviews; the 2024 scoping review on app abandonment; and 2024–2025 RCTs on AI/chatbot behavior-change and coaching (incl. Therabot, NEJM AI 2025; relational PA chatbot studies; Nat. Hum. Behav. 2024).*

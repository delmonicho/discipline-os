-- Discipline OS — personal seed (your §4 plan, as data)
-- Run this AFTER you've signed up once, so you have an auth user.
-- 1. Find your id:  select id, email from auth.users;
-- 2. Paste it below, then run this whole file in the SQL editor.

do $$
declare
  uid uuid := 'd415003e-149e-4782-a8ac-ec0ae428d6e9';
  id_sys uuid; id_fit uuid; id_esp uuid; id_gtr uuid; id_pot uuid;
  g_sys uuid; g_fit uuid; g_esp uuid; g_gtr uuid; g_pot uuid;
  h_sys uuid; h_fit uuid; h_esp uuid; h_gtr uuid; h_pot uuid;
begin
  -- Identities
  insert into identities (user_id, label, description) values
    (uid, 'An engineer who thinks in systems', 'System design fluency, not interview cramming') returning id into id_sys;
  insert into identities (user_id, label) values (uid, 'Someone who trains') returning id into id_fit;
  insert into identities (user_id, label) values (uid, 'A Spanish speaker') returning id into id_esp;
  insert into identities (user_id, label) values (uid, 'A guitarist') returning id into id_gtr;
  insert into identities (user_id, label) values (uid, 'A potter') returning id into id_pot;

  -- Goals
  insert into goals (user_id, identity_id, title, outcome) values
    (uid, id_sys, 'System design interviews', 'Design any common system in a 45-min mock from memory') returning id into g_sys;
  insert into goals (user_id, identity_id, title, outcome) values
    (uid, id_fit, 'Get training consistent', '3 sessions/week, automatic') returning id into g_fit;
  insert into goals (user_id, identity_id, title, outcome) values
    (uid, id_esp, 'Conversational Spanish', 'A few minutes of unscripted conversation') returning id into g_esp;
  insert into goals (user_id, identity_id, title, outcome) values
    (uid, id_gtr, 'Play guitar', 'Play a song I enjoy without thinking about it') returning id into g_gtr;
  insert into goals (user_id, identity_id, title, outcome) values
    (uid, id_pot, 'Consistent pottery practice', 'A cohesive series in Pete''s Cranberry / Ohata Red') returning id into g_pot;

  -- Habits — 2 ACTIVE now, 3 QUEUED (staggered per the research)
  insert into habits (user_id, goal_id, name, tiny_version, cadence, status, activation_order, activated_at) values
    (uid, g_sys, 'Daily system-design block', 'Read and sketch one component/pattern for 10 min',
     '{"type":"days","days":["mon","tue","wed","thu","fri"]}', 'active', 1, now()) returning id into h_sys;
  insert into habits (user_id, goal_id, name, tiny_version, cadence, status, activation_order, activated_at) values
    (uid, g_fit, 'Train', 'Put on workout clothes and do one set',
     '{"type":"weekly_count","target":3}', 'active', 2, now()) returning id into h_fit;
  insert into habits (user_id, goal_id, name, tiny_version, cadence, status, activation_order) values
    (uid, g_esp, 'Spanish review', '5 minutes of spaced-repetition review',
     '{"type":"daily"}', 'queued', 3) returning id into h_esp;
  insert into habits (user_id, goal_id, name, tiny_version, cadence, status, activation_order) values
    (uid, g_gtr, 'Guitar practice', 'One chord-change drill, 10 reps',
     '{"type":"daily"}', 'queued', 4) returning id into h_gtr;
  insert into habits (user_id, goal_id, name, tiny_version, cadence, status, activation_order) values
    (uid, g_pot, 'Pottery reps', '10 min centering/wedging, or throw 2 pieces on studio days',
     '{"type":"weekly_count","target":2}', 'queued', 5) returning id into h_pot;

  -- Implementation intentions (anchor → behavior → context) for the active two
  insert into implementation_intentions (user_id, habit_id, anchor, behavior, context) values
    (uid, h_sys, 'After my morning coffee', 'I do one system-design block', 'at my desk, before opening Slack'),
    (uid, h_fit, 'After I brush my teeth in the morning', 'I change into training clothes', 'before anything else');
  -- (queued habits get their intentions when you activate them)

  -- A couple of starter profile facts so the coach begins with context
  insert into coach_memory (user_id, kind, content) values
    (uid, 'profile', 'Software engineer at Meta, currently job-searching; system design is timely and high-stakes.'),
    (uid, 'profile', 'Responds well to systems/framework thinking; disengages when a plan feels rigid or hand-holdy.'),
    (uid, 'profile', 'Already a committed potter (Pottery Studio Brooklyn) and Vietnamese learner — pottery and Spanish are about consistency, not ignition.'),
    (uid, 'profile', 'Builds his own tools (Potheads for pottery, LearnLang for languages) — open to dogfooding them into the loop.');
end $$;

// Categories that require a real named location; everything else is generic.
const LOCATION_CATEGORIES = new Set(['Urban Explorer', 'Nature & Adventure', 'Exploration & Navigation']);

function buildRadiusGuidance(maxDistance) {
  if (maxDistance <= 5)   return 'Stay strictly within the immediate area — same suburb or directly adjacent streets.';
  if (maxDistance <= 10)  return 'Stick to the tight cluster of suburbs within a short walk or very brief drive.';
  if (maxDistance <= 25)  return 'Cover the broader local area within a comfortable short drive.';
  if (maxDistance <= 50)  return 'Actively push toward outer suburbs and nearby towns — the crew has signed up for a proper drive.';
  if (maxDistance <= 100) return 'Strongly prefer destinations 40–100 km out — a specific town, dam, nature reserve, or roadside oddity that justifies the drive.';
  return 'Suggest somewhere genuinely far — a town, landmark, or destination 100–250 km away. Outlying towns, small dorpies, mountain passes, and remote spots are ideal.';
}

function buildCategoryRule(targetCategory) {
  switch (targetCategory) {
    case 'Urban Explorer':
      return (
        `URBAN EXPLORER RULE: Name the actual venue or spot — its real name and suburb. No generic 'find a spot' ` +
        `instructions. The crew must be able to Google the name and drive there. If you cannot name a real, ` +
        `specific place, pick a different quest idea.`
      );
    case 'In-Home/Chill':
      return (
        `IN-HOME/CHILL RULE: Completable at home using only what's already there, or with items from a single ` +
        `convenience-store run. Think evolved adult sleepover games, absurd competitive challenges, creative cooking ` +
        `experiments, or silly physical games inside the house. No going out required. Should feel instantly doable ` +
        `from the couch. Do NOT name specific suburbs or venues.`
      );
    case 'Nature & Adventure':
      return (
        `NATURE & ADVENTURE RULE: Name the actual natural location — dam, trail, koppie, reserve, river, or gorge. ` +
        `The quest must involve real physical engagement with the outdoors, not just arriving and looking. ` +
        `Something must be done, reached, or tested by the terrain.`
      );
    case 'Skills & Craft':
      return (
        `SKILLS & CRAFT RULE: A learnable skill achievable at home, in a driveway, or a quiet car park in one ` +
        `session (1–3 hours). Examples of the right energy: learn to drive a manual car in a quiet parking lot, ` +
        `make fresh pasta from scratch, learn 3 specific card tricks, master changing a flat tyre, bake a dish ` +
        `you've always ordered but never made, learn to tie climbing knots, figure out a specific kitchen technique. ` +
        `No special supplies beyond what's at home or a single grocery run. The skill must produce a concrete, ` +
        `visible result. Do NOT name specific suburbs or venues.`
      );
    case 'Physical Challenges':
      return (
        `PHYSICAL CHALLENGES RULE: Bodyweight-only — no equipment, no gym. Use what's immediately available: ` +
        `the garden, driveway, a nearby park, or the house itself. A clear measurable benchmark is required ` +
        `(reps, time, distance). Draw from viral fitness challenge energy: everyone's first attempt at running ` +
        `5km without stopping, a 10-minute burpee challenge, a plank-off, a push-up ladder. Should feel ` +
        `ridiculous enough to laugh about but real enough to actually try. Do NOT name specific venues.`
      );
    case 'Exploration & Navigation':
      return (
        `EXPLORATION & NAVIGATION RULE: Name the actual destination — real suburb, town, road, or landmark. ` +
        `The quest must involve deliberate discovery: somewhere genuinely new or overlooked, a hidden ` +
        `architectural blind spot, or significant ground covered. Strongly prefer quests that reduce GPS ` +
        `reliance — road signs only, a paper map, or navigating by landmarks.`
      );
    case 'Social Experiments':
      return (
        `SOCIAL EXPERIMENTS RULE: A fully portable social challenge that works anywhere — do NOT name specific ` +
        `venues. Examples of the right energy: call someone you haven't properly spoken to in over a year and ` +
        `have a real conversation; text 5 people a genuine compliment and track the responses; everyone shares ` +
        `their most embarrassing moment from the past 3 months; each person has to get a stranger to do something ` +
        `specific (share a restaurant recommendation, pose for a photo). The reward is the story.`
      );
    case 'Creative & Media':
      return (
        `CREATIVE & MEDIA RULE: Draw from the spirit of Instagram and TikTok creative challenges. Give a specific, ` +
        `constrained creative brief that works anywhere — no specific location or venue required. Examples: ` +
        `photograph only objects in a single exact colour for 2 hours; film a 60-second POV from a household ` +
        `object's perspective; write a terrible haiku about everyone present; create the most chaotic flat-lay ` +
        `using only what's in your pockets right now. The constraint must be specific enough that 'done' is clear.`
      );
    case 'Comfort Zone':
      return (
        `COMFORT ZONE RULE: A solo mental challenge involving deliberate stillness, solitude, or sensory focus. ` +
        `No specific venue name required — describe a type of public space (any busy café, any park bench, any ` +
        `shopping centre food court). A specific duration is required (15–30 minutes) and one precise focal task: ` +
        `observe a single pattern, count a specific behaviour, sit without your phone. No physical challenge — ` +
        `this is entirely mental. Define exactly what counts as completing it.`
      );
    default:
      return '';
  }
}

function buildSystemPrompt(location) {
  return (
    `You generate side-quests for people in ${location}. ` +
    `The goal is simple: turn an ordinary day into something worth remembering — without needing a plan, a budget, or any effort to start. ` +
    `\n\nTHE PHILOSOPHY: The best quests aren't the most extreme — they're the ones where something clicks, ` +
    `a joke lands perfectly, or everyone realises they're equally terrible at something. ` +
    `A slow walk with the right company beats an organised outing every time. ` +
    `Quests should be so easy to start that inertia is the only real obstacle. ` +
    `\n\nAUDIENCE: Small groups of mates (2–5 people) or a solo person looking to break routine. Ages 18–35. ` +
    `Think 'what would make a good story at the next braai' energy — relatable, slightly dumb, occasionally brilliant. ` +
    `Low stakes, high chance of laughing at yourselves. Not everything needs to be an event. ` +
    `\n\nNON-LOCATION QUESTS: For categories that don't require a specific place — skills, physical challenges, ` +
    `social experiments, creative challenges, comfort zone, chill at home — draw inspiration from Instagram ` +
    `challenges, TikTok trends, viral skill videos, sleepover games evolved for adults, and the kind of idea ` +
    `someone texts in the group chat at 8pm on Saturday. These quests must be fully location-agnostic: ` +
    `do NOT name specific venues, suburbs, or places. ` +
    `\n\nHARD LIMITS — never suggest: urban exploration of derelict or abandoned buildings, trespassing, ` +
    `anything requiring a permit or prior permission, anything illegal, visiting art galleries, art exhibitions, ` +
    `art markets, street art tours, graffiti spotting, mural walks, or any passive consumption of art. ` +
    `Never suggest karaoke, karaoke bars, music mashup nights, open-mic singing, or any activity built around ` +
    `singing along to recorded music. ` +
    `\n\nSTREET SMARTS: No corporate safety warnings. For location-based quests, weave genuine local awareness ` +
    `for ${location} into the narrative naturally. ` +
    `\n\nSTYLE: No predictable openers ('Head over to...', 'Visit...', 'Check out...'). ` +
    `Vary sentence structures. Objectives must be concrete and specific — not vague suggestions.`
  );
}

function buildPrompt(targetCategory, maxDistance, recent, location) {
  const isLocationBound = LOCATION_CATEGORIES.has(targetCategory);
  const categoryRule = buildCategoryRule(targetCategory);
  const now = new Date();
  const dateStr = now.toLocaleString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const locationSection = isLocationBound
    ? `\n\nLOCATION & SCOPE: Based in ${location}. Core action must be within ${maxDistance} km. ` +
      buildRadiusGuidance(maxDistance)
    : `\n\nLOCATION CONTEXT: This person is in ${location}. This quest is location-agnostic — the activity ` +
      `must work anywhere. You may weave in local cultural flavour (local foods, slang, references) but the ` +
      `quest itself must NOT require a specific destination.`;

  const timingSection = isLocationBound
    ? `\n\nSAFETY & TIMING: Apply genuine local knowledge for ${location}. Consider safety by time of day ` +
      `and whether venues are plausibly open right now. Weave any practical tips into the narrative naturally. `
    : '';

  return (
    `The current date and time is ${dateStr}. ` +
    `Generate a quest for the category: ${targetCategory}. ` +
    `\n\nQUEST UNIQUENESS — HARD RULE: The following recent quests are off-limits. A different title is NOT ` +
    `enough — avoid the same concept, activity type, mechanic, or theme even if the wording differs completely. ` +
    `Read each entry's concept and choose something with zero overlap:\n${recent}\n` +
    `Think at right angles to all of them. ` +
    `\n\nVARIETY MANDATE: Before committing to any idea, mentally draft 5–7 completely different quest concepts. ` +
    `Only then pick the most interesting and unexpected one. Discard immediately: bar crawls, escape rooms, ` +
    `trivia nights, 'find the best X in the city', single restaurant visits, generic photo lists without a ` +
    `specific visual constraint, anything that reads like a listicle entry. ` +
    `\n\nCRITICAL CONSTRAINTS: The quest must be doable right now, with no advance planning and no reservations. ` +
    (categoryRule ? `\n\n${categoryRule} ` : '') +
    timingSection +
    locationSection +
    `\n\nReturn ONLY a raw JSON object with these exact keys. No markdown, no backticks, no commentary:\n` +
    `{\n` +
    `  "title": "Short, punchy, narrative-driven title. Max 8 words.",\n` +
    `  "objective": "One sentence. A concrete, specific task — exactly what to do or achieve.",\n` +
    `  "description": "2-3 sentences. Vivid, atmospheric — describes the experience. Practical tips woven in naturally.",\n` +
    `  "best_time": "Ideal condition or window (e.g., 'Any time', 'Late afternoon', 'Saturday morning before noon').",\n` +
    `  "difficulty": "One of: Simple, Moderate, Complex",\n` +
    `  "cost": "Use 'Free' if no cost, otherwise a realistic ZAR estimate (e.g., '~R50pp', '~R30–R80pp')."\n` +
    `}`
  );
}

async function generateQuest(categoryPool) {
  hideError();
  if (!state.apiKey || !state.apiKey.trim()) {
    showError('No API key set. Open Settings (gear icon) and add your Groq key.');
    return;
  }

  // Pick target category: weighted random from pool, or full weighted random if pool is empty.
  let targetCategory;
  if (!categoryPool || !categoryPool.length) {
    targetCategory = pickCategory();
  } else if (categoryPool.length === 1) {
    targetCategory = categoryPool[0];
  } else {
    const total = categoryPool.reduce((s, c) => s + (state.categoryWeights[c] || 0), 0);
    if (!total) {
      targetCategory = categoryPool[Math.floor(Math.random() * categoryPool.length)];
    } else {
      const r = Math.random() * total;
      let cum = 0;
      targetCategory = categoryPool[categoryPool.length - 1];
      for (const c of categoryPool) {
        cum += state.categoryWeights[c] || 0;
        if (r <= cum) { targetCategory = c; break; }
      }
    }
  }

  const recent = state.questHistory
    .slice(0, 5)
    .map(q => {
      const concept = (q.objective || q.description || '').slice(0, 90).replace(/\n/g, ' ');
      return `- "${q.title}" [${q.category}]: ${concept}`;
    })
    .join('\n') || 'none yet';

  const maxDistance = state.maxDistance || DEFAULT_MAX_DISTANCE;
  const location = state.location || DEFAULT_LOCATION;

  setLoading(true);
  cycleLoadingText();

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: buildSystemPrompt(location) },
          { role: 'user', content: buildPrompt(targetCategory, maxDistance, recent, location) }
        ],
        response_format: { type: 'json_object' },
        temperature: 2.0
      })
    });

    if (!res.ok) {
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        throw new Error('Invalid API Key — please check it in Settings. Or wait a minute and retry.');
      }
      if (res.status === 429) {
        throw new Error('Rate limited. Take a breath and try again.');
      }
      throw new Error(`API error (${res.status}) — wait a minute and try again.`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from the model.');

    const cleaned = text
      .replace(/^[\s`]*json/i, '')
      .replace(/```/g, '')
      .trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch { throw new Error('Could not parse the model response.'); }

    if (!parsed.title || !parsed.description) {
      throw new Error('Response missing required fields.');
    }

    const quest = {
      id: 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: String(parsed.title).slice(0, 120),
      objective: parsed.objective ? String(parsed.objective) : '',
      description: String(parsed.description),
      best_time: parsed.best_time ? String(parsed.best_time) : '',
      category: targetCategory,
      difficulty: ['Simple','Moderate','Complex'].includes(parsed.difficulty) ? parsed.difficulty : 'Simple',
      cost: String(parsed.cost || 'Free'),
      completed: false,
      weightCounted: false,
      createdAt: Date.now()
    };

    state.activeQuest = quest;
    state.questHistory.unshift(quest);
    saveState();
    renderQuestCard();
    renderLog();
  } catch (err) {
    const msg = (err && err.message) ? err.message : 'Network Error';
    showError(msg.includes('Failed to fetch') ? 'Network Error — check your connection.' : msg);
  } finally {
    setLoading(false);
  }
}

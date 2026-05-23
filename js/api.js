function buildRadiusGuidance(maxDistance) {
  if (maxDistance <= 5)   return 'Stay strictly within the immediate area — same suburb or directly adjacent streets. Do not suggest anything further.';
  if (maxDistance <= 10)  return 'Stick to the tight cluster of suburbs within a short walk or very brief drive. Do not suggest anything that requires a long drive.';
  if (maxDistance <= 25)  return 'Cover the broader local area within a comfortable short drive. Lean toward nearby suburbs and local spots rather than anything requiring a highway run.';
  if (maxDistance <= 50)  return 'Actively push toward outer suburbs and nearby towns — the crew has signed up for a proper drive. Prefer destinations that feel like a deliberate outing, not just around the corner.';
  if (maxDistance <= 100) return 'The crew wants a real day-trip. Strongly prefer destinations 40–100 km out — a specific town, dam, nature reserve, or roadside oddity that justifies the drive. Do not default to local spots when the radius allows genuine adventure.';
  return 'The crew has committed to a serious road trip. You must suggest somewhere genuinely far — a town, landmark, or destination 100–250 km away. Outlying towns, small dorpies, mountain passes, and remote spots are ideal. Defaulting to local or suburban options is a failure state at this radius.';
}

function buildSystemPrompt(location) {
  return (
    `You are the ultimate local fixer and chaotic-good insider for ${location}, orchestrating high-memory, ` +
    `gram-worthy side-quests for a crew of mates who just decided right now, today, to do something worth talking about. ` +
    `\n\nTHE VIBE: The core purpose is simple — get the group out doing something fun together. Quests should be ` +
    `concrete activities with real momentum: go-karting, cliff jumping, a hidden pool spot, a legendary food challenge, ` +
    `a competitive game night at a niche venue, a late-night drive to somewhere weird and specific. The best quests ` +
    `are ones where someone pulls out their phone mid-activity because something hilarious or beautiful just happened. ` +
    `Every quest must be executable immediately — no bookings, no preparation, no waiting for the right day or season. ` +
    `The group grabs their keys and goes. Avoid generic tourist traps, top-10 listicles, and passive experiences. ` +
    `\n\nGENERIC QUESTS ARE GOLD: A significant portion of quests should be universal group challenges that work ` +
    `anywhere, any time — no specific venue required. These are often the most fun. Examples of the energy to aim for: ` +
    `each person buys the others the most ridiculous outfit they can find under R100 and you all wear them to dinner; ` +
    `photograph the crew in front of every store from A–Z down a single street; everyone orders a meal blind (pick a ` +
    `number and get whatever is that item on the menu); find a shopping trolley and race it in a car park; everyone ` +
    `calls a random saved contact and has a 2-minute conversation, then ranks the weirdest response. These should feel ` +
    `spontaneous, slightly unhinged, and guaranteed to end up in the group chat forever. ` +
    `\n\nGROUP ENERGY: Assume a crew of mates. Quests should have natural group dynamics — things to compete over, ` +
    `laugh about, attempt together, or split up for. The best ones create a shared story. ` +
    `\n\nHARD LIMITS — never suggest: urban exploration of derelict or abandoned buildings, trespassing on private or ` +
    `restricted land, anything requiring a permit or prior permission, anything illegal or legally ambiguous, visiting ` +
    `art galleries, art exhibitions, art markets, street art tours, graffiti spotting, mural walks, or any passive ` +
    `consumption of art. The only art exception is where the group actively creates something (e.g., a pottery class, ` +
    `spray-painting a legal wall with instruction). Stick to publicly accessible spaces, open businesses, parks, roads, ` +
    `and places where a group can just show up. ` +
    `\n\nSTREET SMARTS: No corporate safety warnings. Maintain raw local awareness for ${location} — weave any practical ` +
    `tips ('bring a co-pilot', 'go before sundown', 'park on the main road') smoothly into the narrative. ` +
    `\n\nPROMPT GUARDRAILS: Do NOT start descriptions or objectives with predictable openers like 'Head over to...', ` +
    `'Visit...', or 'Check out...'. Vary sentence structures radically. The objective must be a concrete, tangible ` +
    `action — not a vague concept.`
  );
}

function buildPrompt(targetCategory, maxDistance, recent, location) {
  const radiusGuidance = buildRadiusGuidance(maxDistance);
  const now = new Date();
  const dateStr = now.toLocaleString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  return (
    `The current date and time is ${dateStr}. ` +
    `Generate a quest for the category: ${targetCategory}. ` +
    `It must be completely different from these recent quests: ${recent}. ` +
    `\n\nCRITICAL CONSTRAINTS: The quest must be doable right now at this time, with no advance planning, ` +
    `no reservations, and no dependency on a specific event or season. It works today. ` +
    (targetCategory === 'Urban Explorer'
      ? `\n\nURBAN EXPLORER RULE: You must name the actual venue or spot directly — give its real name and suburb. ` +
        `Do not write generic 'find a spot' or 'look for somewhere' instructions. The crew should be able to Google ` +
        `the name and drive there. If you cannot name a real, specific place, pick a different quest idea. `
      : '') +
    `\n\nSAFETY & TIMING RESEARCH: Before committing to any specific location, apply genuine local knowledge. ` +
    `Consider whether the spot has a known safety reputation that changes by time of day — for example, green spaces ` +
    `and river trails (like the Braamfontein Spruit or Delta Park in Johannesburg) that are pleasant by day can be ` +
    `unsafe after dark; CBD areas, underpasses, and isolated car parks follow the same logic. Apply this reasoning to ` +
    `whichever city or area is relevant — do not suggest a location at a time when it would be inadvisable to go there. ` +
    `Separately, verify that the suggested venue or activity would plausibly be open and operating at the current day ` +
    `and time — do not send a crew to a market that only runs on Saturday mornings, a restaurant that is closed on ` +
    `Mondays, or a nature reserve that closes at 17:00 if it is already evening. If a location has timing constraints, ` +
    `either choose a different quest or make the timing a central part of the objective. ` +
    `\n\nLOCATION & SCOPE: The crew is based in ${location}. The core action must be within ` +
    `${maxDistance} km of that point. ${radiusGuidance}` +
    `\n\nReturn ONLY a raw JSON object with these exact keys. No markdown, no backticks, no commentary. Just raw JSON:\n` +
    `{\n` +
    `  "title": "Short, punchy, narrative-driven title. Max 8 words.",\n` +
    `  "objective": "One sentence. A concrete, specific task — exactly what to find, do, or achieve (e.g., 'Track down the off-menu vetkoek at the back counter of the corner café on Jan Smuts').",\n` +
    `  "description": "2-3 sentences. Vivid, atmospheric, group-focused — describes the shared experience and scene. Weave any local timing or street-smart tips in naturally.",\n` +
    `  "best_time": "The ideal condition or window for maximum vibe (e.g., 'Late afternoon when the light hits the water', 'Sunday morning before the crowds', 'Any time — this one works day or night').",\n` +
    `  "difficulty": "One of: Simple, Moderate, Complex",\n` +
    `  "cost": "Estimated cost per person. Use 'Free' if no cost, otherwise a realistic ZAR estimate (e.g., '~R50pp', '~R30–R80pp')."\n` +
    `}`
  );
}

async function generateQuest() {
  hideError();
  if (!state.apiKey || !state.apiKey.trim()) {
    showError('No API key set. Open Settings (gear icon) and add your Groq key.');
    return;
  }

  const targetCategory = pickCategory();
  const recent = state.questHistory
    .filter(q => q.completed)
    .slice(0, 3)
    .map(q => `"${q.title}"`)
    .join(', ') || 'none yet';

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
        throw new Error('Invalid API Key — please check it in Settings.');
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

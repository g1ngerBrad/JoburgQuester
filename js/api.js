function buildRadiusGuidance(maxDistance) {
  if (maxDistance <= 5)   return 'Stay strictly within the immediate area — same suburb or the directly adjacent streets.';
  if (maxDistance <= 10)  return 'Stick to the cluster of suburbs within a short walk or very brief drive.';
  if (maxDistance <= 25)  return 'Cover the broader local area within a comfortable short drive.';
  if (maxDistance <= 50)  return 'You may include outer suburbs and nearby towns reachable in under an hour.';
  if (maxDistance <= 100) return 'You may include day-trip destinations within roughly an hour\'s drive.';
  return 'You may include broader regional getaways within a comfortable day-trip distance.';
}

function buildPrompt(targetCategory, maxDistance, recent, location) {
  const radiusGuidance = buildRadiusGuidance(maxDistance);
  return (
    `You are a knowledgeable local guide for ${location}. ` +
    `Generate a highly specific, unique, and cheap/free side-quest for the category: ${targetCategory}. ` +
    `It must be different from these recent quests: ${recent}. ` +
    `Quests should feel authentic to the local area — name specific venues, neighbourhoods, landmarks, markets, parks, or cultural spots that actually exist there. ` +
    `\n\nLOCATION: The user is based in ${location}. The quest location must be within ${maxDistance} km of that point. ${radiusGuidance}` +
    `\n\nSAFETY: Apply your knowledge of local safety realities for ${location}. Prefer well-trafficked, reputable venues, parks with good foot traffic, secure public spaces, and established cultural or dining spots. Avoid locations with a known reputation for serious safety concerns. If the quest involves anywhere with a safety nuance, weave a brief, practical note into the description naturally (e.g. "go in daylight", "visit with a friend") — not preachy. ` +
    `\n\nReturn ONLY a raw JSON object with these exact keys: 'title' (short, punchy, max 8 words), ` +
    `'description' (2-3 sentences, vivid and specific, with any safety note woven in naturally), ` +
    `'difficulty' (one of: Simple, Moderate, Complex), ` +
    `'cost' (one of: Free, Cheap). ` +
    `No markdown, no backticks, no commentary. Just raw JSON.`
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
  const prompt = buildPrompt(targetCategory, maxDistance, recent, location);

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
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 1.0
      })
    });

    if (!res.ok) {
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        throw new Error('Invalid API Key — please check it in Settings.');
      }
      if (res.status === 429) {
        throw new Error('Rate limited. Take a breath and try again.');
      }
      throw new Error(`API error (${res.status}). Try again in a moment.`);
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
      description: String(parsed.description).slice(0, 500),
      category: targetCategory,
      difficulty: ['Simple','Moderate','Complex'].includes(parsed.difficulty) ? parsed.difficulty : 'Simple',
      cost: ['Free','Cheap'].includes(parsed.cost) ? parsed.cost : 'Free',
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

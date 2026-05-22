function buildRadiusGuidance(maxDistance) {
  if (maxDistance <= 5)   return 'Stay strictly within Bryanston and its immediately adjacent neighbourhoods (Epsom Downs, Riverclub, Magaliessig, Sandown edges).';
  if (maxDistance <= 10)  return 'Stick to the northern suburbs cluster around Bryanston — Sandton, Morningside, Rivonia, Hyde Park, Fourways edges.';
  if (maxDistance <= 25)  return 'Cover the broader northern Joburg arc — Rosebank, Parkhurst, Melville, Dainfern, Lonehill, Sunninghill, Woodmead are all fair game.';
  if (maxDistance <= 50)  return 'You may include outer northern suburbs and reachable areas like Midrand, Lanseria, Muldersdrift, Roodepoort north, and the Cradle of Humankind fringe.';
  if (maxDistance <= 100) return 'You may include day-trip towns like Pretoria (safe parts — Brooklyn, Menlyn, Hatfield), Hartbeespoort, Magaliesburg, Krugersdorp Game Reserve.';
  return 'You may include broader Gauteng and North West getaways within a comfortable day-trip — Parys, Suikerbosrand, Pilanesberg fringe, the Vaal.';
}

function buildPrompt(targetCategory, maxDistance, recent) {
  const radiusGuidance = buildRadiusGuidance(maxDistance);
  return (
    `You are a local Johannesburg guide who knows the city's safety realities intimately. ` +
    `Generate a highly specific, unique, and cheap/free side-quest for the category: ${targetCategory}. ` +
    `It must be different from these recent quests: ${recent}. ` +
    `Quests should feel authentic to Johannesburg (suburbs, koppies, markets, neighbourhoods). ` +
    `\n\nLOCATION: The user is based in Bryanston (northern Johannesburg). The quest location must be within ${maxDistance} km of Bryanston. ${radiusGuidance}` +
    `\n\nSAFETY (CRITICAL): Johannesburg has real safety concerns and the quest must respect them. ` +
    `Do NOT suggest: the Johannesburg CBD/inner city after dark, Hillbrow, Berea, Yeoville, Joubert Park, Alexandra township interior, unsupervised hiking on isolated koppies, walking alone in quiet industrial or unlit areas at night, or any location with a known reputation for muggings or hijackings. ` +
    `Prefer: well-trafficked, well-lit public venues, secure shopping/lifestyle centres, gated parks and nature reserves with entry control (Walter Sisulu, Delta Park, Modderfontein, Klipriviersberg with a group), curated markets (Rosebank Sunday Market, Bryanston Organic Market, Neighbourgoods Braamfontein in daylight), and reputable cultural/dining spots. ` +
    `If the quest involves anywhere with safety nuance, weave a brief, practical safety note into the description (e.g. "go in daylight", "park inside the secure lot", "go with a friend") — but keep it natural, not preachy. ` +
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
  const prompt = buildPrompt(targetCategory, maxDistance, recent);

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

function toggleComplete(id) {
  const q = state.questHistory.find(x => x.id === id);
  if (!q) return;
  q.completed = !q.completed;
  if (q.completed && !q.weightCounted) {
    adaptWeights(q.category);
    q.weightCounted = true;
  } else if (!q.completed && q.weightCounted) {
    reverseWeights(q.category);
    q.weightCounted = false;
  }
  if (state.activeQuest && state.activeQuest.id === id) {
    state.activeQuest.completed = q.completed;
  }
  saveState();
  renderLog();
  renderQuestCard();
}

function deleteQuest(id) {
  const q = state.questHistory.find(x => x.id === id);
  if (q && q.completed && q.weightCounted) {
    reverseWeights(q.category);
  }
  state.questHistory = state.questHistory.filter(x => x.id !== id);
  if (state.activeQuest && state.activeQuest.id === id) {
    state.activeQuest = null;
  }
  saveState();
  renderLog();
  renderQuestCard();
}

function addCustomQuest({ title, description, category, difficulty, cost }) {
  const quest = {
    id: 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: title.trim(),
    description: description.trim(),
    category,
    difficulty,
    cost,
    completed: false,
    weightCounted: false,
    createdAt: Date.now(),
    custom: true
  };
  state.questHistory.unshift(quest);
  saveState();
  renderLog();
}

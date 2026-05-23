document.getElementById('addCustomBtn').onclick = () => {
  document.getElementById('customTitle').value = '';
  document.getElementById('customDesc').value = '';
  document.getElementById('customCategory').value = '';
  document.getElementById('customDifficulty').value = 'Simple';
  document.getElementById('customCost').value = 'Free';
  openModal('customModal');
};
document.getElementById('closeCustomBtn').onclick = () => closeModal('customModal');
document.getElementById('saveCustomBtn').onclick = () => {
  const title = document.getElementById('customTitle').value.trim();
  const description = document.getElementById('customDesc').value.trim();
  const category = document.getElementById('customCategory').value;
  const difficulty = document.getElementById('customDifficulty').value;
  const cost = document.getElementById('customCost').value;
  if (!title) { alert('Title is required.'); return; }
  if (!category) { alert('Please pick a category.'); return; }
  addCustomQuest({ title, description, category, difficulty, cost });
  closeModal('customModal');
};

document.getElementById('customModal').addEventListener('click', (e) => {
  if (e.target.id === 'customModal') closeModal('customModal');
});

document.getElementById('weightsInfoBtn').onclick = () => {
  renderWeightsPanel();
  openModal('weightsModal');
};
document.getElementById('closeWeightsBtn').onclick = () => closeModal('weightsModal');
document.getElementById('weightsModal').addEventListener('click', (e) => {
  if (e.target.id === 'weightsModal') closeModal('weightsModal');
});

document.getElementById('resetWeightsBtn').onclick = () => {
  resetWeights();
  renderLog();
};

renderLog();

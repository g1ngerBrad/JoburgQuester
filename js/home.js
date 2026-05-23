document.getElementById('generateBtn').onclick = generateQuest;

document.getElementById('settingsBtn').onclick = () => {
  document.getElementById('apiKeyInput').value = state.apiKey || '';
  document.getElementById('maxDistanceInput').value = String(state.maxDistance || DEFAULT_MAX_DISTANCE);
  openModal('settingsModal');
};
document.getElementById('closeSettingsBtn').onclick = () => closeModal('settingsModal');
document.getElementById('saveKeyBtn').onclick = () => {
  state.apiKey = document.getElementById('apiKeyInput').value.trim();
  const chosen = parseInt(document.getElementById('maxDistanceInput').value, 10);
  state.maxDistance = DISTANCE_OPTIONS.includes(chosen) ? chosen : DEFAULT_MAX_DISTANCE;
  saveState();
  closeModal('settingsModal');
  hideError();
};

document.getElementById('settingsModal').addEventListener('click', (e) => {
  if (e.target.id === 'settingsModal') closeModal('settingsModal');
});

renderQuestCard();

const _splash = document.getElementById('splash');
if (_splash) { _splash.classList.add('out'); setTimeout(() => _splash.remove(), 400); }

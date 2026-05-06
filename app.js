const state = loadState();

const els = {
  balance: document.getElementById('balanceDisplay'),
  level: document.getElementById('levelDisplay'),
  xp: document.getElementById('xpDisplay'),
  streak: document.getElementById('streakDisplay'),
  wallet: document.getElementById('walletPanel'),
  toast: document.getElementById('toast'),
  activity: document.getElementById('activityLog'),
  depositUser: document.getElementById('depositUser'),
  depositAmount: document.getElementById('depositAmount'),
  withdrawUser: document.getElementById('withdrawUser'),
  withdrawAmount: document.getElementById('withdrawAmount')
};

function loadState() {
  const saved = localStorage.getItem('donutVaultState');
  if (saved) return JSON.parse(saved);
  return {
    balance: 0,
    xp: 0,
    level: 1,
    streak: 0,
    lastBonus: null,
    logs: [
      'Wallet created. Deposit DonutSMP cash to start playing.'
    ]
  };
}

function saveState() {
  localStorage.setItem('donutVaultState', JSON.stringify(state));
}

function money(n) {
  return '$' + Number(n).toLocaleString();
}

function addLog(text) {
  state.logs.unshift(text);
  state.logs = state.logs.slice(0, 8);
  saveState();
  render();
}

function addXp(amount) {
  state.xp += amount;
  while (state.xp >= 100) {
    state.xp -= 100;
    state.level += 1;
    toast('Level up! You reached level ' + state.level + '.');
  }
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function render() {
  els.balance.textContent = money(state.balance);
  els.level.textContent = state.level;
  els.xp.textContent = state.xp + ' / 100';
  els.streak.textContent = state.streak + 'd';
  els.activity.innerHTML = state.logs.map(log => `<div class="log-item">${log}</div>`).join('');
}

function openWallet() {
  els.wallet.classList.add('open');
  els.wallet.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeWallet() {
  els.wallet.classList.remove('open');
}

function deposit() {
  const user = els.depositUser.value.trim();
  const amount = Math.floor(Number(els.depositAmount.value));
  if (!user) return toast('Enter your Minecraft username first.');
  if (!amount || amount <= 0) return toast('Enter a valid deposit amount.');

  state.balance += amount;
  addXp(Math.min(40, Math.ceil(amount / 1000)));
  addLog(`<b>Deposit credited:</b> ${money(amount)} from ${user}.`);
  els.depositAmount.value = '';
  toast('Deposit credited to arcade balance.');
}

function withdraw() {
  const user = els.withdrawUser.value.trim();
  const amount = Math.floor(Number(els.withdrawAmount.value));
  if (!user) return toast('Enter your Minecraft username first.');
  if (!amount || amount <= 0) return toast('Enter a valid withdrawal amount.');
  if (amount > state.balance) return toast('Not enough arcade balance.');

  state.balance -= amount;
  addXp(8);
  addLog(`<b>Payout instruction:</b> /pay ${user} ${amount.toLocaleString()} DonutSMP cash.`);
  els.withdrawAmount.value = '';
  toast('Withdrawal created. Cashier system should run the payout command.');
}

function dailyBonus() {
  const today = new Date().toDateString();
  if (state.lastBonus === today) return toast('Daily bonus already claimed today.');

  state.lastBonus = today;
  state.streak += 1;
  const bonus = 250 + state.streak * 50;
  state.balance += bonus;
  addXp(15);
  addLog(`<b>Daily bonus:</b> ${money(bonus)} claimed. Streak: ${state.streak}d.`);
  toast('Daily bonus claimed!');
}

document.getElementById('openWalletBtn').addEventListener('click', openWallet);
document.getElementById('heroWalletBtn').addEventListener('click', openWallet);
document.getElementById('closeWalletBtn').addEventListener('click', closeWallet);
document.getElementById('depositBtn').addEventListener('click', deposit);
document.getElementById('withdrawBtn').addEventListener('click', withdraw);
document.getElementById('dailyBonusBtn').addEventListener('click', dailyBonus);

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    toast(card.dataset.game + ' is ready for the next build step.');
  });
});

render();

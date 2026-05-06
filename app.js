const HOUSE_EDGE = 0.04;
const state = loadState();
const session = { plays: 0, wagered: 0 };
let minesRound = null;
let vaultRound = null;
let pulseRound = null;
let pulseAnim = null;

const els = {
  balance: document.getElementById('balanceDisplay'),
  level: document.getElementById('levelDisplay'),
  xp: document.getElementById('xpDisplay'),
  wallet: document.getElementById('walletPanel'),
  toast: document.getElementById('toast'),
  activity: document.getElementById('activityLog'),
  stats: document.getElementById('sessionStats'),
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
    lastBonus: null,
    logs: ['Wallet created. Deposit DonutSMP cash to start playing.']
  };
}

function saveState() { localStorage.setItem('donutVaultState', JSON.stringify(state)); }
function money(n) { return '$' + Math.floor(Number(n)).toLocaleString(); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function randInt(max) { return Math.floor(Math.random() * max); }
function payoutMultiplier(trueOdds) { return Math.max(1.01, (1 / trueOdds) * (1 - HOUSE_EDGE)); }
function getBet(id) { return Math.floor(Number(document.getElementById(id).value)); }

function chargeBet(amount) {
  if (!amount || amount <= 0) return 'Enter a valid bet.';
  if (amount > state.balance) return 'Not enough arcade balance.';
  state.balance -= amount;
  session.plays += 1;
  session.wagered += amount;
  addXp(Math.min(12, Math.ceil(amount / 1000)), false);
  saveState();
  render();
  return null;
}

function pay(amount, label) {
  const win = Math.floor(amount);
  state.balance += win;
  addXp(Math.min(20, Math.ceil(win / 1500)), false);
  if (label) addLog(`<b>${label}:</b> won ${money(win)}.`);
  saveState();
  render();
  return win;
}

function addLog(text) {
  state.logs.unshift(text);
  state.logs = state.logs.slice(0, 8);
  saveState();
  render();
}

function addXp(amount, shouldRender = true) {
  state.xp += amount;
  while (state.xp >= 100) {
    state.xp -= 100;
    state.level += 1;
    toast('Level up! You reached level ' + state.level + '.');
  }
  if (shouldRender) render();
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
  els.activity.innerHTML = state.logs.map(log => `<div class="log-item">${log}</div>`).join('');
  els.stats.textContent = `${session.plays} plays · ${money(session.wagered)} wagered`;
}

function setStatus(id, text, type = '') {
  const el = document.getElementById(id);
  el.className = 'mini-status ' + type;
  el.innerHTML = text;
}

function openWallet() { els.wallet.classList.add('open'); els.wallet.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function closeWallet() { els.wallet.classList.remove('open'); }

function deposit() {
  const user = els.depositUser.value.trim();
  const amount = Math.floor(Number(els.depositAmount.value));
  if (!user) return toast('Enter your Minecraft username first.');
  if (!amount || amount <= 0) return toast('Enter a valid deposit amount.');
  state.balance += amount;
  addXp(Math.min(40, Math.ceil(amount / 1000)), false);
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
  addXp(8, false);
  addLog(`<b>Payout instruction:</b> /pay ${user} ${amount.toLocaleString()} DonutSMP cash.`);
  els.withdrawAmount.value = '';
  toast('Withdrawal created. Cashier system should run the payout command.');
}

function dailyBonus() {
  const today = new Date().toDateString();
  if (state.lastBonus === today) return toast('Daily bonus already claimed today.');
  state.lastBonus = today;
  const bonus = 500;
  state.balance += bonus;
  addXp(15, false);
  addLog(`<b>Daily bonus:</b> ${money(bonus)} claimed.`);
  toast('Daily bonus claimed!');
}

function switchTab(target) {
  document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.target === target));
  document.querySelectorAll('.game-stage').forEach(stage => stage.classList.toggle('active', stage.id === target));
}

// Mines
function renderMines() {
  const board = document.getElementById('minesBoard');
  board.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const btn = document.createElement('button');
    btn.className = 'tile';
    btn.textContent = minesRound?.revealed.includes(i) ? '✓' : '?';
    if (minesRound?.ended && minesRound.mines.includes(i)) { btn.textContent = '✕'; btn.classList.add('mine'); }
    if (minesRound?.revealed.includes(i)) btn.classList.add('safe');
    btn.disabled = !minesRound || minesRound.ended || minesRound.revealed.includes(i);
    btn.addEventListener('click', () => pickMineTile(i));
    board.appendChild(btn);
  }
}

function startMines() {
  const bet = getBet('minesBet');
  const mineCount = Number(document.getElementById('minesCount').value);
  const err = chargeBet(bet);
  if (err) return toast(err);
  const mines = new Set();
  while (mines.size < mineCount) mines.add(randInt(25));
  minesRound = { bet, mineCount, mines: [...mines], revealed: [], ended: false, mult: 1 };
  setStatus('minesStatus', `Round started. ${mineCount} mines hidden. Current cashout: ${money(bet)}.`);
  renderMines();
}

function currentMinesMult() {
  if (!minesRound) return 1;
  const safeTotal = 25 - minesRound.mineCount;
  const safePicked = minesRound.revealed.length;
  if (safePicked === 0) return 1;
  let survivalOdds = 1;
  for (let i = 0; i < safePicked; i++) survivalOdds *= (safeTotal - i) / (25 - i);
  return payoutMultiplier(survivalOdds);
}

function pickMineTile(i) {
  if (!minesRound || minesRound.ended) return;
  if (minesRound.mines.includes(i)) {
    minesRound.ended = true;
    addLog(`<b>Mines:</b> lost ${money(minesRound.bet)}.`);
    setStatus('minesStatus', `Boom. You hit a mine and lost ${money(minesRound.bet)}.`, 'lose');
    renderMines();
    return;
  }
  minesRound.revealed.push(i);
  const mult = currentMinesMult();
  const cash = minesRound.bet * mult;
  setStatus('minesStatus', `Safe tile. Multiplier: ${mult.toFixed(2)}x · Cashout: ${money(cash)}.`, 'win');
  renderMines();
}

function cashoutMines() {
  if (!minesRound || minesRound.ended || minesRound.revealed.length === 0) return toast('Reveal at least one safe tile first.');
  const amount = minesRound.bet * currentMinesMult();
  minesRound.ended = true;
  pay(amount, 'Mines cashout');
  setStatus('minesStatus', `Cashed out for ${money(amount)}.`, 'win');
  renderMines();
}

// Dice
function updateDiceStatus() {
  const target = clamp(Number(document.getElementById('diceTarget').value), 5, 95);
  document.getElementById('diceTarget').value = target;
  const winChance = (100 - target) / 100;
  const mult = payoutMultiplier(winChance);
  setStatus('diceStatus', `Win chance: ${(winChance * 100).toFixed(1)}% · Payout: ${mult.toFixed(2)}x.`);
}

function rollDice() {
  const bet = getBet('diceBet');
  const err = chargeBet(bet);
  if (err) return toast(err);
  const target = clamp(Number(document.getElementById('diceTarget').value), 5, 95);
  const roll = Math.floor(Math.random() * 10000) / 100;
  const result = document.getElementById('diceResult');
  result.textContent = roll.toFixed(2);
  if (roll > target) {
    const mult = payoutMultiplier((100 - target) / 100);
    const won = pay(bet * mult, 'Dice');
    setStatus('diceStatus', `Rolled over ${target}. Won ${money(won)} at ${mult.toFixed(2)}x.`, 'win');
  } else {
    addLog(`<b>Dice:</b> rolled ${roll.toFixed(2)} and lost ${money(bet)}.`);
    setStatus('diceStatus', `Rolled ${roll.toFixed(2)}. Needed over ${target}.`, 'lose');
  }
}

// Pulse
function configurePulseZone() {
  const diff = document.getElementById('pulseDifficulty').value;
  const width = diff === 'easy' ? 24 : diff === 'normal' ? 16 : 10;
  const left = 50 - width / 2;
  document.getElementById('pulseZone').style.left = left + '%';
  document.getElementById('pulseZone').style.width = width + '%';
  return { diff, width, left, mult: payoutMultiplier(width / 100) };
}

function startPulse() {
  const bet = getBet('pulseBet');
  const err = chargeBet(bet);
  if (err) return toast(err);
  const cfg = configurePulseZone();
  pulseRound = { bet, ...cfg, pos: 0, dir: 1, running: true };
  const dot = document.getElementById('pulseDot');
  clearInterval(pulseAnim);
  pulseAnim = setInterval(() => {
    if (!pulseRound?.running) return;
    pulseRound.pos += pulseRound.dir * (pulseRound.diff === 'hard' ? 2.7 : pulseRound.diff === 'normal' ? 2.1 : 1.6);
    if (pulseRound.pos >= 95 || pulseRound.pos <= 0) pulseRound.dir *= -1;
    pulseRound.pos = clamp(pulseRound.pos, 0, 95);
    dot.style.left = pulseRound.pos + '%';
  }, 16);
  setStatus('pulseStatus', `Pulse running. Stop inside green for ${pulseRound.mult.toFixed(2)}x.`);
}

function stopPulse() {
  if (!pulseRound?.running) return toast('Start a pulse round first.');
  pulseRound.running = false;
  clearInterval(pulseAnim);
  const center = pulseRound.pos + 2.5;
  const inside = center >= pulseRound.left && center <= pulseRound.left + pulseRound.width;
  if (inside) {
    const won = pay(pulseRound.bet * pulseRound.mult, 'Pulse');
    setStatus('pulseStatus', `Perfect stop. Won ${money(won)} at ${pulseRound.mult.toFixed(2)}x.`, 'win');
  } else {
    addLog(`<b>Pulse:</b> missed the zone and lost ${money(pulseRound.bet)}.`);
    setStatus('pulseStatus', `Missed the green zone. Lost ${money(pulseRound.bet)}.`, 'lose');
  }
}

// Vault
function renderVault() {
  const board = document.getElementById('vaultDoors');
  board.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const btn = document.createElement('button');
    btn.className = 'door';
    btn.textContent = vaultRound?.opened.includes(i) ? '✓' : '▣';
    if (vaultRound?.opened.includes(i)) btn.classList.add('safe');
    if (vaultRound?.ended && vaultRound.badDoor === i) { btn.textContent = '✕'; btn.classList.add('bust'); }
    btn.disabled = !vaultRound || vaultRound.ended || vaultRound.opened.includes(i);
    btn.addEventListener('click', () => openVaultDoor(i));
    board.appendChild(btn);
  }
}

function startVault() {
  const bet = getBet('vaultBet');
  const err = chargeBet(bet);
  if (err) return toast(err);
  vaultRound = { bet, level: 1, opened: [], badDoor: randInt(4), ended: false, mult: 1 };
  setStatus('vaultStatus', 'Vault started. Open a door or cash out after a safe pick.');
  renderVault();
}

function vaultMult() {
  const safeChance = Math.pow(0.75, vaultRound.opened.length);
  return payoutMultiplier(safeChance);
}

function openVaultDoor(i) {
  if (!vaultRound || vaultRound.ended) return;
  if (i === vaultRound.badDoor) {
    vaultRound.ended = true;
    addLog(`<b>Vault:</b> busted and lost ${money(vaultRound.bet)}.`);
    setStatus('vaultStatus', `Bad door. Lost ${money(vaultRound.bet)}.`, 'lose');
    renderVault();
    return;
  }
  vaultRound.opened.push(i);
  vaultRound.mult = vaultMult();
  vaultRound.badDoor = randInt(4);
  setStatus('vaultStatus', `Safe door. Cashout: ${money(vaultRound.bet * vaultRound.mult)} (${vaultRound.mult.toFixed(2)}x).`, 'win');
  renderVault();
}

function cashoutVault() {
  if (!vaultRound || vaultRound.ended || vaultRound.opened.length === 0) return toast('Open at least one safe door first.');
  const won = pay(vaultRound.bet * vaultRound.mult, 'Vault cashout');
  vaultRound.ended = true;
  setStatus('vaultStatus', `Cashed out for ${money(won)}.`, 'win');
  renderVault();
}

// Events
document.getElementById('openWalletBtn').addEventListener('click', openWallet);
document.getElementById('heroWalletBtn').addEventListener('click', openWallet);
document.getElementById('closeWalletBtn').addEventListener('click', closeWallet);
document.getElementById('depositBtn').addEventListener('click', deposit);
document.getElementById('withdrawBtn').addEventListener('click', withdraw);
document.getElementById('dailyBonusBtn').addEventListener('click', dailyBonus);
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.target)));
document.getElementById('minesStart').addEventListener('click', startMines);
document.getElementById('minesCashout').addEventListener('click', cashoutMines);
document.getElementById('diceRoll').addEventListener('click', rollDice);
document.getElementById('diceTarget').addEventListener('input', updateDiceStatus);
document.getElementById('pulseStart').addEventListener('click', startPulse);
document.getElementById('pulseStop').addEventListener('click', stopPulse);
document.getElementById('pulseDifficulty').addEventListener('change', configurePulseZone);
document.getElementById('vaultStart').addEventListener('click', startVault);
document.getElementById('vaultCashout').addEventListener('click', cashoutVault);

render();
renderMines();
renderVault();
updateDiceStatus();
configurePulseZone();

# DonutVault Arcade

A DonutSMP-inspired virtual arcade website prototype.

## Current MVP

- Dark neon landing page
- Local wallet balance using browser localStorage
- Deposit credit flow
- Withdraw payout instruction flow
- Daily bonus, XP, level, streak
- Game hub cards for Mines, Dice, Pulse, and Vault

## Important linking note

The website cannot truly send DonutSMP money by itself. For instant withdrawals, one of these must exist:

1. A Minecraft cashier bot account that can run `/pay <username> <amount>`.
2. An official/server API or plugin that can transfer currency.
3. A manual cashier copying the payout instruction.

This version removes Discord bot approvals. Withdrawals instantly subtract arcade balance and generate the payout command the cashier system should run.

## Next build steps

1. Add a real backend/database for accounts and balances.
2. Add Minecraft username login/verification.
3. Build the first playable game: Mines or Pulse.
4. Add cashier automation only if DonutSMP rules allow it.

## Run locally

Open `index.html` in a browser.

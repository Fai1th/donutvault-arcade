# DonutVault Arcade

A DonutSMP-inspired virtual arcade prototype.

## Pages

- `index.html` — landing page
- `games.html` — arcade floor
- `wallet.html` — deposits/withdrawals
- `about.html` — design system notes

## Playable games

- Mines — fixed 5x5 square grid
- Blackjack
- Coinflip
- Baccarat
- Plinko
- Dice

## Design direction applied

Based on quick UX/design research:

- Limited color roles reduce cognitive load.
- Dark backgrounds help reward colors stand out.
- Gold implies value/reward, green implies success, cyan implies interaction, pink adds energy.
- Rounded cards/buttons feel approachable; square grids communicate precision.
- Strong visual hierarchy through size, contrast, spacing, and grouped cards makes pages easier to scan.
- Immediate status feedback makes actions feel responsive.

## Linking note

The website cannot truly send DonutSMP money by itself. For instant withdrawals, one of these must exist:

1. A Minecraft cashier account that can run `/pay <username> <amount>`.
2. An official/server API or plugin that can transfer currency.
3. A manual cashier copying the payout instruction.

## Run locally

Open `index.html` in a browser.

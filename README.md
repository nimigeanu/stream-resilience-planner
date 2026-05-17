# Stream Resilience Planner

An interactive widget that estimates how much live-stream redundancy is economically justified.

<img width="1269" height="760" alt="resilience-planner" src="https://github.com/user-attachments/assets/65506191-6b8f-407f-9188-9d68cf49b065" />

Compares five redundancy tiers (from no backup to full active-active) and shows the point where backup becomes cheaper than hoping nothing breaks.

## Usage

Open [index.html](index.html) in a browser. No build step, no backend.

## Files

- [index.html](index.html) — markup
- [styles.css](styles.css) — styling
- [script.js](script.js) — inputs, calculation model, rendering
- [description.md](description.md) — full spec

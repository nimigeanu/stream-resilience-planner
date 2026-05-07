# Interactive Widget Spec: Backup Stream Redundancy Calculator

## Purpose

Build a one-page interactive widget that helps readers estimate how much live-stream redundancy is economically justified.

The widget supports an article arguing that backup streaming is not a binary “have it / don’t have it” decision. It is a cost-risk tradeoff. The goal is to show when a practical backup path becomes cheaper than hoping nothing breaks.

Core line:

> Backup becomes cheaper than hoping when the expected cost of failure exceeds the cost of keeping a usable backup path alive.

The widget should be embeddable inside an article, not feel like a separate SaaS product.

## Concept

The user selects a few stream/event characteristics. The widget compares several redundancy tiers and estimates:

Annual redundancy cost  
+  
Expected remaining failure exposure  
=  
Total expected annual cost

The recommended tier is the one with the best balance between cost, outage tolerance, stakes, and risk.

The output should feel like a verdict, not a spreadsheet.

## Tone

Clear, opinionated, slightly sharp.

Avoid finance-bro language like “maximize ROI.”

Prefer words like:

- exposure
- failure cost
- backup cost
- tradeoff
- false economy
- efficient middle
- overbuilt
- fire exit

The widget should not claim precision. It should say the numbers are directional and assumption-based.

## Main User Inputs

### 1. Audience size

Use a logarithmic-style selector, not a freeform number.

Options:

- 100
- 1,000
- 10,000
- 100,000
- 1,000,000

Label:

**Expected concurrent viewers**

Purpose:

Audience size affects blast radius and should influence implied risk/stakes, but should not directly pretend every viewer has the same dollar value.

### 2. Stakes

Use cards.

Options:

**Low**  
Internal / community / nice-to-have

**Medium**  
Webinar / marketing / customer-facing

**High**  
Paid event / product launch / enterprise

**Critical**  
Sports / betting / auction / finance / emergency comms

Purpose:

Captures business importance without forcing users to invent exact revenue numbers.

### 3. Outage tolerance

Use cards.

Options:

- 5+ minutes is survivable
- 1–5 minutes hurts
- 30–60 seconds max
- Near-zero interruption

Purpose:

Maps the stream profile to recovery-time expectations.

### 4. Environment risk

Use cards.

Options:

**Controlled**  
Studio, stable network, repeatable setup

**Normal**  
Office/event venue, standard internet, moderate moving parts

**Hostile**  
Temporary venue, cellular/satellite, travel crew, many vendors

**Chaotic**  
Outdoor, remote, live switching, unknown network, high concurrency

Purpose:

Models how likely messy real-world failures are.

### 5. Cost appetite

Use cards.

Options:

**Lean**  
Keep recurring cost tiny

**Practical**  
Spend where it reduces common failures

**Premium**  
Protect the brand/event strongly

**No-compromise**  
Continuity is worth serious spend

Purpose:

Prevents the calculator from recommending unrealistic architecture for teams that cannot support it.

### 6. Cost of a bad minute

Use logarithmic selector or slider.

Options:

- $10 / min
- $100 / min
- $1,000 / min
- $10,000 / min
- $100,000 / min

Label:

**Estimated cost of one minute of serious disruption**

Helper text:

Include refunds, lost sales, sponsor exposure, SLA penalties, support load, reputation damage, angry executives, and post-incident cleanup.

Purpose:

This is the “money bruise.” It makes the cost of failure visible.

### 7. Live events per year

Use selector.

Options:

- 1
- 5
- 25
- 100
- 500

Purpose:

Needed to annualize expected failure exposure.

A single high-stakes event may not justify the same recurring architecture as hundreds of moderate-stakes events.

## Advanced Assumptions Panel

Collapsed by default.

Allow users to tweak the model so the widget feels credible and not magical.

Editable assumptions:

- Baseline serious incident probability per event
- Average outage duration without backup
- Annual cost per redundancy tier
- Incident coverage per redundancy tier
- Expected recovery time per redundancy tier

The default assumptions should be generated from the visible inputs.

The panel should include a disclaimer:

> This is a decision model, not an insurance model. The goal is to compare tradeoffs, not predict exact losses.

## Redundancy Tiers

Compare five tiers.

### Tier 0: No real backup

Description:

**Cheap until it is not.**

Typical meaning:

No separate backup path. Recovery depends on restart, manual debugging, or apology.

Cost:

Lowest

Coverage:

Almost none

Suggested verdicts:

- false economy
- acceptable only for low-stakes streams
- not a backup

### Tier 1: Restart-and-recover

Description:

**Basic recovery, not true failover.**

Typical meaning:

Operator can restart encoder/app or re-push the stream. May work for low-stakes events where several minutes of downtime is tolerable.

Cost:

Low

Coverage:

Basic encoder/app crash recovery

Recovery target:

Several minutes

### Tier 2: Fire-exit backup

This is the hero tier.

Description:

**A deliberately degraded but independent backup path.**

Typical meaning:

- Separate backup encoder or contribution path
- Separate ingest endpoint
- Lower-bitrate emergency ladder
- Pre-tested switch procedure
- Viewer-health monitoring
- Named human decision owner

Cost:

Moderate

Coverage:

Most common painful failures

Recovery target:

30–60 seconds

Key line:

> The backup stream is not a second cathedral. It is the fire exit.

### Tier 3: Mirrored backup

Description:

**A more complete duplicate path, but not necessarily active-active.**

Typical meaning:

Backup encoder, backup origin, possibly alternate CDN, similar quality ladder. Higher operational complexity.

Cost:

High

Coverage:

More failures than fire-exit backup, but may still share hidden dependencies if poorly designed.

Recovery target:

Seconds to under a minute

### Tier 4: Full active-active

Description:

**The bunker.**

Typical meaning:

Multiple active paths, multi-CDN, multi-origin, possibly multi-region, automated routing or player-side failover.

Cost:

Very high

Coverage:

Major failures

Best for:

- Sports
- Betting
- Auctions
- Huge paid events
- Critical enterprise or emergency streams

Verdict can be:

- justified
- overbuilt for this profile
- bunker mode

## Calculation Model

For each tier, calculate:

Annual redundancy cost  
+  
Expected remaining failure exposure  
=  
Total expected annual cost

Where:

Expected remaining failure exposure =
events per year
× incident probability per event
× remaining bad minutes per incident
× cost per bad minute

The tier affects:

- annual redundancy cost
- incident coverage
- recovery time
- remaining bad minutes

Suggested formula:

remaining bad minutes per incident =
average outage minutes without backup
× (1 - incident coverage)

Then cap or blend this with the tier recovery time.

Alternative formula:

remaining bad minutes per incident =
min(
  average outage minutes without backup × (1 - incident coverage),
  expected recovery minutes for tier
)

Use whichever creates more intuitive results.

Important:

Expose assumptions so the user can challenge the model.

## Suggested Default Values

These are starter defaults and can be tuned.

### Baseline incident probability by environment

- Controlled: 2%
- Normal: 5%
- Hostile: 10%
- Chaotic: 18%

### Stakes multiplier

- Low: 0.8
- Medium: 1.0
- High: 1.25
- Critical: 1.5

### Audience multiplier

- 100: 0.8
- 1,000: 1.0
- 10,000: 1.15
- 100,000: 1.35
- 1,000,000: 1.6

Final incident probability:

incident probability =
environment base probability
× stakes multiplier
× audience multiplier

Clamp to reasonable bounds:

- Minimum: 1%
- Maximum: 35%

### Average outage duration without backup

Can be inferred from outage tolerance and environment.

Starter values:

- Controlled: 8 minutes
- Normal: 12 minutes
- Hostile: 20 minutes
- Chaotic: 30 minutes

### Annual redundancy cost by tier

Starter defaults:

- No backup: $0
- Restart-and-recover: $1,500
- Fire-exit backup: $9,000
- Mirrored backup: $42,000
- Active-active: $120,000

These should be editable in the advanced assumptions panel.

### Incident coverage by tier

- No backup: 0%
- Restart-and-recover: 25%
- Fire-exit backup: 65%
- Mirrored backup: 80%
- Active-active: 92%

### Expected recovery time by tier

- No backup: same as average outage duration
- Restart-and-recover: 5–10 minutes
- Fire-exit backup: 1 minute
- Mirrored backup: 30 seconds
- Active-active: 10 seconds

## Recommendation Logic

Primary recommendation:

Choose the tier with the lowest total expected annual cost.

Then adjust based on hard constraints.

### Outage tolerance adjustment

If outage tolerance is:

**Near-zero interruption**

Do not recommend below Mirrored Backup unless cost appetite is Lean and stakes are Low/Medium.

If outage tolerance is:

**30–60 seconds max**

Prefer Fire-exit Backup or higher.

If outage tolerance is:

**5+ minutes is survivable**

Restart-and-recover may be acceptable for low/medium stakes.

### Cost appetite adjustment

If cost appetite is:

**Lean**

Avoid Active-active unless failure exposure is extreme.

If cost appetite is:

**No-compromise**

Allow Active-active more readily for High/Critical stakes.

### Stakes adjustment

If stakes are Critical, avoid recommending No Backup even if the math barely favors it.

Use verdict language like:

> The math says this is cheap. The risk profile says it is reckless.

## Main Output Layout

The output should show five sections.

## 1. Recommendation Card

Large, obvious result.

Example:

**Recommended tier: Fire-exit backup**

Why:

Your outage exposure is high enough that doing nothing is expensive, but not high enough to justify full active-active.

Best tradeoff:

Degraded independent backup, 30–60 sec recovery target.

Also show one sharp summary line:

> Backup becomes cheaper than hoping at: Fire-exit backup.

or:

> You are below the earthquake line. Build the fire exit.

## 2. Stacked Cost Chart

Main visual.

Chart title:

**Expected annual cost by redundancy tier**

Each tier should have a stacked bar:

Annual redundancy cost  
+  
Remaining failure exposure

The lowest total bar should be highlighted as recommended.

Conceptual example:

No backup: failure exposure dominates  
Restart: small backup cost + large remaining failure exposure  
Fire-exit: moderate backup cost + reduced failure exposure  
Mirrored: high backup cost + small remaining failure exposure  
Active-active: very high backup cost + tiny remaining failure exposure

Use labels:

- Backup cost
- Failure exposure
- Total expected cost

The visual goal:

Show the point where backup becomes cheaper than hoping.

Important:

Use a stacked bar chart, not a smooth curve, because redundancy tiers are discrete architecture choices.

## 3. Tier Comparison Cards

One card per redundancy tier.

Each card shows:

- Tier name
- Short description
- Annual backup cost
- Expected failure exposure
- Total expected annual cost
- Verdict

Example:

**No backup**

Annual backup cost: $0  
Expected failure exposure: $48,000  
Total expected annual cost: $48,000

Verdict:

False economy.

Example:

**Fire-exit backup**

Annual backup cost: $9,000  
Expected failure exposure: $12,000  
Total expected annual cost: $21,000

Verdict:

Efficient middle.

Example:

**Active-active**

Annual backup cost: $120,000  
Expected failure exposure: $3,000  
Total expected annual cost: $123,000

Verdict:

Overbuilt for this profile.

## 4. Recommended Build

Show this only for the recommended tier.

### For No real backup

Build this:

- Keep expectations low
- Have an apology/comms plan
- Record locally if possible
- Make restart access available
- Treat this as a deliberate risk acceptance, not resilience

### For Restart-and-recover

Build this:

- Documented restart procedure
- Operator access confirmed before event
- Basic stream health checks
- Clear viewer communication plan
- Fast VOD recovery if live fails

### For Fire-exit Backup

Build this:

- Backup encoder or alternate contribution path
- Separate ingest endpoint
- Lower-bitrate emergency ladder
- Separate CDN or delivery route if stakes justify it
- Pre-tested switch procedure
- Viewer-health monitoring
- Named human decision owner

### For Mirrored Backup

Build this:

- Backup encoder
- Backup ingest
- Backup origin path
- Alternate CDN or delivery route
- Tested switch mechanism
- Dependency review to avoid fake duplication

### For Active-active

Build this:

- Multiple active contribution/delivery paths
- Multi-origin or multi-region architecture
- Multi-CDN routing
- Automated or player-side failover
- Real-user playback monitoring
- Rehearsed incident command process

## 5. Assumptions Panel

Collapsed by default.

Example:

Assumptions used:

- Events per year: 25
- Serious incident chance: 8% per event
- Bad-minute cost: $1,000
- Average outage without backup: 10 min

Fire-exit backup:

- Annual cost: $9,000
- Incident coverage: 65%
- Recovery time: 60 sec

Let the user edit:

- incident probability
- average outage duration
- annual cost per tier
- coverage per tier
- recovery time per tier

When assumptions change, update the chart and recommendation instantly.

## Copy / Microcopy Ideas

Use these throughout the widget:

> The cost is immediate. The failure is hypothetical.

> A degraded experience is not failure. A black screen is failure.

> The goal of failover is continuity, not symmetry.

> This is not a finance model. It is a forcing function.

> Doing nothing is also an architecture decision.

> Backup becomes cheaper than hoping here.

> The fire exit does not need to be beautiful. It needs to open.

> This tier covers the normal earthquake.

## UX Notes

The widget should be fast and lightweight.

Preferred format:

- Single-page HTML/CSS/JS component
- No backend required
- Embeddable in article
- Responsive layout
- Works on mobile

Suggested desktop layout:

Left side:

- Inputs

Right side:

- Recommendation card
- Stacked cost chart
- Tier cards
- Recommended build
- Assumptions panel

Mobile layout:

- Inputs first
- Recommendation second
- Chart third
- Cards fourth
- Assumptions last

## Accuracy Positioning

The widget must not pretend to be exact.

It should explicitly say:

> These numbers are directional. Change the assumptions if your costs, incident rates, or architecture prices differ.

Good for:

- comparing redundancy tiers
- showing diminishing returns
- surfacing the hidden cost of doing nothing
- justifying a practical middle option
- making assumptions explicit

Not good for:

- exact ROI
- vendor pricing
- insurance modeling
- SLA/legal claims
- predicting actual outage frequency

## Success Criteria

The widget is successful if a reader can understand within 30 seconds:

1. Doing nothing has a measurable expected cost.
2. Perfect redundancy is often overkill.
3. The practical middle is usually a degraded but independent fire-exit backup.
4. The recommendation changes when stakes, risk, event frequency, or bad-minute cost changes.
5. The model is transparent enough to argue with.

## MVP Scope

Build first version with:

- visible inputs
- hardcoded default assumptions
- recommendation logic
- stacked bar chart
- tier comparison cards
- recommended build card
- collapsible assumptions panel

Avoid in MVP:

- backend
- saved scenarios
- account system
- vendor-specific pricing
- real streaming diagnostics
- complex probability modeling

## Final Product Framing

This is not a calculator that tells users the truth.

It is a decision tester.

It helps answer:

> How much backup is enough for this stream?

And more importantly:

> At what point does backup become cheaper than hoping?
# ADAPTATION.md
*(Written after reading CLARIFICATIONS.md — committed separately to preserve the Stage A timestamp on PLAN.md)*

This document maps each clarification to my original plan stance and states the concrete design change, or confirms the default holds. Where the clarifications were silent, I state my assumption and proceed.

---

## What changed

### 1. Persona priority order
**Clarification:** AP manager / accounts payable first, then owner / founder for small businesses, then CFO / finance lead for larger ones, then office manager as fallback.

**Original stance:** Size-conditional — owner first for small shops, AP / Finance for larger ones.

**Change:** AP manager now tops the hierarchy even at small businesses, when one is findable. Owner drops to second, not first. The size-conditional logic stays, but the priority ladder is now explicit:

```
AP manager → owner / founder (small) → CFO / finance lead (larger) → office manager
```

In Layer 2, the role-match additive now scores AP manager at the top; owner remains high but is no longer the default first pick. A row where only an owner is found at a small shop is still valid — the ladder just means I try AP first.

---

### 2. Confidence threshold
**Clarification:** Use 70 as the cutoff. Below 70 → `contact_email_or_phone = ""` and `needs_human_review = true`.

**Original stance:** A three-band system (under 40 drop / 40–74 review / 75+ auto-accept).

**Change:** The band collapses to a single cutoff at 70. Nothing is silently dropped — every row is returned, either with a contact (≥ 70) or with an empty contact field and `needs_human_review = true` (< 70). The "drop" band is removed; those rows now surface to human review instead of disappearing. The gate-plus-caps structure is unchanged — caps still ceiling the score before the threshold is applied.

---

### 3. Sources: mocked providers only
**Clarification:** Use only the mock providers in `challenge/mocks/`. No real APIs, no real scraping.

**Original stance:** Designed around real source families (registry, listing, enrichment, LinkedIn).

**Change:** The three mock providers map directly onto my source families:
- Mock registry → Government / official family
- Mock listing → Directories / listings family
- Mock enrichment → Contact enrichment

Each mock is treated as independently fallible, exactly as designed. The adapter interface stays the same — mocks are just swappable implementations. Independence-lineage still applies: the listing and enrichment mocks may share upstream data, so agreement between them counts as one corroboration signal, not two.

---

## What confirmed (defaults held)

| Topic | Clarification | My default |
|---|---|---|
| Precision vs. coverage | Precision — high `needs_human_review` rate on hard rows is a good result | Precision |
| One contact per company | One good contact is enough | One contact |
| Compliance | US B2B, business contact only, provenance required, opt-out support | Business-level data only |
| Success metric | Confident, correct, traceable contact beats three guesses | Precision-first design |

---

## Where clarifications were silent

**Allowed sources for personal data:** Not directly answered, but "business contact info only — never personal / home data" resolves it indirectly. Holding my default: business-level public and official sources only. LinkedIn / individual-profile scraping is out. More rows will fall to cannot-verify / human review as a result — consistent with the precision-over-recall stance.

**Auto-contact vs. human review:** Not addressed. Assuming a human reviews before any outreach is sent. If the agents auto-send on high-confidence rows, the auto-accept threshold and caps would need to be materially stricter — flagging this as an open question for production.

**Scope:** A minimal slice over a handful of CSV rows is enough. Not rebuilding a CRM. Building the pipeline cleanly so every row — found, flagged, or cannot-verify — produces a complete, attributable output record.

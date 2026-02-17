<!--
Sync Impact Report
===================
- Version change: 0.0.0 → 1.0.0 (initial ratification)
- Added principles:
  1. Real-Time First
  2. Firebase-Native
  3. Simplicity
  4. Mobile-Responsive UI
  5. Environment Safety
- Added sections:
  - Technology Constraints
  - Development Workflow
  - Governance
- Removed sections: none (initial version)
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed (Constitution Check section is generic)
  - .specify/templates/spec-template.md ✅ no changes needed (generic structure)
  - .specify/templates/tasks-template.md ✅ no changes needed (generic structure)
- Follow-up TODOs: none
-->

# Ryder Cup 2026 Constitution

## Core Principles

### I. Real-Time First

All user-facing data MUST reflect the latest state within seconds
of a scoring update. Features that display scores, standings, or
session status MUST use Firestore real-time listeners (`onSnapshot`)
rather than one-shot fetches whenever the data is expected to change
during a user's session.

**Rationale**: This is a live scoring app. Stale data undermines the
core value proposition.

### II. Firebase-Native

All backend data operations MUST use Firebase services (Firestore,
Auth, Storage) directly from the client SDK. Server-side API routes
MUST NOT be introduced unless a capability is impossible client-side
(e.g., admin-only operations requiring Firebase Admin SDK).

**Rationale**: The project deliberately avoids a custom backend.
Adding server middleware increases complexity and deployment surface
without proportional benefit for a read-heavy scoring app.

### III. Simplicity

Every new file, abstraction, or dependency MUST solve a concrete,
current problem. No speculative abstractions, no wrapper layers
around Firebase SDK calls, no state management libraries unless
React built-in state becomes demonstrably insufficient.

- Maximum one level of component nesting beyond page-level.
- Prefer inline styles or minimal CSS over CSS-in-JS libraries.
- YAGNI: if it is not needed today, it MUST NOT be built today.

**Rationale**: This is a focused, single-purpose app. Premature
abstraction is the primary complexity risk.

### IV. Mobile-Responsive UI

All pages MUST be usable on viewports as small as 375px wide
without horizontal scrolling or broken layouts. Touch targets
MUST be at least 44x44px. Score displays MUST use font sizes
legible at arm's length (minimum 18px for score values).

**Rationale**: The primary audience will view scores on phones
during live play.

### V. Environment Safety

Firebase configuration MUST be loaded exclusively from environment
variables (`NEXT_PUBLIC_FIREBASE_*`). No API keys, project IDs, or
credentials MUST appear in committed source code. A `.env.example`
file MUST document all required variables without real values.

**Rationale**: Prevents accidental credential leaks in a
public-facing project.

## Technology Constraints

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Backend**: Firebase (Firestore for data, Auth if needed)
- **Hosting**: Vercel (or compatible static/SSR host)
- **Node**: Compatible with Next.js 14 requirements
- **Package manager**: npm
- New runtime dependencies MUST be justified against the Simplicity
  principle before adoption.

## Development Workflow

- All changes MUST be tested in a local dev environment (`npm run dev`)
  before committing.
- Firestore security rules MUST be reviewed when data model changes.
- Feature branches MUST be used for non-trivial changes; direct
  commits to `main` are acceptable only for single-file fixes.
- Commits MUST have descriptive messages summarizing the "why".

## Governance

This constitution is the authoritative source of project standards.
All code reviews and implementation decisions MUST verify compliance
with the principles above.

**Amendment procedure**:
1. Propose the change with rationale.
2. Document the change in this file with updated version.
3. Verify no downstream templates or specs are invalidated.

**Versioning policy**: MAJOR.MINOR.PATCH semantic versioning.
- MAJOR: Principle removed or redefined incompatibly.
- MINOR: New principle or section added.
- PATCH: Clarifications and wording fixes.

**Compliance review**: Each `/speckit.plan` run MUST include a
Constitution Check gate verifying alignment with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-02-16 | **Last Amended**: 2026-02-16

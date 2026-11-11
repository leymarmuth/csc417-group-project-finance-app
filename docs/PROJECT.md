# CSC 417 · GROUP PROJECT — PROJECT REPORT

## Aurum: A Personal Finance & Wealth Tracking Mobile Application

**Institution:** Moi University, Eldoret, Kenya  
**Course unit:** CSC 417  
**Submission type:** Undergraduate Group Project  
**Academic year:** 2025 / 2026  
**Deliverable:** Cross-platform mobile application (React Native / Expo) plus source code, documentation and screenshots

---

## 1. Abstract

Aurum is a personal finance and wealth-tracking mobile application built as the CSC 417 group
project at Moi University, Kenya. It lets a user consolidate their accounts, record income and
expenditure, categorise spending, set a monthly budget per category, and track progress towards
savings goals. The application is written in TypeScript using React Native and Expo, and is
delivered for both iOS and Android from a single codebase.

The product is localised for Kenya rather than merely translated: the default currency is the
Kenyan Shilling, the account model covers M-Pesa, bank and Sacco balances, income includes HELB
disbursements and upkeep from home, and the seeded three-month demo history describes ordinary
campus life in Eldoret — Khetias and Naivas runs, matatu and boda fare, KPLC prepaid tokens,
airtime bundles, printing at the ICT Centre, and saving for a laptop, a hostel deposit and a
graduation gown.

Beyond functional requirements, the project set out to demonstrate that a student-built
application can meet a professional design and engineering bar: a tokenised design system rather
than ad-hoc styling, animation that communicates state rather than decoration, an offline-first
data layer with referential integrity, and typed interfaces between every layer.

The result is a complete application of approximately 12,000 lines of application code across 84
TypeScript modules, with 16 screens, five independently manageable data domains, four hand-built
data visualisations, light and dark themes, and a documented architecture.

---

## 2. Problem statement

Most personal finance applications fail in one of two directions. Either they are visually dense
ledgers designed for accountants, or they are stripped-back trackers that cannot answer basic
questions such as "how much is left in my dining budget this month?" Additionally, many mobile
finance apps require an always-online connection and a cloud account before a user can record a
single transaction.

For a Kenyan undergraduate the problem is sharper still. Money arrives in lumpy HELB
disbursements, leaves through M-Pesa almost instantly, and is spread across a bank account, a
Sacco and cash. Off-the-shelf trackers assume a salaried Western user, a single bank account and a
data connection; none of those assumptions hold on a campus in Eldoret.

The group's aim was to build an application that is:

1. **Immediately legible** — a single home screen answers "what do I have, what came in, what went
   out, and am I on track?" without navigation.
2. **Fast and offline** — every read and write happens locally; no network is required.
3. **Correct with money** — amounts are stored as integer minor units, never floating point, and
   account balances are reconciled on every create, edit and delete.
4. **Pleasant to use** — deliberate typography, purposeful motion and haptic confirmation rather
   than a generic component-library look.
5. **Locally true** — KSh as the default currency and a demo ledger a Kenyan student recognises.

---

## 3. Objectives

| #   | Objective                                              | Evidence of completion                                                                        |
| --- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| O1  | Deliver a complete, navigable multi-screen application | Onboarding → auth stack → 5 tabs → 7 pushed/modal screens (16 total)                          |
| O2  | Implement authentication with persistent sessions      | Sign in / sign up / recovery; token in secure storage; session restored and expiry-checked    |
| O3  | Implement full CRUD over a realistic domain            | Transactions, categories, accounts, budgets, goals — create, read, update, delete with guards |
| O4  | Persist data locally and survive app restarts          | AsyncStorage snapshot with debounced write-behind; seeded dataset on first launch             |
| O5  | Present data visually                                  | Area, paired bar, segmented donut and sparkline charts, all animated                          |
| O6  | Apply a consistent design system                       | Single token file; in-house component kit; light & dark themes                                |
| O7  | Use animation purposefully                             | Documented motion inventory; UI-thread worklets; haptics                                      |
| O8  | Maintain code quality                                  | Strict TypeScript, ESLint and Prettier clean, CI workflow, documented architecture            |

---

## 4. Scope

**In scope**

- Account, transaction, category, budget and goal management.
- Monthly analytics and projections.
- Authentication with locally persisted sessions.
- Theming (system / light / dark), currency selection and privacy masking.
- Offline operation with a seeded sample dataset.

**Out of scope (with rationale)**

- **Live bank synchronisation** — requires regulated third-party aggregation (e.g. Plaid) and
  institutional approval; mocked behind a service interface instead.
- **Server-side accounts and multi-device sync** — the brief is a client application; the data
  layer is isolated so a backend can be attached without touching UI code.
- **Recurring transactions and forecasting** — identified as future work (see §11).

---

## 5. Methodology

The project followed a lightweight iterative process across four phases:

1. **Discovery & domain modelling (week 1–2).** Defined the entities, their invariants and the
   questions each screen must answer. Produced the data model and a screen inventory.
2. **Design system before screens (week 2–3).** Built the token file, typography scale, component
   kit and motion presets first, so feature work could be composed rather than restyled.
3. **Feature verticals (week 3–6).** Each feature was delivered end-to-end — model, store action,
   selector, screen, empty state, error handling — rather than layer-by-layer across the app.
4. **Hardening (week 6–7).** Error taxonomy, integrity guards, accessibility labels, type and lint
   gates, documentation, screenshot capture and the submission artefacts.

Work was divided by module ownership (see §10), with a shared contract for how stores, selectors
and screens interact — documented in `docs/ARCHITECTURE.md` — so members could work in parallel
without merge conflicts in shared files.

---

## 6. System design

### 6.1 Layered architecture

```
┌──────────────────────────────────────────────────────────────┐
│  features/*   screens, feature components, screen state      │
│  components/* design-system kit, charts, finance primitives  │
├──────────────────────────────────────────────────────────────┤
│  store/*      zustand stores (state + actions)               │
│  selectors    pure derivations over state                    │
├──────────────────────────────────────────────────────────────┤
│  services/*   auth client, ledger repository, storage tiers  │
├──────────────────────────────────────────────────────────────┤
│  types · lib · theme · constants                             │
└──────────────────────────────────────────────────────────────┘
```

The dependency rule is strictly one-directional. Services never import React; screens never touch
storage. This is what allows the mock backend to be swapped for HTTP without UI changes.

### 6.2 Data model

| Entity        | Key fields                                                                     | Relationships                                |
| ------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| `Account`     | id, name, kind, institution, balance (minor units), currency, colour, archived | 1 account → many transactions                |
| `Category`    | id, name, icon, colour, kind (expense / income)                                | 1 category → many transactions, many budgets |
| `Transaction` | id, amount, kind, categoryId, accountId, merchant, note, date                  | belongs to one account and one category      |
| `Budget`      | id, categoryId, limit, month (`YYYY-MM`)                                       | unique per (category, month)                 |
| `Goal`        | id, name, target, saved, deadline, icon, colour, archived                      | independent                                  |

`User` and `Session` model identity; `LedgerSnapshot` is the persisted aggregate of the five ledger
collections plus a schema `version` field for future migrations.

### 6.3 State management

Four Zustand stores, each with a single responsibility:

- `useAuthStore` — session status (`booting`, `signedOut`, `signedIn`), user, pending and error flags.
- `useLedgerStore` — the five collections and every mutation.
- `useSettingsStore` — appearance, currency, privacy and notification preferences.
- `useToastStore` — transient UI feedback.

The `booting` status is deliberate: the animated launcher stays on screen until the persisted
session has been resolved, so a signed-in user never sees a sign-in screen on cold start.

### 6.4 The mutation pattern (integrity by construction)

Every write follows one shape: validate → build entity → `commit()` (optimistic state update +
debounced persist) → return the entity to the caller.

Consequences:

- **Optimistic UI** — no perceived latency.
- **Undo** — deletes return the removed entity; `restoreTransaction` reverses the balance delta.
- **Referential integrity lives in the data layer**, not the UI: deleting a category with
  transactions, or an account with transactions, throws a typed `in_use` error that the screen
  surfaces as a toast. An account cannot be removed if it is the last active one.
- **Balance reconciliation** — creating, editing and deleting a transaction adjusts the owning
  account. Editing applies the reverse of the old delta before the new one.

### 6.5 Money handling

All amounts are integers in minor units (cents). The default currency is the Kenyan Shilling and
display uses the `en-KE` locale. Parsing and formatting are centralised
(`src/lib/format.ts`): user input is sanitised and rounded, and display uses `Intl.NumberFormat`
with locale-aware grouping. No arithmetic is performed on floating-point currency values.

### 6.6 Security and privacy

- Session tokens are stored with `expo-secure-store` (iOS Keychain, Android Keystore), never in
  plain AsyncStorage.
- Passwords are hashed before storage in the demo credential store; the file is explicitly marked
  demo-only and is the single replacement point for a real auth provider.
- A global "hide balances" privacy mode masks every monetary value in the app in one tap.

---

## 7. Implementation

### 7.1 Screen inventory

| Group          | Screens                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding     | `OnboardingScreen` (3 slides)                                                                                                                        |
| Authentication | `SignInScreen`, `SignUpScreen`, `ForgotPasswordScreen`                                                                                               |
| Tabs           | `HomeScreen`, `TransactionsScreen`, `InsightsScreen`, `GoalsScreen`, `ProfileScreen`                                                                 |
| Push / modal   | `TransactionEditorScreen`, `GoalEditorScreen`, `AccountEditorScreen`, `AccountsScreen`, `CategoriesScreen`, `SettingsScreen`, `ChangePasswordScreen` |

### 7.2 Key workflows

**Recording a transaction.** The editor opens as a modal (mode: expense or income). The user picks a direction
(expense/income), enters an amount through a large decimal keypad field, chooses a category from a
grid, optionally adds merchant, note, account and date, then saves. Validation runs before submit;
the store applies the balance delta; the screen confirms with a haptic and a toast, then dismisses.
Editing re-uses the same screen with prefilled state and adds a guarded delete.

**Filtering activity.** Search input is debounced (180 ms); the filter sheet combines direction,
period, categories and accounts. Filtering is a pure selector over the transaction list, so the
same function powers search, chips and the empty state.

**Setting a budget.** From Insights the user creates a monthly limit per category; save is an
upsert keyed on (category, month), so re-saving edits rather than duplicating. Removing a budget is
undoable.

**Contributing to a goal.** A sheet offers quick amounts — including the exact remaining amount to
finish — and clamps the contribution so a goal can never exceed its target.

### 7.3 Visualisation

Charts are hand-built with `react-native-svg`. A cardinal-spline helper converts data points into
cubic Bézier segments so curves pass smoothly through every point; the same helper measures
polyline length, which feeds a `stroke-dasharray` / `stroke-dashoffset` animation so each series
draws itself in. Donut arcs animate their dash length with a stagger; bars animate height from the
baseline. All of this runs as Reanimated worklets, off the JavaScript thread.

### 7.4 Motion

Motion uses four spring presets and five durations defined as tokens. Animation is used only where
it carries meaning: confirming a press (scale + haptic), acknowledging a navigation change (tab
indicator, shared spring), revealing sequence (staggered list and chart entry), communicating
progress (count-up money, ring sweeps), or showing causality (sheet following the user's drag).

### 7.5 Accessibility

Every interactive element declares an accessibility role and label; tabs, switches and list
selections expose `accessibilityState`. Controls meet a 44 pt minimum touch target, and body text
contrast meets WCAG AA in both themes.

---

## 8. Testing and verification

| Check                 | Method                                                                                                                                                                         | Result                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Static typing         | `tsc --noEmit` in strict mode                                                                                                                                                  | Pass — 0 errors                                           |
| Linting               | ESLint with `eslint-config-expo`                                                                                                                                               | Pass — 0 errors, 0 warnings                               |
| Formatting            | Prettier                                                                                                                                                                       | Consistent                                                |
| iOS bundling          | `expo export --platform ios`                                                                                                                                                   | Pass — Hermes bytecode bundle produced                    |
| Web bundling          | `expo export --platform web`                                                                                                                                                   | Pass — static build produced                              |
| Functional smoke test | Headless-browser walkthrough of the web build: onboarding → sign in → create transaction → verify balance and list update → filters → insights → contribute to goal → settings | Pass — 0 console errors                                   |
| Data integrity        | Manual cases: delete category in use, delete account in use, delete last account, edit transaction account                                                                     | All correctly rejected/balanced with user-facing feedback |

Kinetic and haptic behaviours were verified on physical iOS and Android devices via Expo Go.

---

## 9. Results

The deliverable meets all nine objectives in §3. Quantitatively:

- **16 screens**, 5 feature tabs, 7 modal/pushed screens.
- **84 TypeScript modules**, approximately **12,000 lines** of application code.
- **5 CRUD domains**, 26 store actions, all with typed errors and integrity guards.
- **4 chart types**, all animated, no chart library.
- **2 complete themes** (dark and light) plus system-following mode.
- **0** type errors, **0** lint warnings, **0** runtime console errors in the smoke test.

The application is fully usable offline from first launch thanks to the seeded dataset, which also
doubles as a demonstration of the analytics surfaces.

---

## 10. Localisation for the Kenyan context

Localisation here means more than a currency switch; the product was re-thought for its users.

| Dimension               | Decision                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Currency**            | Kenyan Shilling (`KSh`) is the default in settings, seed data, budgets and goals. Formatting uses `Intl.NumberFormat('en-KE')`; seven other currencies remain selectable.         |
| **Money channels**      | Accounts cover M-Pesa (Safaricom), a commercial bank (Equity), a Sacco savings account (Moi University Sacco), a card, cash and a money-market fund.                              |
| **Income model**        | HELB disbursements, upkeep from home and freelance gigs replace a monthly salary.                                                                                                 |
| **Category vocabulary** | Food & Groceries, Chapo & Dining, Matatu & Boda, Rent & Hostel, KPLC & Water, Airtime & Data, Books & Printing, Chai & Snacks, Upcountry Travel, Health, Shopping, Entertainment. |
| **Amounts**             | Budgets and balances are scaled to student life — a KSh 6,000 food budget, KSh 2,000 matatu budget, KSh 6,500 hostel rent — rather than imported Western figures.                 |
| **Demo narrative**      | Three months of Eldoret activity: Khetias, Naivas and Quickmart, Kesses matatu and boda, KPLC tokens, ICT Centre printing, Easy Coach to Nairobi, Java House and Chicken Inn.     |
| **Goals**               | A laptop for final year, next semester's hostel deposit, and graduation gown and photos.                                                                                          |
| **Identity in-app**     | The course badge on onboarding and the launcher reads `MOI UNIVERSITY · CSC 417`; the About sheet states the institution, location and default currency.                          |

Because every one of these values lives in either `src/data/seed.ts`, `src/lib/format.ts`,
`src/store/useSettingsStore.ts` or `src/constants/project.ts`, the app can be re-localised for
another country without touching a screen.

## 11. Limitations and future work

1. **Mocked backend.** Authentication and persistence are local. The two service files are the only
   integration points for a real API.
2. **No automated unit tests.** Selectors and formatting functions were written as pure functions
   specifically so a Jest suite can be added without refactoring.
3. **Biometric unlock** is scaffolded in Settings and requires `expo-local-authentication` in a
   native build.
4. **Future features:** recurring transactions, 30-day cash-flow forecasting, CSV import/export,
   multi-currency conversion with historical rates, home-screen widgets and shared budgets.

---

## 12. Conclusion

Aurum demonstrates that a student group can deliver a mobile application with the structure,
consistency and polish of a commercial product. The most valuable lessons were architectural
rather than cosmetic: enforcing a one-directional dependency graph, treating money as integers,
putting integrity rules in the data layer, and defining motion and colour as tokens made the
feature list tractable instead of overwhelming. The project also showed that a design system built
before the screens is what allows four people to work in parallel and still produce something that
looks like one hand made it.

---

## 13. References

1. Expo Documentation — https://docs.expo.dev
2. React Native Documentation — https://reactnative.dev
3. React Navigation — https://reactnavigation.org
4. React Native Reanimated — https://docs.swmansion.com/react-native-reanimated
5. Zustand — https://zustand.docs.pmnd.rs
6. W3C — _Web Content Accessibility Guidelines (WCAG) 2.2_
7. Apple — _Human Interface Guidelines: Motion_
8. Google — _Material Design 3: Motion & Easing_

---

## Appendix A — Repository map

```
src/
├── constants/project.ts     CSC 417 course metadata, group members
├── theme/                   design tokens, ThemeProvider
├── types/models.ts          domain models
├── lib/                     format, date, validation, useForm, haptics, utils
├── services/                storage, auth.service, ledger.repository
├── data/seed.ts             three-month sample ledger
├── store/                   four zustand stores + selectors.ts
├── components/ui            18 design-system components
├── components/charts        area, bar, donut, sparkline + path maths
├── components/finance       MoneyDisplay, CategoryIcon, MonthSwitcher
├── components/system        Launcher
├── features/                onboarding, auth, home, transactions, insights,
│                            goals, accounts, profile
└── navigation/              RootNavigator, AuthNavigator, TabNavigator, TabBar
```

## Appendix B — Demo credentials

```
email:    brian@aurum.app
password: Aurum2026!
```

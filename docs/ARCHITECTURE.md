# Architecture

Aurum is a small app with opinions about where code belongs. This document explains the
layers, the data flow, and the conventions to follow when adding a feature.

---

## 1. Layers

```
┌──────────────────────────────────────────────────────────────┐
│  features/*          screens + feature-local components      │
│  components/*        design-system kit, charts, primitives   │
├──────────────────────────────────────────────────────────────┤
│  store/*             zustand stores (state + actions)        │
│  store/selectors.ts  pure derivations over state             │
├──────────────────────────────────────────────────────────────┤
│  services/*          auth client, ledger repository, storage │
├──────────────────────────────────────────────────────────────┤
│  types · lib         domain models, formatting, validation   │
│  theme               tokens + ThemeProvider                  │
└──────────────────────────────────────────────────────────────┘
```

Dependencies only ever point downward. A screen may read a store; a store may call a
service; a service may read storage. Nothing in `services/` imports React.

## 2. State

Three zustand stores, each with one job:

| Store              | Owns                                                                               | Persistence                           |
| ------------------ | ---------------------------------------------------------------------------------- | ------------------------------------- |
| `useAuthStore`     | session status (`booting` / `signedOut` / `signedIn`), user, pending + error flags | token in `expo-secure-store`          |
| `useLedgerStore`   | accounts, categories, transactions, budgets, goals + every mutation                | write-behind snapshot in AsyncStorage |
| `useSettingsStore` | theme mode, currency, privacy, haptics, digest                                     | AsyncStorage                          |
| `useToastStore`    | transient toast queue                                                              | none                                  |

`status: 'booting'` on the auth store is what keeps the launcher up until the session has
been resolved — the app never flashes a sign-in screen at a signed-in user.

## 3. The CRUD pattern

Every mutation follows the same shape, so behaviour is predictable across entities.

```ts
createTransaction: async (draft) => {
  if (!draft.amount || draft.amount <= 0)
    throw new LedgerError('invalid', 'Enter an amount greater than zero.');

  const transaction = { ...draft, id: uid('txn'), createdAt: now, updatedAt: now };

  commit((state) => ({
    transactions: [transaction, ...state.transactions],
    accounts: adjustAccount(state.accounts, transaction.accountId, balanceDelta(transaction)),
  }));

  return transaction; // callers can toast / navigate with the result
};
```

`commit` = set state immediately + schedule a debounced persist. Consequences:

- **Latency is zero** for the user; the write lands 320 ms later.
- **Undo is possible** because deletes return the removed entity, and `restoreTransaction`
  re-applies the reverse balance delta.
- **Referential integrity is enforced in the store**, not the UI: deleting a category that
  still has transactions throws `LedgerError('in_use')`, which the screen surfaces as a
  toast. The same rule protects accounts and the "at least one active account" invariant.
- **Balances are derived, not trusted.** Creating, editing and deleting a transaction all
  adjust the owning account: edit applies `-oldDelta` then `+newDelta`.

### Error taxonomy

`LedgerError.code` is `'invalid' | 'duplicate' | 'in_use' | 'not_found' | 'persist'`.
Screens switch on `message` for display and on `code` only when behaviour differs. Auth uses
`AuthError.code` (`invalid_credentials`, `email_taken`, `not_found`, `network`, `unknown`)
mapped from what an HTTP backend would return.

## 4. Selectors

Anything derived lives in `src/store/selectors.ts` as a pure function taking plain data:

```ts
monthTotals(transactions, month); // income / expense / net
spendByCategory(transactions, cats, m); // sorted, with counts
dailySpendSeries(transactions, month); // cumulative, for the area chart
monthlySeries(transactions, 6); // for the bar chart
budgetProgress({ budgets, categories, transactions }, month);
filterTransactions(transactions, categories, filters);
percentChange(current, previous);
```

Screens call these inside `useMemo` with the primitive slices they subscribe to. This keeps
renders narrow and makes the logic unit-testable without a renderer.

## 5. Services

`services/storage.ts` exposes two tiers: `secure` (Keychain / Keystore, tokens only) and
`kv` (AsyncStorage, everything else). Both are defensive — a corrupt payload returns the
fallback instead of throwing.

`services/auth.service.ts` is a mock backend with latency and typed failures. It keeps a
locally hashed credential list _for the demo only_ and is deliberately the only file that
would be replaced by real HTTP.

`services/ledger.repository.ts` reads once at boot and writes debounced snapshots with a
`version` field, which is where a migration hook would go.

## 6. Design system

`theme/tokens.ts` → `theme/index.tsx` (a context provider resolving `system | light | dark`).

Components consume `useTheme()` and never import hex values. The kit in `components/ui` is
intentionally small and composable: `Screen`, `Card`, `Text`, `Button`, `Input`, `Sheet`,
`Chip`, `Switch`, `SegmentedControl`, `ProgressRing`, `Skeleton`, `EmptyState`, `Badge`,
`ListRow`, `IconButton`, `Avatar`, `Fab`, `Toaster`, `AmbientGlow`, `PressableScale`.

Rules of thumb:

- `PressableScale` is the only tap primitive. If something is tappable, it uses it (or is a
  raw `Pressable` when it needs a custom gesture).
- Motion values come from `motion.spring.*` / `motion.duration.*`. Never a bare `300`.
- Text goes through `<Text variant="…" tone="…">` so typography stays consistent.

## 7. Animation strategy

Two principles:

1. **Run on the UI thread.** Gestures, scroll parallax, tab indicators, chart draws and sheet
   transitions are all Reanimated shared values in worklets.
2. **Push data back with `runOnJS` at the frame boundary.** `AnimatedNumber` and
   `MoneyDisplay` interpolate a number in the worklet and call `setState` with the formatted
   string, so parents don't re-render per frame while the number counts up.

Charts are hand-built SVG. `components/charts/path.ts` converts points into a cardinal-spline
bezier and measures polyline length, which feeds the `strokeDasharray`/`strokeDashoffset`
draw-on animation.

## 8. Forms

`lib/useForm.ts` is a ~70-line engine: controlled values, derived errors, touched-tracking
(errors never shout before a field is blurred or the form is submitted), `submit(onValid)`,
`reset()` and `isDirty`. `lib/validation.ts` holds the primitives and the weighted password
strength model.

## 9. Adding a feature — checklist

1. Add the model to `types/models.ts`.
2. Add CRUD actions to `useLedgerStore` using the `commit` pattern, with guards.
3. Add derivations to `selectors.ts`.
4. Build the screen under `features/<name>/`, composing only `components/ui` primitives.
5. Register it in `navigation/types.ts` + the relevant navigator.
6. Stagger its entry with `FadeInDown.delay(...)`, haptic on the primary action, toast on
   success and undo on destructive actions.
7. `npm run typecheck` — strict mode is the test suite.

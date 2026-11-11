# Notes for contributors (human or agent)

- `npm run typecheck` must pass — TypeScript is strict, and there is no test suite yet.
- Data flows down: screens → stores → services. Never fetch or persist from a component.
- All derivations belong in `src/store/selectors.ts` as pure functions.
- All mutations belong in `src/store/useLedgerStore.ts` and must use the `commit` pattern
  (optimistic state + debounced persist) and return the affected entity.
- No hard-coded colours, radii, durations or font sizes. Use `src/theme/tokens.ts`.
- Every new screen: `FadeInDown` entry stagger, haptic on the primary action, toast on
  success, undo on destructive actions.
- See `docs/ARCHITECTURE.md` before adding a domain entity.

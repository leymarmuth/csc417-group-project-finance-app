import type { LedgerSnapshot } from '../types/models';
import { createSeedSnapshot } from '../data/seed';
import { sleep } from '../lib/utils';
import { kv, STORAGE_KEYS } from './storage';

/**
 * Local, offline-first persistence for the ledger.
 *
 * The store owns in-memory state and treats this repository as a durable sink
 * (write-behind). Reads happen once at boot; writes are debounced so rapid
 * interactions never thrash storage.
 */
const CURRENT_VERSION = 1;

export const ledgerRepository = {
  async load(): Promise<LedgerSnapshot> {
    await sleep(240);
    const stored = await kv.getJSON<LedgerSnapshot | null>(STORAGE_KEYS.ledger, null);
    if (!stored || stored.version !== CURRENT_VERSION) {
      const seeded = createSeedSnapshot();
      await kv.setJSON(STORAGE_KEYS.ledger, seeded);
      return seeded;
    }
    return stored;
  },

  async save(snapshot: LedgerSnapshot): Promise<void> {
    await kv.setJSON(STORAGE_KEYS.ledger, { ...snapshot, version: CURRENT_VERSION });
  },

  async clear(): Promise<void> {
    await kv.remove(STORAGE_KEYS.ledger);
  },
};

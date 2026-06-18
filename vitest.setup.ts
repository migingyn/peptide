import '@testing-library/jest-dom/vitest';
// Provide IndexedDB in jsdom so the store's boot effect (loadAll) doesn't reject.
import 'fake-indexeddb/auto';

import Dexie, { type EntityTable } from "dexie";

export interface KeyPair {
  id: string; // "primary" (legacy) or "primary:<userId>" (user-scoped)
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  createdAt: number;
}

const db = new Dexie("ChatIODatabase") as Dexie & {
  keys: EntityTable<KeyPair, "id">;
};

db.version(1).stores({
  keys: "id",
});

export { db };

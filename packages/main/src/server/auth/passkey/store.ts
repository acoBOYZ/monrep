import { eq, queryOnce } from "@tanstack/react-db";
import { loadAuthDb } from "../db";
import type { TPasskeyDo } from "@/db/types";

export const listPasskeysForUser = async (userId?: string): Promise<Array<TPasskeyDo>> => {
  if (!userId) return [];
  const db = await loadAuthDb();
  try {
    const rows = await queryOnce({
      query: (q) => q.from({ p: db.collections.passkey }).where(({ p }) => eq(p.userId, userId)),
    });
    return rows;
  } finally {
    db.close();
  }
};

export const findPasskeyByCredentialId = async (
  credentialId: string,
): Promise<TPasskeyDo | undefined> => {
  const db = await loadAuthDb();
  try {
    return await queryOnce({
      query: (q) =>
        q
          .from({ p: db.collections.passkey })
          .where(({ p }) => eq(p.credentialId, credentialId))
          .findOne(),
    });
  } finally {
    db.close();
  }
};

export const upsertPasskeyRow = async (row: {
  id?: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: Array<string>;
}): Promise<void> => {
  const db = await loadAuthDb();
  try {
    await db.actions.upsertPasskey({
      id: row.id ?? "",
      userId: row.userId,
      credentialId: row.credentialId,
      publicKey: row.publicKey,
      counter: row.counter,
      transports: row.transports,
    }).isPersisted.promise;
  } finally {
    db.close();
  }
};

export const adminHasPasskeys = async (userId?: string): Promise<boolean> => {
  if (!userId) return false;
  const rows = await listPasskeysForUser(userId);
  return rows.length > 0;
};

import { eq, queryOnce } from "@tanstack/react-db";
import { loadAuthDb } from "../db";
import { authErrorMessage } from "../schemas";
import type { TTotpDo } from "@/db/types";

export const findTotpByUserId = async (userId?: string): Promise<TTotpDo | undefined> => {
  if (!userId) return undefined;
  const db = await loadAuthDb();
  try {
    return await queryOnce({
      query: (q) =>
        q
          .from({ t: db.collections.totp })
          .where(({ t }) => eq(t.userId, userId))
          .findOne(),
    });
  } finally {
    db.close();
  }
};

export const upsertTotpSecret = async (options: {
  userId: string;
  secretEnc: string;
  enabledAt?: string;
}): Promise<void> => {
  if (!options.userId) {
    throw new Error(authErrorMessage({ _tag: "TotpUpsertRequiresUserId" }));
  }

  const db = await loadAuthDb();
  try {
    await db.actions.upsertTotp({
      userId: options.userId,
      secretEnc: options.secretEnc,
      enabledAt: options.enabledAt,
    }).isPersisted.promise;
  } finally {
    db.close();
  }
};

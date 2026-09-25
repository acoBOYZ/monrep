import { nextUlid } from "@monrep/utils/ulid";
import { openServerStream } from "./db";
import { LoginAttemptSchema } from "./schemas";
import type { LoginAttemptInput } from "./schemas";

export const recordLoginAttempt = async (input: LoginAttemptInput): Promise<void> => {
  const data = LoginAttemptSchema.parse(input);
  const id = nextUlid(null);
  const createdAt = new Date().toISOString();
  const stream = await openServerStream("audit");
  const txid = crypto.randomUUID();
  await stream.append(
    JSON.stringify({
      type: "security",
      key: id,
      value: {
        id,
        email: data.email,
        ip: data.ip,
        success: data.success,
        userAgent: data.userAgent,
        createdAt,
      },
      headers: { operation: "upsert", txid },
    }),
  );
};

import { fromBase64Url } from "@monrep/utils";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { createServerFn } from "@tanstack/react-start";
import { issueAdminSession } from "../cookies";
import { ensureAdminUser } from "../db";
import { getAuthEnv } from "../env";
import {
  clearChallengeCookie,
  readChallengeCookie,
  setChallengeCookie,
} from "../pending/challenge";
import { setPendingCookie } from "../pending/cookie";
import { err, ok } from "../result";
import { findTotpByUserId } from "../totp/store";
import { platformTransports, withClientDeviceHint } from "./platform";
import { getWebAuthnRp } from "./rp";
import { PasskeyLoginOptionsInputSchema, PasskeyLoginVerifyInputSchema } from "./schemas";
import { findPasskeyByCredentialId, listPasskeysForUser, upsertPasskeyRow } from "./store";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

export const passkeyLoginOptionsFn = createServerFn({ method: "POST" })
  .validator(PasskeyLoginOptionsInputSchema)
  .handler(async ({ data }) => {
    const { ADMIN_EMAIL } = getAuthEnv();
    const email = (data.email ?? ADMIN_EMAIL).trim().toLowerCase();
    if (email !== ADMIN_EMAIL.trim().toLowerCase()) {
      return err({ _tag: "InvalidCredentials" });
    }

    const user = await ensureAdminUser(email);
    const passkeys = await listPasskeysForUser(user.id);
    if (passkeys.length === 0) {
      return err({ _tag: "NoPasskey" });
    }

    const { rpID } = getWebAuthnRp();
    const options = withClientDeviceHint(
      await generateAuthenticationOptions({
        rpID,
        allowCredentials: passkeys.map((p) => ({
          id: p.credentialId,
          transports: [...platformTransports],
        })),
        userVerification: "required",
      }),
    );

    const attemptId = crypto.randomUUID();
    await setChallengeCookie({
      attemptId,
      challenge: options.challenge,
      flow: "login",
      userId: user.id,
      email,
    });

    // Wire as JSON string — WebAuthn option types are not createServerFn-serializable.
    return ok({ optionsJson: JSON.stringify(options), attemptId });
  });

export const passkeyLoginVerifyFn = createServerFn({ method: "POST" })
  .validator(PasskeyLoginVerifyInputSchema)
  .handler(async ({ data }) => {
    const challenge = await readChallengeCookie();
    if (!challenge || challenge.flow !== "login" || !challenge.userId) {
      return err({ _tag: "PendingExpired" });
    }

    const email = data.email.trim().toLowerCase();
    if (challenge.email !== email) {
      return err({ _tag: "InvalidCredentials" });
    }

    const response = data.response as AuthenticationResponseJSON;
    const passkey = await findPasskeyByCredentialId(response.id);
    if (!passkey || passkey.userId !== challenge.userId) {
      return err({ _tag: "PasskeyFailed" });
    }

    const { rpID, origin } = getWebAuthnRp();
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: passkey.credentialId,
          publicKey: Uint8Array.from(fromBase64Url(passkey.publicKey)),
          counter: passkey.counter,
          transports: [...platformTransports],
        },
      });
    } catch {
      return err({ _tag: "PasskeyFailed" });
    }

    if (!verification.verified) {
      return err({ _tag: "PasskeyFailed" });
    }

    await upsertPasskeyRow({
      id: passkey.id,
      userId: passkey.userId,
      credentialId: passkey.credentialId,
      publicKey: passkey.publicKey,
      counter: verification.authenticationInfo.newCounter,
      transports: [...platformTransports],
    });

    clearChallengeCookie();
    const totp = await findTotpByUserId(passkey.userId);
    if (totp?.enabledAt) {
      const session = await issueAdminSession(email);
      return ok({ session });
    }
    await setPendingCookie({
      email,
      userId: passkey.userId,
      step: "enroll_totp",
      method: "passkey",
    });
    return ok({ step: "enroll_totp" as const });
  });

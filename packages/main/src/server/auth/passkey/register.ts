import { toBase64Url } from "@monrep/utils";
import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server";
import { createServerFn } from "@tanstack/react-start";
import { readSession, toPublicSession } from "../cookies";
import { ensureAdminUser } from "../db";
import {
  clearChallengeCookie,
  readChallengeCookie,
  setChallengeCookie,
} from "../pending/challenge";
import { err, ok } from "../result";
import { authErrorMessage } from "../schemas";
import { platformTransports, withClientDeviceHint } from "./platform";
import { getWebAuthnRp } from "./rp";
import { PasskeyRegisterVerifyInputSchema } from "./schemas";
import { listPasskeysForUser, upsertPasskeyRow } from "./store";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

export const passkeyRegisterOptionsFn = createServerFn({ method: "POST" }).handler(async () => {
  const session = await readSession();
  if (!session) {
    throw new Error(authErrorMessage({ _tag: "Unauthorized" }));
  }

  const user = await ensureAdminUser(session.email);
  const existing = await listPasskeysForUser(user.id);
  const { rpID, rpName } = getWebAuthnRp();

  const options = withClientDeviceHint(
    await generateRegistrationOptions({
      rpName,
      rpID,
      userName: session.email,
      userDisplayName: session.email,
      userID: new TextEncoder().encode(user.id),
      attestationType: "none",
      excludeCredentials: existing.map((p) => ({
        id: p.credentialId,
        transports: [...platformTransports],
      })),
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "required",
      },
    }),
  );

  const attemptId = crypto.randomUUID();
  await setChallengeCookie({
    attemptId,
    challenge: options.challenge,
    flow: "register",
    userId: user.id,
    email: session.email,
  });

  // Wire as JSON string — WebAuthn option types are not createServerFn-serializable.
  return ok({ optionsJson: JSON.stringify(options), attemptId });
});

export const passkeyRegisterVerifyFn = createServerFn({ method: "POST" })
  .validator(PasskeyRegisterVerifyInputSchema)
  .handler(async ({ data }) => {
    const session = await readSession();
    if (!session) {
      throw new Error(authErrorMessage({ _tag: "Unauthorized" }));
    }

    const challenge = await readChallengeCookie();
    if (
      !challenge ||
      challenge.flow !== "register" ||
      challenge.email !== session.email ||
      !challenge.userId
    ) {
      return err({ _tag: "PendingExpired" });
    }

    const response = data.response as RegistrationResponseJSON;
    const { rpID, origin } = getWebAuthnRp();

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch {
      return err({ _tag: "PasskeyFailed" });
    }

    if (!verification.verified) {
      return err({ _tag: "PasskeyFailed" });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    void credentialDeviceType;
    void credentialBackedUp;

    await upsertPasskeyRow({
      userId: challenge.userId,
      credentialId: credential.id,
      publicKey: toBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: [...platformTransports],
    });

    clearChallengeCookie();
    return ok({ session: toPublicSession(session) });
  });

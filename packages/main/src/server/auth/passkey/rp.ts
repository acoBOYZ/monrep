import { getRequest } from "@tanstack/react-start/server";
import { getAuthEnv } from "../env";

export const getWebAuthnRp = () => {
  const { WEBAUTHN_RP_ID, WEBAUTHN_ORIGIN } = getAuthEnv();
  const requestUrl = new URL(getRequest().url);
  const rpID = WEBAUTHN_RP_ID || requestUrl.hostname;
  const origin = WEBAUTHN_ORIGIN || `${requestUrl.protocol}//${requestUrl.host}`;
  return { rpID, origin, rpName: "monrep" };
};

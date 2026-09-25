import { Secret, TOTP } from "otpauth";

export const generateTotpSecret = (): string => new Secret({ size: 20 }).base32;

export const buildOtpauthUri = (options: {
  email: string;
  secret: string;
  issuer?: string;
}): string => {
  const totp = new TOTP({
    issuer: options.issuer ?? "monrep",
    label: options.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(options.secret),
  });
  return totp.toString();
};

export const verifyTotpCode = (secret: string, token: string): boolean => {
  const totp = new TOTP({
    issuer: "monrep",
    label: "monrep",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token: token.replace(/\s/g, ""), window: 1 });
  return delta !== null;
};

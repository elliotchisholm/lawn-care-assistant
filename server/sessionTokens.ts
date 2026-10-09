import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

function tokenKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  return Buffer.from(hkdfSync("sha256", secret, "lawn-care-session-v1", "refresh-token-encryption", 32));
}

export function encryptRefreshToken(token: string, subject: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  cipher.setAAD(Buffer.from(subject));
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptRefreshToken(value: string, subject: string): string {
  const [version, iv, tag, ciphertext, extra] = value.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext || extra) throw new Error("Invalid encrypted token");
  const decipher = createDecipheriv("aes-256-gcm", tokenKey(), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(subject));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

export function storedSessionUser(user: any) {
  return {
    claims: user.claims,
    expires_at: user.expires_at,
    encrypted_refresh_token: user.encrypted_refresh_token
      ?? (user.refresh_token ? encryptRefreshToken(user.refresh_token, user.claims.sub) : undefined),
  };
}

import { SignJWT, jwtVerify, errors } from "jose";
import type { TokenPayload } from "./types.js";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN ?? "7d";
}

/**
 * Sign a JWT containing the user's id, email, and role.
 * Returns the compact JWS string.
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(getExpiresIn())
    .sign(getSecret());
}

/**
 * Verify a JWT and return the decoded payload, or `null` if the token
 * is invalid, expired, or malformed. Never throws on bad tokens.
 */
export async function verifyToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    const sub = payload.sub;
    const email = payload.email as string | undefined;
    const role = payload.role as string | undefined;

    if (!sub || !email || !role) return null;

    return { sub, email, role };
  } catch (err) {
    // Expected errors: expired, invalid signature, malformed
    if (
      err instanceof errors.JWTExpired ||
      err instanceof errors.JWSSignatureVerificationFailed ||
      err instanceof errors.JWTClaimValidationFailed
    ) {
      return null;
    }
    // Unexpected error — log and return null (don't crash the server)
    console.error("Unexpected JWT verification error:", err);
    return null;
  }
}

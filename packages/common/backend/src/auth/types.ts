/**
 * Shape of the JWT payload we sign and verify.
 *
 *   sub   — user ID (standard JWT "subject" claim)
 *   email — user email
 *   role  — user role (Student | Instructor | Admin)
 *
 * Standard claims (iat, exp) are added automatically by jose.
 */
export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

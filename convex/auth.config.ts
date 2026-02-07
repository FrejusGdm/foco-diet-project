/**
 * Convex Authentication Configuration
 *
 * Integrates Clerk as the authentication provider.
 * The JWT template in Clerk must be named exactly "convex".
 *
 * Setup:
 * 1. Create a Clerk account at https://dashboard.clerk.com
 * 2. Create a JWT Template named "convex" (case-sensitive)
 * 3. Set the CLERK_JWT_ISSUER_DOMAIN env var to your Clerk Frontend API URL
 *    Format: https://verb-noun-00.clerk.accounts.dev
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

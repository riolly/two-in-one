import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";

import { db } from "@acme/db/client";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  googleClientId: string;
  googleClientSecret: string;
  extraPlugins?: TExtraPlugins;
}) {
  // Only use OAuth proxy when baseUrl differs from productionUrl
  // The proxy is needed for preview deployments and local development
  const shouldUseProxy = options.baseUrl !== options.productionUrl;

  // Log configuration for debugging
  if (shouldUseProxy) {
    console.log("[Better Auth OAuth Proxy]", {
      baseUrl: options.baseUrl,
      productionUrl: options.productionUrl,
      redirectURI: `${options.productionUrl}/api/auth/callback/google`,
    });
  }

  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    plugins: [
      ...(shouldUseProxy
        ? [
            oAuthProxy({
              productionURL: options.productionUrl,
              currentURL: options.baseUrl,
            }),
          ]
        : []),
      expo(),
      ...(options.extraPlugins ?? []),
    ],
    socialProviders: {
      google: {
        clientId: options.googleClientId,
        clientSecret: options.googleClientSecret,
        redirectURI: shouldUseProxy
          ? `${options.productionUrl}/api/auth/callback/google`
          : `${options.baseUrl}/api/auth/callback/google`,
      },
    },
    trustedOrigins: ["expo://"],
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", {
          error,
          ctx,
          baseURL: options.baseUrl,
          productionURL: options.productionUrl,
          shouldUseProxy,
        });
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];

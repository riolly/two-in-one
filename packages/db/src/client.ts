const isDevelopment = process.env.NODE_ENV !== "production";

export const { db } = isDevelopment
  ? await import("./client-dev")
  : await import("./client-prod");

import { TRPCClientError } from "@trpc/client";

/**
 * Feature components already render or toast known tRPC failures. Logging those
 * failures as console errors makes development diagnostics look like app crashes.
 */
export function shouldLogUnhandledApiError(error: unknown) {
  return !(error instanceof TRPCClientError);
}

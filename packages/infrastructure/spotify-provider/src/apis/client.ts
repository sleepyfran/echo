import { HttpClient } from "@effect/platform";
import { Effect } from "effect";

/**
 * Creates a new HTTP client instance catered to be used with the Spotify API.
 * Effectively disables tracing for this request, since otherwise a `b3` and
 * `traceparent` header will be added to the request and the request will fail with CORS.
 */
export const createClient = Effect.gen(function* () {
  return (yield* HttpClient.HttpClient).pipe(
    HttpClient.withTracerPropagation(false),
  );
});

/**
 * customFetch (./client.ts) throws on any non-2xx response, so a query that
 * resolves successfully always carries the success-shaped body — Orval's
 * generated response type still unions in the error variant because it's
 * modelled per OpenAPI status code, independent of the mutator's actual
 * throw-on-error behaviour. This narrows that union for callers.
 */
export function unwrapData<TSuccess>(
    response: { data: TSuccess } | { data: unknown } | undefined
): TSuccess | undefined {
    return response?.data as TSuccess | undefined;
}

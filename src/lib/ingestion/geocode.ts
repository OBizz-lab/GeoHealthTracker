import { createClient } from "@supabase/supabase-js";

// =============================================================================
// Geocoding via Mapbox Geocoding API v5
// Results are cached in the `geocode_cache` table (never expire; admin purges).
// =============================================================================

// Read lazily at call time so dotenv has a chance to populate process.env
// before this module's top-level code runs (an issue with tsx + dotenv).
function getMapboxToken(): string {
  return (
    process.env.MAPBOX_SECRET_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
    ""
  );
}

const GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

export interface GeoResult {
  lat: number;
  lng: number;
  placeName: string;
  countryCode: string | null;
}

/**
 * Geocode a location string, with Supabase-backed cache.
 *
 * @param query   Human-readable location (e.g. "Rio Arriba County, NM, USA")
 * @param country ISO 3166-1 alpha-2 to bias results (e.g. "US")
 */
export async function geocode(
  supabase: ReturnType<typeof createClient>,
  query: string,
  country?: string,
): Promise<GeoResult | null> {
  if (!query.trim()) return null;

  const cacheKey = country ? `${query}::${country}` : query;

  // --- Check cache first ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cached } = await (supabase as any)
    .from("geocode_cache")
    .select("lat, lng, place_name, country_code")
    .eq("query_text", cacheKey)
    .maybeSingle() as { data: { lat: number; lng: number; place_name: string; country_code: string | null } | null };

  if (cached) {
    return {
      lat: cached.lat,
      lng: cached.lng,
      placeName: cached.place_name,
      countryCode: cached.country_code,
    };
  }

  const MAPBOX_TOKEN = getMapboxToken();
  if (!MAPBOX_TOKEN) {
    console.warn("[geocode] No Mapbox token — skipping geocoding for:", query);
    return null;
  }

  // --- Call Mapbox Geocoding API ---
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    types: "country,region,district,place",
    limit: "1",
    ...(country ? { country: country.toLowerCase() } : {}),
  });

  const url = `${GEOCODING_URL}/${encodeURIComponent(query)}.json?${params}`;

  let result: GeoResult | null = null;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "HantaVirusTrack/1.0 (ingestion pipeline)" },
    });

    if (!resp.ok) {
      console.error("[geocode] Mapbox error", resp.status, await resp.text());
      return null;
    }

    const json = (await resp.json()) as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        place_name: string;
        context?: Array<{ id: string; short_code?: string }>;
      }>;
    };

    const feature = json.features?.[0];
    if (!feature) return null;

    const [lng, lat] = feature.geometry.coordinates;
    const countryCtx = feature.context?.find((c) => c.id.startsWith("country"));
    const countryCode = countryCtx?.short_code?.toUpperCase() ?? null;

    result = { lat, lng, placeName: feature.place_name, countryCode };
  } catch (err) {
    console.error("[geocode] fetch error:", err);
    return null;
  }

  // --- Persist to cache ---
  if (result) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("geocode_cache").upsert(
      {
        query_text: cacheKey,
        lat: result.lat,
        lng: result.lng,
        place_name: result.placeName,
        country_code: result.countryCode,
        looked_up_at: new Date().toISOString(),
      },
      { onConflict: "query_text" },
    );
  }

  return result;
}

import { getWeather } from "@/lib/nasa/server";

/** NASA POWER daily weather for the Steppe replay. Cached for a day; falls back to the committed snapshot. */
export async function GET() {
  return Response.json(await getWeather());
}

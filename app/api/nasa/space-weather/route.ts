import { getSpaceWeather } from "@/lib/nasa/server";

/** DONKI solar particle events, replayed on the mission timeline. Cached for a day; falls back to the committed snapshot. */
export async function GET() {
  return Response.json(await getSpaceWeather());
}

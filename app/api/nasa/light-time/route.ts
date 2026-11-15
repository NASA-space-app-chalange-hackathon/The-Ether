import { getLightTime } from "@/lib/nasa/server";

/** JPL Horizons Earth–Mars one-way light time for every mission day. Cached for a day; falls back to the committed snapshot. */
export async function GET() {
  return Response.json(await getLightTime());
}

import { connection } from "next/server";
import { TimelineDashboard } from "@/components/timeline/timeline-dashboard";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { localDateKey } from "@/lib/time/calendar";
import { timelinePeriodSchema } from "@/lib/validation/timeline";
import { isoDateSchema } from "@/lib/ai/intent-schema";
import { getPersonalTimeline } from "@/services/timeline-service";

export const metadata = { title: "Línea de tiempo" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const query = await searchParams;
  const periodResult = timelinePeriodSchema.safeParse(first(query.period));
  const dateResult = isoDateSchema.safeParse(first(query.date));
  const period = periodResult.success ? periodResult.data : "daily";
  const date = dateResult.success ? dateResult.data : localDateKey(new Date());
  const user = await requireCurrentUser();
  const timeline = await getPersonalTimeline(user.id, { period, date });

  return <TimelineDashboard timeline={timeline} />;
}

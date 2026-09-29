import { connection } from "next/server";
import { GrowthDashboard } from "@/components/growth/growth-dashboard";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getGrowthDashboard } from "@/services/growth-service";

export const metadata = { title: "Hábitos y metas" };

export default async function GrowthPage() {
  await connection();
  const user = await requireCurrentUser();
  const data = await getGrowthDashboard(user.id);
  return <GrowthDashboard data={data} />;
}

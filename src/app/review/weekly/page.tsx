import { connection } from "next/server";
import { ReviewDashboard } from "@/components/review/review-dashboard";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getReviewReport } from "@/services/review-service";

export const metadata = { title: "Revisión semanal" };

export default async function WeeklyReviewPage() {
  await connection();
  const user = await requireCurrentUser();
  const report = await getReviewReport(user.id, "weekly");

  return <ReviewDashboard report={report} />;
}


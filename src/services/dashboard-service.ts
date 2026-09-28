import "server-only";
import { listIdeas } from "@/services/idea-service";
import { listProjects } from "@/services/project-service";
import { listTasks } from "@/services/task-service";

const inactiveTaskStatuses = new Set(["COMPLETED", "CANCELLED"]);

function limaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function getDashboardData(userId: string) {
  const [tasks, projects, ideas] = await Promise.all([
    listTasks(userId),
    listProjects(userId),
    listIdeas(userId),
  ]);
  const today = limaDateKey(new Date());
  const pendingTasks = tasks.filter((task) => !inactiveTaskStatuses.has(task.status));
  const todayTasks = pendingTasks.filter(
    (task) => task.dueDate?.toISOString().slice(0, 10) === today,
  );
  const overdueTasks = pendingTasks.filter(
    (task) => task.dueDate && task.dueDate.toISOString().slice(0, 10) < today,
  );

  return {
    todayTasks,
    pendingCount: pendingTasks.length,
    pendingTasks: pendingTasks.slice(0, 6),
    overdueCount: overdueTasks.length,
    activeProjects: projects.filter((project) => project.status === "ACTIVE"),
    recentIdeas: ideas.slice(0, 4),
  };
}

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = { title: "Proyectos" };

export default function ProjectsPage() {
  return (
    <PlaceholderPage
      eyebrow="Áreas de enfoque"
      title="Tus proyectos vivirán aquí"
      description="En la Fase 3 podrás crear, organizar y consultar cada proyecto con sus tareas, notas e ideas relacionadas."
      preview="LifeOS · Tesis · CasaBalance"
      action={{ href: "/chat", label: "Ir al chat" }}
    />
  );
}

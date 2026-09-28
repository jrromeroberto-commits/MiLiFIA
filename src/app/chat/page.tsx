import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <PlaceholderPage
      eyebrow="Tu entrada principal"
      title="¿Qué tienes en mente?"
      description="Aquí conversarás con LifeOS para capturar tareas, proyectos, ideas y notas usando lenguaje natural."
      preview="“Mañana tengo que revisar mi tesis y llamar a Carlos.”"
      action={{ href: "/", label: "Volver al inicio" }}
    />
  );
}

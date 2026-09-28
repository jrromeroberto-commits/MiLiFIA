import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = { title: "Inbox" };

export default function InboxPage() {
  return (
    <PlaceholderPage
      eyebrow="Captura sin fricción"
      title="Nada se perderá en el camino"
      description="El Inbox reunirá pensamientos recientes que aún necesiten clasificación o confirmación."
      preview="Todo lo recién capturado aparecerá aquí antes de encontrar su lugar definitivo."
      action={{ href: "/", label: "Volver al inicio" }}
    />
  );
}

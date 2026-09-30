import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFoundPage() {
  return (
    <section className="panel">
      <EmptyState
        title="No encontramos esta página"
        description="El enlace puede estar incompleto o la sección ya no existe."
        action={<Link className="text-link" href="/">Volver al inicio</Link>}
      />
    </section>
  );
}

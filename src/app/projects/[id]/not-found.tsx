import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectNotFound() {
  return (
    <div className="panel">
      <EmptyState
        title="No encontramos este proyecto"
        description="Puede que se haya eliminado o que el enlace no corresponda a tu espacio."
        action={<Link className="text-link" href="/projects">Volver a proyectos</Link>}
      />
    </div>
  );
}

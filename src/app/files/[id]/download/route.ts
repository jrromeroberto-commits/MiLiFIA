import { requireCurrentUser } from "@/lib/auth/current-user";
import { ZodError } from "zod";
import { EntityNotFoundError } from "@/services/errors";
import { getProjectFileDownload } from "@/services/project-file-service";

function contentDisposition(name: string) {
  const fallback = name.replace(/[^a-zA-Z0-9._-]/g, "_") || "archivo";
  const encoded = encodeURIComponent(name).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;
    const file = await getProjectFileDownload(user.id, id);

    return new Response(file.data, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": contentDisposition(file.originalName),
        "Content-Length": String(file.size),
        "Content-Type": file.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof EntityNotFoundError || error instanceof ZodError) {
      return new Response("Archivo no encontrado.", { status: 404 });
    }
    throw error;
  }
}

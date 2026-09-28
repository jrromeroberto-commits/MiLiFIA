import { IdeaCreateForm } from "@/components/projects/idea-create-form";
import { NoteCreateForm } from "@/components/projects/note-create-form";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/presentation/date";

type ProjectIdea = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  updatedAt: Date;
};

type ProjectNote = {
  id: string;
  title: string | null;
  content: string;
  updatedAt: Date;
};

export function ProjectIdeaSection({ projectId, ideas }: { projectId: string; ideas: ProjectIdea[] }) {
  return (
    <section className="panel" aria-labelledby="project-ideas-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Exploración</p>
          <h2 id="project-ideas-title" className="section-title">Ideas</h2>
        </div>
        <span className="count-pill">{ideas.length}</span>
      </div>
      <div className="rounded-2xl bg-amber-50/60 p-4 sm:p-5">
        <IdeaCreateForm projectId={projectId} />
      </div>
      <div className="mt-5 space-y-3">
        {ideas.length ? ideas.map((idea) => (
          <article className="rounded-2xl border border-slate-100 p-4" key={idea.id}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium text-slate-800">{idea.title}</h3>
              <StatusBadge status={idea.status} />
            </div>
            {idea.description ? <p className="mt-2 text-sm leading-6 text-slate-500">{idea.description}</p> : null}
            <p className="mt-3 text-xs text-slate-400">Actualizada {formatDateTime(idea.updatedAt)}</p>
          </article>
        )) : <EmptyState compact title="Sin ideas" description="Guarda aquí las posibilidades que quieras explorar." />}
      </div>
    </section>
  );
}

export function ProjectNoteSection({ projectId, notes }: { projectId: string; notes: ProjectNote[] }) {
  return (
    <section className="panel" aria-labelledby="project-notes-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Contexto</p>
          <h2 id="project-notes-title" className="section-title">Notas</h2>
        </div>
        <span className="count-pill">{notes.length}</span>
      </div>
      <div className="rounded-2xl bg-sky-50/60 p-4 sm:p-5">
        <NoteCreateForm projectId={projectId} />
      </div>
      <div className="mt-5 space-y-3">
        {notes.length ? notes.map((note) => (
          <article className="rounded-2xl border border-slate-100 p-4" key={note.id}>
            <h3 className="font-medium text-slate-800">{note.title ?? "Nota sin título"}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">{note.content}</p>
            <p className="mt-3 text-xs text-slate-400">Actualizada {formatDateTime(note.updatedAt)}</p>
          </article>
        )) : <EmptyState compact title="Sin notas" description="Conserva decisiones, enlaces y contexto importante." />}
      </div>
    </section>
  );
}

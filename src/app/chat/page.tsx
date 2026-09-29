import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { BrainDumpDialog } from "@/components/chat/brain-dump-dialog";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Tu entrada principal"
        title="¿Qué tienes en mente?"
        description="Escribe como hablarías normalmente. LifeOS interpreta, verifica y organiza cada acción en tus datos reales."
        action={<BrainDumpDialog />}
      />
      <ChatWorkspace />
    </div>
  );
}

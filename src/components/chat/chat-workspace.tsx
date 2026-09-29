"use client";

import Link from "next/link";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  sendChatMessageAction,
  type ChatActionResponse,
} from "@/app/actions/chat-actions";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
  response?: ChatActionResponse;
};

const suggestions = [
  "¿Qué tengo que hacer hoy?",
  "¿Qué tareas tengo atrasadas?",
  "¿Qué proyectos tengo activos?",
  "¿Qué ideas guardé esta semana?",
  "¿Cuándo fue la última vez que avancé LifeOS?",
  "Gasté 35 soles en almuerzo",
  "¿En qué gasté más este mes?",
];

const intentLabels: Record<string, string> = {
  create_task: "Crear tarea",
  create_project: "Crear proyecto",
  create_idea: "Guardar idea",
  create_note: "Guardar nota",
  list_tasks: "Consultar tareas",
  list_projects: "Consultar proyectos",
  list_ideas: "Consultar ideas",
  get_project_activity: "Consultar actividad",
  create_expense: "Registrar gasto",
  summarize_expenses: "Consultar gastos",
  complete_task: "Completar tarea",
  unknown: "Necesita contexto",
};

const initialMessages: ChatMessage[] = [
  {
    id: 0,
    role: "assistant",
    content:
      "Cuéntame qué tienes en mente. Puedo organizar acciones y responder preguntas sobre tus tareas, proyectos, ideas y actividad reciente.",
  },
];

export function ChatWorkspace() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const nextId = useRef(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, pending]);

  function appendAssistantResponse(response: ChatActionResponse) {
    setMessages((current) => [
      ...current,
      {
        id: nextId.current++,
        role: "assistant",
        content: response.reply,
        response,
      },
    ]);
  }

  function submitMessage(message: string) {
    const text = message.trim();
    if (!text || pending) return;
    const context = messages.slice(-6).map(({ role, content, response }) => {
      const options = response?.items.length
        ? `\nOpciones mostradas: ${response.items
            .map((item) => [item.label, item.detail].filter(Boolean).join(" — "))
            .join("; ")}`
        : "";

      return {
        role,
        content: `${content}${options}`.slice(0, 2_000),
      };
    });

    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", content: text },
    ]);
    setDraft("");
    setPending(true);

    startTransition(async () => {
      try {
        const response = await sendChatMessageAction(text, context);
        appendAssistantResponse(response);
      } catch {
        appendAssistantResponse({
          ok: false,
          intent: null,
          outcome: "error",
          reply:
            "La conexión se interrumpió antes de recibir una respuesta. Actualiza la página e inténtalo nuevamente.",
          items: [],
        });
      } finally {
        setPending(false);
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section
      className="grid min-h-[68vh] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_65px_-45px_rgba(15,23,42,0.38)] backdrop-blur xl:grid-cols-[minmax(0,1fr)_18rem]"
      aria-label="Conversación con LifeOS"
    >
      <div className="flex min-h-[68vh] min-w-0 flex-col" aria-busy={pending}>
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6 lg:p-8" aria-live="polite">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {pending ? (
            <div className="flex items-center gap-3 text-sm text-slate-500" role="status">
              <span className="flex size-8 items-center justify-center rounded-xl bg-violet-100 font-semibold text-violet-700">
                L
              </span>
              <span>Interpretando y verificando…</span>
            </div>
          ) : null}
          <div ref={conversationEndRef} />
        </div>

        <form
          className="border-t border-slate-200 bg-slate-50/85 p-3 sm:p-5"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="lifeos-message">
            ¿Qué tienes en mente?
          </label>
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-100">
            <textarea
              autoFocus
              className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
              disabled={pending}
              id="lifeos-message"
              maxLength={10_000}
              name="message"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="¿Qué tienes en mente?"
              ref={textareaRef}
              rows={1}
              value={draft}
            />
            <button
              className="flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={pending || !draft.trim()}
              type="submit"
            >
              Enviar
              <span className="ml-2" aria-hidden="true">
                ↑
              </span>
            </button>
          </div>
          <p className="mt-2 px-1 text-xs text-slate-400">
            Enter envía · Shift + Enter agrega una línea
          </p>
        </form>
      </div>

      <aside className="border-t border-slate-200 bg-slate-50/70 p-5 xl:border-l xl:border-t-0">
        <p className="eyebrow">Prueba una frase</p>
        <div className="mt-4 space-y-2">
          {suggestions.map((suggestion) => (
            <button
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm leading-5 text-slate-600 transition hover:border-violet-200 hover:text-violet-800 disabled:opacity-50"
              disabled={pending}
              key={suggestion}
              onClick={() => {
                setDraft(suggestion);
                textareaRef.current?.focus();
              }}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="mt-6 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
          <p className="font-semibold text-slate-700">Memoria consciente</p>
          <p className="mt-1">
            Esta conversación vive en esta pestaña. Las acciones confirmadas sí se guardan en PostgreSQL.
          </p>
        </div>
      </aside>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const response = message.response;

  return (
    <article className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
          L
        </span>
      ) : null}
      <div
        className={`max-w-[min(42rem,88%)] rounded-2xl px-4 py-3 text-sm leading-6 sm:px-5 ${
          isUser
            ? "rounded-br-md bg-slate-950 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
        }`}
      >
        {response?.intent ? (
          <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-violet-600">
            {intentLabels[response.intent] ?? response.intent}
          </p>
        ) : null}
        <p className="whitespace-pre-line">{message.content}</p>
        {response?.items.length ? (
          <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {response.items.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                {item.href ? (
                  <Link
                    className="block rounded-lg bg-slate-50 px-3 py-2 transition hover:bg-violet-50"
                    href={item.href}
                  >
                    <span className="block font-semibold text-slate-800">{item.label}</span>
                    {item.detail ? (
                      <span className="block text-xs text-slate-500">{item.detail}</span>
                    ) : null}
                  </Link>
                ) : (
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <span className="block font-semibold text-slate-800">{item.label}</span>
                    {item.detail ? (
                      <span className="block text-xs text-slate-500">{item.detail}</span>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          background: "#f6f7fb",
          color: "#0f172a",
          fontFamily: "Arial, sans-serif",
          margin: 0,
        }}
      >
        <main
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
          }}
        >
          <section style={{ maxWidth: "36rem", textAlign: "center" }}>
            <title>Error · LifeOS</title>
            <p style={{ color: "#7c3aed", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Error inesperado
            </p>
            <h1 style={{ fontSize: "2rem", letterSpacing: "-0.04em", marginBottom: "0.75rem" }}>
              LifeOS no pudo iniciar correctamente
            </h1>
            <p style={{ color: "#64748b", lineHeight: 1.6 }}>
              Revisa que PostgreSQL esté disponible y vuelve a intentarlo.
            </p>
            <button
              onClick={() => retry()}
              style={{
                background: "#0f172a",
                border: 0,
                borderRadius: "999px",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                marginTop: "1.5rem",
                minHeight: "2.75rem",
                padding: "0 1.25rem",
              }}
              type="button"
            >
              Reintentar
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

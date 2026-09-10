"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#f2f2ee", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              border: "1px solid rgba(255,255,255,0.28)",
              padding: 32,
            }}
          >
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "#8c8c86",
                margin: 0,
              }}
            >
              Critical error
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>The app failed to load.</h1>
            <p style={{ fontSize: 14, color: "#8c8c86", lineHeight: 1.6, margin: 0 }}>
              Nothing unusual was sent anywhere. Reloading usually fixes this.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: "#8a6dff",
                color: "#0a0a0a",
                border: "1.5px solid #8a6dff",
                padding: "0.7rem 1.35rem",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

import { Component, ReactNode } from "react";

interface State {
  error: Error | null;
}

const isChunkError = (err: unknown) => {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    msg,
  );
};

/**
 * Top-level error boundary — prevents a blank white screen when a lazy
 * chunk fails to load (deploy hash rotation, flaky network, etc).
 * Auto-reloads once on chunk errors; if that fails, shows a retry UI.
 */
class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (isChunkError(error)) {
      const key = "__unigates_chunk_reload__";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return;
      }
    }
    console.error("[AppErrorBoundary]", error);
  }

  handleReload = () => {
    try {
      sessionStorage.removeItem("__unigates_chunk_reload__");
    } catch { /* ignore */ }
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ error: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleGoDashboard = () => {
    window.location.href = "/institution/dashboard";
  };

  render() {
    if (!this.state.error) return this.props.children;

    const chunk = isChunkError(this.state.error);
    return (
      <div
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "hsl(var(--background, 210 40% 98%))",
          color: "hsl(var(--foreground, 222.2 84% 4.9%))",
          fontFamily: "'Cairo', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 500, width: "100%", textAlign: "center", background: "hsl(var(--card, 0 0% 100%))", padding: "32px 24px", borderRadius: "24px", border: "1px solid hsl(var(--border, 214.3 31.8% 91.4%))", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "20px", background: "rgba(20, 184, 166, 0.12)", color: "#0d9488", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, marginBottom: 16 }}>
            !
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            {chunk ? "تعذّر تحميل بعض الموارد" : "حدث خطأ أثناء تحميل الصفحة"}
          </h1>
          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 24, lineHeight: 1.7 }}>
            {chunk
              ? "قد يكون الاتصال بالإنترنت ضعيفًا أو تم تحديث الموقع. حاول إعادة التحميل."
              : "نعتذر عن الإزعاج. يمكنك إعادة المحاولة أو الانتقال مباشرة إلى لوحة التحكم."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "hsl(var(--primary, 173 80% 40%))",
                color: "hsl(var(--primary-foreground, 0 0% 100%))",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(20, 184, 166, 0.3)",
              }}
            >
              إعادة التحميل
            </button>
            <button
              onClick={this.handleGoDashboard}
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                border: "1px solid hsl(var(--border, 214.3 31.8% 91.4%))",
                cursor: "pointer",
                background: "transparent",
                color: "hsl(var(--foreground, 222.2 84% 4.9%))",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              لوحة التحكم
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                border: "1px solid hsl(var(--border, 214.3 31.8% 91.4%))",
                cursor: "pointer",
                background: "transparent",
                color: "hsl(var(--foreground, 222.2 84% 4.9%))",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              الرئيسية
            </button>
          </div>
          {this.state.error && (
            <details style={{ marginTop: 24, textAlign: "left", direction: "ltr", fontSize: 11, opacity: 0.7, background: "rgba(0,0,0,0.04)", padding: 12, borderRadius: 12, overflowX: "auto" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, direction: "rtl", textAlign: "center", marginBottom: 6 }}>
                تفاصيل الخطأ الفنية
              </summary>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;

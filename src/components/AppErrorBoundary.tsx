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
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          fontFamily: "'Cairo', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
            {chunk ? "تعذّر تحميل بعض الموارد" : "حدث خطأ غير متوقع"}
          </h1>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 20, lineHeight: 1.7 }}>
            {chunk
              ? "قد يكون الاتصال بالإنترنت ضعيفًا أو تم تحديث الموقع. حاول إعادة التحميل."
              : "نعتذر عن الإزعاج. يمكنك إعادة تحميل الصفحة للمتابعة."}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            إعادة التحميل
          </button>
          {this.state.error && (
            <details style={{ marginTop: 24, textAlign: "left", direction: "ltr", fontSize: 12, opacity: 0.8, background: "rgba(0,0,0,0.05)", padding: 12, borderRadius: 8, overflowX: "auto" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, direction: "rtl", textAlign: "center", marginBottom: 8 }}>
                تفاصيل الخطأ الفنية (Technical Details)
              </summary>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {this.state.error.toString()}
                {"\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;

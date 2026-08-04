import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Managed OAuth 2.1 consent page. Supabase Auth redirects the user here
// after they authenticate; we ask them to approve/deny the client
// (e.g. ChatGPT/Claude) requesting access to their account, then bounce
// back to the URL the authorization server returns.
export default function OAuthConsent() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        navigate("/login?next=" + encodeURIComponent(next), { replace: true });
        return;
      }
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const d: any = data;
      const immediate = d?.redirect_url ?? d?.redirect_to;
      if (immediate && !d?.client) { window.location.href = immediate; return; }
      setDetails(d);
    })();
    return () => { active = false; };
  }, [authorizationId, navigate]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = (data as any)?.redirect_url ?? (data as any)?.redirect_to;
    if (!target) { setBusy(false); return setError("No redirect returned by the authorization server."); }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full rounded-lg border-2 border-destructive/40 bg-card p-6 text-center space-y-3">
          <h1 className="text-xl font-bold text-destructive">Authorization error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }
  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  const clientName = details.client?.name ?? "an application";
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full rounded-2xl border-2 border-primary/30 bg-card p-8 shadow-xl space-y-5 text-center">
        <h1 className="text-2xl font-black">Connect {clientName} to your account</h1>
        <p className="text-muted-foreground">
          This will allow <strong>{clientName}</strong> to use UNIGATES as you.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="px-5 py-2.5 rounded-lg border-2 border-border font-semibold hover:bg-muted disabled:opacity-50"
          >
            Deny
          </button>
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/40 disabled:opacity-50"
          >
            Approve
          </button>
        </div>
      </div>
    </main>
  );
}

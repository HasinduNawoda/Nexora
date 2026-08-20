import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";

// This page is the OAuth redirect target registered with Google.
// Google sends the browser here with ?code=&state= after the user grants access.
// We forward code+state to the backend, which does the token exchange, then
// redirect to the News Feed page.
export default function GmailCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    // Google sends ?error=access_denied if the user cancels
    if (errorParam) {
      navigate("/admin/news-feed?gmail=cancelled", { replace: true });
      return;
    }

    if (!code || !state) {
      setError("Missing code or state from Google.");
      return;
    }

    // Call backend — backend verifies state, exchanges code for tokens, stores them
    api
      .get<{ success: boolean; error?: string }>(
        `/admin/gmail/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
      )
      .then((res) => {
        if (res?.success) {
          navigate("/admin/news-feed?gmail=connected", { replace: true });
        } else {
          setError(res?.error ?? "Gmail connection failed.");
        }
      })
      .catch((e: Error) => {
        setError(e.message ?? "Gmail connection failed.");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate("/admin/news-feed")}
            className="text-sm text-blue-600 underline"
          >
            Back to News Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 text-sm">Connecting Gmail…</p>
      </div>
    </div>
  );
}

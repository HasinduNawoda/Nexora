import { useState } from "react";
import {
  useGmailStatus,
  getGmailAuthUrl,
  disconnectGmail,
  syncGmailNow,
} from "../../lib/newsFeed";

function formatSyncedAt(iso?: string): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface GmailConnectionPanelProps {
  /** Called after a successful sync so the parent can refresh the feed list. */
  onSynced?: () => void;
}

export default function GmailConnectionPanel({ onSynced }: GmailConnectionPanelProps) {
  const { status, loading, error, refresh } = useGmailStatus();
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const handleConnect = async () => {
    setActionError(null);
    setConnecting(true);
    try {
      const authUrl = await getGmailAuthUrl();
      window.location.href = authUrl;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to start Gmail connection.");
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setActionError(null);
    setSyncNote(null);
    setSyncing(true);
    try {
      const result = await syncGmailNow();
      setSyncNote(`Imported ${result.imported}, skipped ${result.skipped}.`);
      onSynced?.();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setActionError(null);
    setDisconnecting(true);
    try {
      await disconnectGmail();
      setConfirmDisconnect(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to disconnect Gmail.");
    } finally {
      setDisconnecting(false);
    }
  };

  // ---- Loading ----
  if (loading) {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-lg bg-zinc-100" />
        <p className="font-mono text-xs text-zinc-400">Checking Gmail connection…</p>
      </div>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
            <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <button
          onClick={refresh}
          className="flex-shrink-0 rounded-md border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ---- Not connected ----
  if (!status.connected) {
    return (
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100">
            <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">Gmail not connected</p>
            <p className="font-mono text-xs text-zinc-400">
              Connect to pull in your subscribed newsletter/news emails.
            </p>
          </div>
        </div>
        {actionError && (
          <p className="text-sm text-red-600 sm:hidden">{actionError}</p>
        )}
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="flex-shrink-0 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {connecting ? "Redirecting…" : "Connect Gmail"}
        </button>
        {actionError && (
          <p className="hidden text-sm text-red-600 sm:block">{actionError}</p>
        )}
      </div>
    );
  }

  // ---- Connected ----
  return (
    <div className="mb-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{status.email}</p>
            <p className="font-mono text-xs text-zinc-400">
              Last synced: {formatSyncedAt(status.lastSyncedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "Syncing…" : "Sync now"}
          </button>
          <button
            onClick={() => setConfirmDisconnect(true)}
            className="rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      {(actionError || syncNote) && (
        <p className={`mt-3 font-mono text-xs ${actionError ? "text-red-600" : "text-zinc-400"}`}>
          {actionError ?? syncNote}
        </p>
      )}

      {/* Disconnect confirmation modal */}
      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="mb-1 font-display text-base font-semibold text-zinc-900">Disconnect Gmail?</h3>
            <p className="mb-5 text-sm text-zinc-500">
              The feed will stop syncing new items. Already-imported items stay in the feed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDisconnect(false)}
                disabled={disconnecting}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
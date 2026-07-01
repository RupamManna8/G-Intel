"use client";

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Key, Check } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

export default function Settings() {
  const [appId, setAppId] = useState("");
  const [clientId, setClientId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth("/auth/settings");
      setAppId(data.app_id || "");
      setClientId(data.client_id || "");
      setWebhookSecret(data.webhook_secret || "");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch settings from backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await fetchWithAuth("/auth/settings", {
        method: "POST",
        body: JSON.stringify({
          app_id: appId,
          client_id: clientId,
          webhook_secret: webhookSecret
        })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save settings to backend.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center text-xs uppercase tracking-widest text-secondary-text font-geist animate-pulse">
        Retrieving Integration configurations...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-geist">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-primary-text">Platform Settings</h2>
        <p className="text-xs text-secondary-text">Manage credentials, GitHub App credentials scope, and webhook routing triggers</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs max-w-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 bg-card border border-border rounded-lg space-y-6 max-w-2xl font-geist text-xs">
        <h3 className="text-sm font-semibold tracking-wide text-primary-text uppercase flex items-center gap-2 border-b border-border pb-3">
          <SettingsIcon className="h-4 w-4 text-info" /> GitHub App Integrations Configuration
        </h3>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-secondary-text block font-semibold">GitHub App ID</label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="w-full bg-secondary-bg border border-border rounded px-3 py-2 text-primary-text focus:outline-none focus:border-info font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-secondary-text block font-semibold">GitHub Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-secondary-bg border border-border rounded px-3 py-2 text-primary-text focus:outline-none focus:border-info font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-secondary-text block font-semibold">Webhook Secret Signature Key</label>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="w-full bg-secondary-bg border border-border rounded px-3 py-2 text-primary-text focus:outline-none focus:border-info font-mono"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] text-secondary-text">Credentials are encrypted with AES-256 before storage in database.</span>
          <button
            type="submit"
            className="px-4 py-2 bg-info text-primary-text font-bold text-xs rounded hover:bg-info/90 flex items-center gap-2 transition-colors"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 text-success" /> Configurations Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

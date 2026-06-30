"use client";

import { useState } from 'react';
import { Settings as SettingsIcon, Save, Key, Check } from 'lucide-react';

export default function Settings() {
  const [appId, setAppId] = useState("mock_app_id");
  const [clientId, setClientId] = useState("mock_client_id");
  const [webhookSecret, setWebhookSecret] = useState("mock_webhook_secret");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 font-geist">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-primary-text">Platform Settings</h2>
        <p className="text-xs text-secondary-text">Manage credentials, GitHub App credentials scope, and webhook routing triggers</p>
      </div>

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

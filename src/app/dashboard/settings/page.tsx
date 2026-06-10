"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Copy } from "lucide-react";

interface Setting {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
}

const SETTINGS: Setting[] = [
  { key: "TWILIO_ACCOUNT_SID",  label: "Twilio Account SID",    placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
  { key: "TWILIO_AUTH_TOKEN",   label: "Twilio Auth Token",     placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
  { key: "TWILIO_PHONE_NUMBER", label: "Twilio Phone Number",   placeholder: "+14125551234" },
  { key: "GOOGLE_PLACES_API_KEY", label: "Google Places API Key", placeholder: "AIzaSy...", secret: true },
  { key: "ANTHROPIC_API_KEY",   label: "Anthropic API Key",     placeholder: "sk-ant-...", secret: true },
  { key: "SUPABASE_URL",        label: "Supabase URL",          placeholder: "https://xxx.supabase.co" },
  { key: "SUPABASE_ANON_KEY",   label: "Supabase Anon Key",     placeholder: "eyJhbGci...", secret: true },
];

const SQL = `-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS businesses (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  phone       TEXT,
  address     TEXT,
  has_website BOOLEAN     DEFAULT false,
  website_score INT,
  website     TEXT,
  niche       TEXT,
  city        TEXT,
  status      TEXT        DEFAULT 'prospect',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, city)
);

CREATE TABLE IF NOT EXISTS outreach_log (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID        REFERENCES businesses(id),
  method          TEXT        NOT NULL,
  message         TEXT        NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT,
  twilio_sid      TEXT
);

CREATE TABLE IF NOT EXISTS responses (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses(id),
  from_number TEXT,
  to_number   TEXT,
  message     TEXT        NOT NULL,
  direction   TEXT        NOT NULL CHECK (direction IN ('inbound','outbound')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id      UUID        REFERENCES businesses(id),
  amount           NUMERIC     NOT NULL,
  stripe_payment_id TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE businesses    DISABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_log  DISABLE ROW LEVEL SECURITY;
ALTER TABLE responses     DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales         DISABLE ROW LEVEL SECURITY;`;

export default function SettingsPage() {
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  function toggleVisible(key: string) {
    setVisible((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  function copyEnvBlock() {
    const lines = SETTINGS.map((s) => `${s.key}=`).join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copySQL() {
    navigator.clipboard.writeText(SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-white font-sans font-bold text-xl">Settings</h1>
        <p className="text-white/35 text-sm font-sans mt-1">API credentials and configuration</p>
      </div>

      {/* Env vars */}
      <div className="bg-[#0d1321] border border-white/6 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-sans">Environment Variables</p>
          <button onClick={copyEnvBlock} className="flex items-center gap-1.5 text-white/40 hover:text-white text-[11px] font-sans transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy keys"}
          </button>
        </div>

        <p className="text-white/30 text-xs font-sans mb-5 leading-relaxed">
          Set these in <span className="text-white/60 font-mono">.env.local</span> for local dev, or in{" "}
          <span className="text-white/60">Vercel → Settings → Environment Variables</span> for production.
        </p>

        <div className="space-y-3">
          {SETTINGS.map((s) => (
            <div key={s.key}>
              <label className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-sans block mb-1">{s.label}</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <code className="block w-full bg-white/4 border border-white/8 text-white/50 px-3 py-2 text-xs font-mono">
                    {s.key}=
                    {s.secret && !visible.has(s.key)
                      ? "•".repeat(20)
                      : <span className="text-white/30">{s.placeholder}</span>}
                  </code>
                </div>
                {s.secret && (
                  <button onClick={() => toggleVisible(s.key)} className="text-white/25 hover:text-white/60 transition-colors p-1">
                    {visible.has(s.key) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Twilio webhook */}
      <div className="bg-[#0d1321] border border-white/6 p-6 mb-6">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-sans mb-4">Twilio Webhook</p>
        <p className="text-white/30 text-xs font-sans mb-3">
          In your Twilio console → Phone Numbers → your number → Messaging → Webhook URL:
        </p>
        <code className="block bg-white/4 border border-white/8 text-[#d4a853] px-4 py-3 text-xs font-mono">
          https://preview.mallardcreative.net/api/webhooks/twilio
        </code>
        <p className="text-white/25 text-[11px] font-sans mt-2">Method: HTTP POST</p>
      </div>

      {/* Supabase SQL */}
      <div className="bg-[#0d1321] border border-white/6 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-sans">Supabase Tables</p>
          <button onClick={copySQL} className="flex items-center gap-1.5 text-white/40 hover:text-white text-[11px] font-sans transition-colors">
            {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {sqlCopied ? "Copied" : "Copy SQL"}
          </button>
        </div>
        <p className="text-white/30 text-xs font-sans mb-3">
          Run this in <span className="text-white/60">Supabase → SQL Editor</span> to create the required tables:
        </p>
        <pre className="bg-white/3 border border-white/6 text-white/40 text-[11px] font-mono p-4 overflow-x-auto leading-relaxed">
          {SQL}
        </pre>
      </div>
    </div>
  );
}

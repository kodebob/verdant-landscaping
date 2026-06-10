"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Copy } from "lucide-react";

interface Setting {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  note?: string;
}

const SETTINGS: Setting[] = [
  { key: "GOOGLE_PLACES_API_KEY",           label: "Google Places API Key",      placeholder: "AIzaSy...",                          secret: true },
  { key: "ANTHROPIC_API_KEY",               label: "Anthropic API Key",           placeholder: "sk-ant-...",                         secret: true },
  { key: "TWILIO_ACCOUNT_SID",              label: "Twilio Account SID",          placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
  { key: "TWILIO_AUTH_TOKEN",               label: "Twilio Auth Token",           placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",    secret: true },
  { key: "TWILIO_PHONE_NUMBERS",            label: "Twilio Phone Numbers (pool)", placeholder: "+14125550001,+14125550002,...",       note: "Comma-separated. Up to 5 numbers. Max 50 texts/number/day." },
  { key: "KODY_PHONE_NUMBER",               label: "Your Phone Number (Kody)",    placeholder: "+14125559999",                       note: "Gets notified on sales and daily run summaries." },
  { key: "STRIPE_SECRET_KEY",               label: "Stripe Secret Key",           placeholder: "sk_live_...",                        secret: true },
  { key: "STRIPE_WEBHOOK_SECRET",           label: "Stripe Webhook Secret",       placeholder: "whsec_...",                          secret: true },
  { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", label: "Stripe Publishable Key",  placeholder: "pk_live_..." },
  { key: "SUPABASE_URL",                    label: "Supabase URL",                placeholder: "https://xxx.supabase.co" },
  { key: "SUPABASE_ANON_KEY",               label: "Supabase Anon Key",           placeholder: "eyJhbGci...",                        secret: true },
  { key: "NEXT_PUBLIC_SUPABASE_URL",        label: "Supabase URL (Public)",       placeholder: "https://xxx.supabase.co",            note: "Same as SUPABASE_URL — needed for client components." },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",   label: "Supabase Anon Key (Public)",  placeholder: "eyJhbGci...",                        secret: true, note: "Same as SUPABASE_ANON_KEY — needed for client components." },
  { key: "CRON_SECRET",                     label: "Cron Secret",                 placeholder: "any-random-string",                  note: "Protects /api/cron/* routes." },
];

const SQL = `-- Run this in your Supabase SQL Editor to set up all tables

-- Core tables
CREATE TABLE IF NOT EXISTS businesses (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT        NOT NULL,
  phone         TEXT,
  address       TEXT,
  has_website   BOOLEAN     DEFAULT false,
  website_score INT,
  website       TEXT,
  niche         TEXT,
  city          TEXT,
  place_id      TEXT,
  status        TEXT        DEFAULT 'prospect',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, city)
);

CREATE TABLE IF NOT EXISTS sites (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          TEXT        UNIQUE NOT NULL,
  business_name TEXT        NOT NULL,
  config        JSONB       NOT NULL,
  photos        TEXT[]      DEFAULT '{}',
  place_id      TEXT,
  status        TEXT        DEFAULT 'preview' CHECK (status IN ('preview','sold')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outreach_log (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id         UUID        REFERENCES businesses(id),
  method              TEXT        NOT NULL,
  message             TEXT        NOT NULL,
  sent_at             TIMESTAMPTZ DEFAULT NOW(),
  delivery_status     TEXT,
  twilio_sid          TEXT,
  twilio_number_used  TEXT,
  message_variation   INT,
  responded           BOOLEAN     DEFAULT false
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
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       UUID        REFERENCES businesses(id),
  amount            NUMERIC     NOT NULL,
  stripe_payment_id TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID        REFERENCES businesses(id),
  site_slug     TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at       TIMESTAMPTZ,
  status        TEXT        DEFAULT 'pending' CHECK (status IN ('pending','sent','skipped','failed')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cron_runs (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  date                DATE        NOT NULL,
  niche               TEXT,
  city                TEXT,
  businesses_found    INT         DEFAULT 0,
  configs_generated   INT         DEFAULT 0,
  texts_sent          INT         DEFAULT 0,
  status              TEXT        DEFAULT 'running',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on all tables
ALTER TABLE businesses    DISABLE ROW LEVEL SECURITY;
ALTER TABLE sites         DISABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_log  DISABLE ROW LEVEL SECURITY;
ALTER TABLE responses     DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales         DISABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups    DISABLE ROW LEVEL SECURITY;
ALTER TABLE cron_runs     DISABLE ROW LEVEL SECURITY;

-- Add columns that may be missing from existing tables
ALTER TABLE businesses   ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE outreach_log ADD COLUMN IF NOT EXISTS twilio_number_used TEXT;
ALTER TABLE outreach_log ADD COLUMN IF NOT EXISTS message_variation INT;
ALTER TABLE outreach_log ADD COLUMN IF NOT EXISTS responded BOOLEAN DEFAULT false;`;

export default function SettingsPage() {
  const [visible,    setVisible]    = useState<Set<string>>(new Set());
  const [copied,     setCopied]     = useState(false);
  const [sqlCopied,  setSqlCopied]  = useState(false);

  function toggleVisible(key: string) {
    setVisible((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  function copyEnvBlock() {
    const lines = SETTINGS.map((s) => `${s.key}=`).join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function copySQL() {
    navigator.clipboard.writeText(SQL);
    setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2000);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-white font-sans font-bold text-xl">Settings</h1>
        <p className="text-white/35 text-sm font-sans mt-1">API credentials and configuration</p>
      </div>

      {/* Env vars */}
      <div className="bg-[#0d1321] border border-white/6 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-sans">Environment Variables</p>
          <button onClick={copyEnvBlock} className="flex items-center gap-1.5 text-white/40 hover:text-white text-[11px] font-sans transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy keys"}
          </button>
        </div>
        <p className="text-white/30 text-xs font-sans mb-5 leading-relaxed">
          Set in <span className="text-white/60 font-mono">.env.local</span> for dev,{" "}
          <span className="text-white/60">Vercel → Settings → Environment Variables</span> for production.
        </p>
        <div className="space-y-4">
          {SETTINGS.map((s) => (
            <div key={s.key}>
              <label className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-sans block mb-1">{s.label}</label>
              {s.note && <p className="text-white/25 text-[11px] font-sans mb-1">{s.note}</p>}
              <div className="flex items-center gap-2">
                <div className="flex-1">
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

      {/* Webhooks */}
      <div className="bg-[#0d1321] border border-white/6 p-6 mb-6 space-y-5">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-sans">Webhooks</p>
        <div>
          <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-sans mb-1">Twilio — Incoming SMS</p>
          <code className="block bg-white/4 border border-white/8 text-[#d4a853] px-4 py-3 text-xs font-mono">
            https://preview.mallardcreative.net/api/webhooks/twilio
          </code>
          <p className="text-white/25 text-[11px] font-sans mt-1">Twilio Console → Phone Numbers → Messaging → Webhook (HTTP POST)</p>
        </div>
        <div>
          <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-sans mb-1">Stripe — Payment Events</p>
          <code className="block bg-white/4 border border-white/8 text-[#d4a853] px-4 py-3 text-xs font-mono">
            https://preview.mallardcreative.net/api/webhooks/stripe
          </code>
          <p className="text-white/25 text-[11px] font-sans mt-1">Stripe Dashboard → Developers → Webhooks → checkout.session.completed</p>
        </div>
      </div>

      {/* Cron info */}
      <div className="bg-[#0d1321] border border-white/6 p-6 mb-6">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-sans mb-4">Cron Schedule</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-sans">Daily Pipeline</p>
              <p className="text-white/35 text-xs font-sans">Finds 250 businesses, queues for config generation</p>
            </div>
            <code className="text-[#d4a853] text-xs font-mono bg-white/4 px-2 py-1">9:00am ET daily</code>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-sans">Hourly Processor</p>
              <p className="text-white/35 text-xs font-sans">Generates configs, sends texts, sends follow-ups</p>
            </div>
            <code className="text-[#d4a853] text-xs font-mono bg-white/4 px-2 py-1">9am–6pm ET hourly</code>
          </div>
        </div>
      </div>

      {/* SQL */}
      <div className="bg-[#0d1321] border border-white/6 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-sans">Supabase Schema</p>
          <button onClick={copySQL} className="flex items-center gap-1.5 text-white/40 hover:text-white text-[11px] font-sans transition-colors">
            {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {sqlCopied ? "Copied" : "Copy SQL"}
          </button>
        </div>
        <p className="text-white/30 text-xs font-sans mb-3">
          Run in <span className="text-white/60">Supabase → SQL Editor</span>. Safe to re-run — uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS.
        </p>
        <pre className="bg-white/3 border border-white/6 text-white/40 text-[11px] font-mono p-4 overflow-x-auto leading-relaxed max-h-96 overflow-y-auto">
          {SQL}
        </pre>
      </div>
    </div>
  );
}

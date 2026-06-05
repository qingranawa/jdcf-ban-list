import type { D1Database } from '@cloudflare/workers-types';

export type Env = {
  DB: D1Database;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  JWT_SECRET: string;
  CRON_ARCHIVE_SECRET: string;
};

export type BanRow = {
  id: number;
  nickname: string;
  steam_id: string;
  ip_address: string;
  reason: string;
  ban_time: string;
  ban_duration: string;
  violation_level: string;
  notes: string;
  handled_by: number | null;
  is_archived: number;
  archive_action: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminRow = {
  id: number;
  steam_id: string;
  username: string;
  password_hash: string;
  permission_group: string;
  game_name: string;
  qq_name: string;
  position: string;
  supervisor: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};

// > Cloudflare D1 database schema types
// ! co_handlers 存逗号分隔字符串 — 无关联表，简单但不可 JOIN
import type { D1Database, Fetcher } from '@cloudflare/workers-types';

export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  JWT_SECRET: string;
  CRON_ARCHIVE_SECRET: string;
  CRON_PUBLISH_SECRET: string;
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
  // ! 逗号分隔的联合封禁管理员名，需在展示层 split
  co_handlers: string;
  is_archived: number;
  archive_action: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WatchlistRow = {
  id: number;
  steam_id: string;
  nickname: string | null;
  reason: string | null;
  added_by: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementRow = {
  id: number;
  title: string;
  subtitle: string | null;
  body: string;
  citation: string | null;
  type: string;
  is_pinned: number;
  is_published: number;
  publish_at: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
};

export type AnnouncementReadRow = {
  announcement_id: number;
  admin_id: number;
  read_at: string;
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

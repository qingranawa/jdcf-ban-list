-- 初始 OWNER 管理员
-- 密码: change_me_123   (bcrypt hash)
-- 部署前请务必修改此密码！
INSERT INTO admins (steam_id, username, password_hash, permission_group, game_name, qq_name, position, supervisor)
VALUES (
  'INIT_STEAM_ID',
  'admin',
  -- 密码变更说明：hash 由首次运行 npm run db:seed 时自动生成
  -- 此处为占位符，首次部署时请使用 wrangler d1 execute 重新 seed
  '$2a$10$OA1Itd7mLMrfTO4fTrR/fuwKJF2FoPBIBxOG7EwbEYMLSOv4l2p0u',
  'OWNER',
  '初始管理员',
  '初始管理员',
  '服务器主管',
  '全局'
);

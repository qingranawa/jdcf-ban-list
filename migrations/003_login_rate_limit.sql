CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  attempted_at INTEGER NOT NULL,
  PRIMARY KEY (ip, attempted_at)
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip);

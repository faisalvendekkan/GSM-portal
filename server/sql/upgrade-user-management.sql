ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(80) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active' AFTER role,
  ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL AFTER bio;

UPDATE users SET full_name = name WHERE full_name IS NULL OR full_name = '';
UPDATE users SET status = 'active' WHERE status IS NULL;

ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_users_status (status),
  ADD INDEX IF NOT EXISTS idx_users_last_login (last_login_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id INT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  target_user_id INT UNSIGNED NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_admin (admin_id),
  KEY idx_audit_logs_target_user (target_user_id),
  KEY idx_audit_logs_action (action),
  KEY idx_audit_logs_created (created_at),
  CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

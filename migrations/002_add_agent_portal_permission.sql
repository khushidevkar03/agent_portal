ALTER TABLE admin_logins
  ADD COLUMN can_access_agent_portal TINYINT(1) NOT NULL DEFAULT 0
  AFTER has_booking_access;

CREATE TABLE agent_portal_audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  login_id INT NULL,
  admin_id INT NULL,
  event_type VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_agent_audit_login (login_id),
  KEY idx_agent_audit_admin (admin_id),
  KEY idx_agent_audit_created (created_at)
) ENGINE=InnoDB;

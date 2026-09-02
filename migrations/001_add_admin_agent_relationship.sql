-- MariaDB 10.4 / InnoDB. Existing rows receive NULL automatically.
ALTER TABLE admins
  ADD COLUMN agent_id INT NULL AFTER id,
  ADD INDEX idx_admins_agent_id (agent_id),
  ADD CONSTRAINT fk_admins_agent_id
    FOREIGN KEY (agent_id) REFERENCES admins(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

DELIMITER //
CREATE TRIGGER admins_agent_no_self_insert
BEFORE INSERT ON admins
FOR EACH ROW
BEGIN
  IF NEW.agent_id IS NOT NULL AND NEW.agent_id = NEW.id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'An admin cannot refer itself';
  END IF;
END//

CREATE TRIGGER admins_agent_no_self_update
BEFORE UPDATE ON admins
FOR EACH ROW
BEGIN
  IF NEW.agent_id IS NOT NULL AND NEW.agent_id = NEW.id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'An admin cannot refer itself';
  END IF;
END//
DELIMITER ;

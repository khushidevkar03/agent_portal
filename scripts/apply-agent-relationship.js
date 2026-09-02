const db = require('../src/config/env');

(async () => {
  try {
    await db.query('ALTER TABLE admins ADD COLUMN agent_id INT NULL AFTER id, ADD INDEX idx_admins_agent_id (agent_id), ADD CONSTRAINT fk_admins_agent_id FOREIGN KEY (agent_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL');
    await db.query("CREATE TRIGGER admins_agent_no_self_insert BEFORE INSERT ON admins FOR EACH ROW BEGIN IF NEW.agent_id IS NOT NULL AND NEW.agent_id = NEW.id THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'An admin cannot refer itself'; END IF; END");
    await db.query("CREATE TRIGGER admins_agent_no_self_update BEFORE UPDATE ON admins FOR EACH ROW BEGIN IF NEW.agent_id IS NOT NULL AND NEW.agent_id = NEW.id THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'An admin cannot refer itself'; END IF; END");
    console.log('Agent relationship migration applied');
  } finally {
    await db.end();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });

INSERT INTO users (name, full_name, email, password_hash, role, status)
VALUES ('Portal Admin', 'Portal Admin', 'admin@mobilerepair.test', '$2b$12$sX/QLgs2Ul2eTaxBoB76GuHCNd5GauBrJjQJD24IkqPJkR8dUeMou', 'admin', 'active')
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO categories (name, slug, description)
VALUES
('Display Repair', 'display-repair', 'LCD, OLED, touch, backlight, and display connector diagnosis.'),
('Charging Section', 'charging-section', 'Charging ports, USB lines, charging ICs, and current flow checks.'),
('Battery Issues', 'battery-issues', 'Battery health, drain testing, replacement safety, and power rails.'),
('Network Section', 'network-section', 'Signal, antenna, SIM, RF, and baseband troubleshooting basics.'),
('Speaker / Mic Issues', 'speaker-mic-issues', 'Audio path, speaker, earpiece, microphone, and mesh cleaning notes.'),
('Camera Problems', 'camera-problems', 'Front and rear camera diagnosis, flex checks, and app-level testing.'),
('Software Repair', 'software-repair', 'OS recovery, update errors, backups, and safe reset workflows.'),
('Flashing Tools', 'flashing-tools', 'Official flashing tools, drivers, firmware matching, and safety steps.'),
('Schematic Reading', 'schematic-reading', 'Board view, schematic symbols, test points, and signal tracing.'),
('IC Identification', 'ic-identification', 'Common IC packages, markings, and board-level identification.'),
('Tools and Equipment', 'tools-and-equipment', 'Multimeters, DC power supplies, hot air, soldering, and microscopes.'),
('Safety Guidelines', 'safety-guidelines', 'Battery, ESD, heat, fumes, and data safety practices.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO articles (title, slug, category_id, content, image_url, video_url, tags)
SELECT
  'Charging Port Diagnosis Checklist',
  'charging-port-diagnosis-checklist',
  c.id,
  'Start with the charger and cable, inspect the port under magnification, clean lint gently, then measure VBUS and battery connector voltage. Disconnect the battery before board work and avoid forcing damaged connectors.',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  NULL,
  JSON_ARRAY('charging', 'usb', 'diagnosis')
FROM categories c
WHERE c.slug = 'charging-section'
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO articles (title, slug, category_id, content, image_url, video_url, tags)
SELECT
  'Safe Battery Replacement Basics',
  'safe-battery-replacement-basics',
  c.id,
  'Power off the phone, discharge the battery below 25 percent when possible, avoid puncture, use controlled heat, and stop immediately if the cell swells, smells, or becomes hot.',
  'https://images.unsplash.com/photo-1602526214149-7b1b4e1b48a1?auto=format&fit=crop&w=1200&q=80',
  NULL,
  JSON_ARRAY('battery', 'safety')
FROM categories c
WHERE c.slug = 'battery-issues'
ON DUPLICATE KEY UPDATE title = VALUES(title);

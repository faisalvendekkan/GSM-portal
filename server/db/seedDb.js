const bcrypt = require("bcrypt");
const { query } = require("../config/database");

const categories = [
  ["Display Repair", "display-repair", "LCD, OLED, touch, backlight, and display connector diagnosis."],
  ["Charging Section", "charging-section", "Charging ports, USB lines, charging ICs, and current flow checks."],
  ["Battery Issues", "battery-issues", "Battery health, drain testing, replacement safety, and power rails."],
  ["Network Section", "network-section", "Signal, antenna, SIM, RF, and baseband troubleshooting basics."],
  ["Speaker / Mic Issues", "speaker-mic-issues", "Audio path, speaker, earpiece, microphone, and mesh cleaning notes."],
  ["Camera Problems", "camera-problems", "Front and rear camera diagnosis, flex checks, and app-level testing."],
  ["Software Repair", "software-repair", "OS recovery, update errors, backups, and safe reset workflows."],
  ["Flashing Tools", "flashing-tools", "Official flashing tools, drivers, firmware matching, and safety steps."],
  ["Schematic Reading", "schematic-reading", "Board view, schematic symbols, test points, and signal tracing."],
  ["IC Identification", "ic-identification", "Common IC packages, markings, and board-level identification."],
  ["Tools and Equipment", "tools-and-equipment", "Multimeters, DC power supplies, hot air, soldering, and microscopes."],
  ["Safety Guidelines", "safety-guidelines", "Battery, ESD, heat, fumes, and data safety practices."]
];

async function seedDb() {
  for (const [name, slug, description] of categories) {
    await query(
      `INSERT INTO categories (name, slug, description)
       VALUES (?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         updated_at = datetime('now')`,
      [name, slug, description]
    );
  }

  const admins = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!admins.length) {
    const passwordHash = await bcrypt.hash("Admin@12345!", 12);
    await query(
      `INSERT INTO users (name, full_name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'admin', 'active')`,
      ["Portal Admin", "Portal Admin", "admin@gsmportal.local", passwordHash]
    );
    console.log("Default admin created: admin@gsmportal.local / Admin@12345!");
  }

  const charging = (await query("SELECT id FROM categories WHERE slug = ? LIMIT 1", ["charging-section"]))[0];
  const battery = (await query("SELECT id FROM categories WHERE slug = ? LIMIT 1", ["battery-issues"]))[0];

  if (charging) {
    await query(
      `INSERT INTO articles (title, slug, category_id, content, image_url, tags)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO NOTHING`,
      [
        "Charging Port Diagnosis Checklist",
        "charging-port-diagnosis-checklist",
        charging.id,
        "Start with the charger and cable, inspect the port under magnification, clean lint gently, then measure VBUS and battery connector voltage. Disconnect the battery before board work and avoid forcing damaged connectors.",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        JSON.stringify(["charging", "usb", "diagnosis"])
      ]
    );
  }

  if (battery) {
    await query(
      `INSERT INTO articles (title, slug, category_id, content, image_url, tags)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO NOTHING`,
      [
        "Safe Battery Replacement Basics",
        "safe-battery-replacement-basics",
        battery.id,
        "Power off the phone, discharge the battery below 25 percent when possible, avoid puncture, use controlled heat, and stop immediately if the cell swells, smells, or becomes hot.",
        "https://images.unsplash.com/photo-1602526214149-7b1b4e1b48a1?auto=format&fit=crop&w=1200&q=80",
        JSON.stringify(["battery", "safety"])
      ]
    );
  }
}

if (require.main === module) {
  const { initializeDatabase } = require("../config/database");
  initializeDatabase()
    .then(seedDb)
    .then(() => console.log("SQLite seed complete."))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedDb;

const bcrypt = require("bcrypt");
const env = require("../config/env");
const { query, saveDatabase } = require("../config/database");

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

function getDefaultAdminCredentials() {
  return {
    email: String(env.defaultAdminEmail || "admin@gsmportal.local").trim().toLowerCase(),
    password: env.defaultAdminPassword || "Admin@12345!"
  };
}

function publicAdminCheck(row, passwordMatchesDefault = false) {
  return {
    exists: Boolean(row),
    email: row?.email || null,
    role: row?.role || null,
    status: row?.status || null,
    passwordMatchesDefault
  };
}

async function findDefaultAdmin() {
  const { email } = getDefaultAdminCredentials();
  const rows = await query(
    "SELECT id, email, password_hash, role, status FROM users WHERE lower(trim(email)) = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function resetDefaultAdmin() {
  const { email, password } = getDefaultAdminCredentials();
  const existing = await findDefaultAdmin();
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    await query(
      `UPDATE users
       SET email = ?, password_hash = ?, role = 'admin', status = 'active', updated_at = datetime('now')
       WHERE id = ?`,
      [email, passwordHash, existing.id]
    );
  } else {
    await query(
      `INSERT INTO users (name, full_name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'admin', 'active')`,
      ["Portal Admin", "Portal Admin", email, passwordHash]
    );
  }

  saveDatabase();
  console.log("Default admin reset completed");
  return findDefaultAdmin();
}

async function getDefaultAdminCheck() {
  const { password } = getDefaultAdminCredentials();
  const admin = await findDefaultAdmin();
  let passwordMatchesDefault = false;

  if (admin?.password_hash) {
    try {
      passwordMatchesDefault = await bcrypt.compare(password, admin.password_hash);
    } catch (error) {
      passwordMatchesDefault = false;
    }
  }

  return {
    configuredEmail: getDefaultAdminCredentials().email,
    resetDefaultAdmin: env.resetDefaultAdmin,
    ...publicAdminCheck(admin, passwordMatchesDefault)
  };
}

async function ensureDefaultAdmin({ forceReset = false } = {}) {
  const { email, password } = getDefaultAdminCredentials();
  const existing = await findDefaultAdmin();

  if (forceReset || env.resetDefaultAdmin) {
    await resetDefaultAdmin();
    return;
  }

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await query(
      `INSERT INTO users (name, full_name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'admin', 'active')`,
      ["Portal Admin", "Portal Admin", email, passwordHash]
    );
    saveDatabase();
    console.log(`Default admin created: ${email}`);
  } else {
    console.log("Default admin already exists.");
  }
}

async function isDefaultAdminReady() {
  const rows = await query("SELECT id FROM users WHERE role = 'admin' AND status = 'active' LIMIT 1");
  return rows.length > 0;
}

async function seedDb() {
  const categoryCount = await query("SELECT COUNT(*) AS total FROM categories");
  if (!categoryCount[0]?.total) {
    for (const [name, slug, description] of categories) {
      await query(
        `INSERT INTO categories (name, slug, description)
         VALUES (?, ?, ?)`,
        [name, slug, description]
      );
    }
    console.log("Default categories seeded.");
  } else {
    console.log("Default categories already exist.");
  }

  await ensureDefaultAdmin();

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
module.exports.ensureDefaultAdmin = ensureDefaultAdmin;
module.exports.resetDefaultAdmin = resetDefaultAdmin;
module.exports.getDefaultAdminCheck = getDefaultAdminCheck;
module.exports.isDefaultAdminReady = isDefaultAdminReady;

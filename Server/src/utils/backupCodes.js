const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'backup_codes.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}), 'utf8');
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function generateBackupCodes(count = 5, length = 6) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < length; j++) {
      code += Math.floor(Math.random() * 10);
    }
    codes.push(code);
  }
  return codes;
}

function saveBackupCodes(email, codes) {
  const db = readDb();
  db[email] = { email, backup_codes: codes, createdAt: new Date().toISOString() };
  writeDb(db);
  return db[email];
}

function getBackupCodes(email) {
  const db = readDb();
  return db[email] || null;
}

module.exports = { generateBackupCodes, saveBackupCodes, getBackupCodes };



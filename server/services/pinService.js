const bcrypt = require("bcryptjs");

const PIN_PATTERN = /^\d{4}$/;

function normalizePin(value) {
  return String(value ?? "").trim();
}

function isValidPin(value) {
  return PIN_PATTERN.test(normalizePin(value));
}

function generatePin() {
  const rawValue = Math.floor(1000 + Math.random() * 9000);
  return String(rawValue);
}

async function hashPin(pin) {
  const normalized = normalizePin(pin);
  if (!isValidPin(normalized)) {
    throw new Error("PIN must be exactly 4 digits");
  }
  return bcrypt.hash(normalized, 12);
}

async function comparePin(pin, pinHash) {
  const normalized = normalizePin(pin);
  if (!pinHash || !isValidPin(normalized)) {
    return false;
  }
  return bcrypt.compare(normalized, pinHash);
}

module.exports = {
  normalizePin,
  isValidPin,
  generatePin,
  hashPin,
  comparePin,
};

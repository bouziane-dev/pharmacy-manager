const mongoose = require("mongoose");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanString(value) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim();
}

function cleanSingleLine(value) {
  return cleanString(value).replace(/\s+/g, " ");
}

function cleanEmail(value) {
  return cleanString(value).toLowerCase();
}

function cleanPhoneDigits(value) {
  return cleanString(value).replace(/\D/g, "");
}

function isValidEmail(value) {
  return emailPattern.test(cleanEmail(value));
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(cleanString(value));
}

function normalizeRole(value) {
  return cleanSingleLine(value).toLowerCase();
}

module.exports = {
  cleanString,
  cleanSingleLine,
  cleanEmail,
  cleanPhoneDigits,
  isValidEmail,
  isValidObjectId,
  normalizeRole,
};

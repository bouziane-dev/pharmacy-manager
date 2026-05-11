const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(value) {
  const safeValue = String(value || "").trim();
  if (!dateOnlyPattern.test(safeValue)) return null;

  const [year, month, day] = safeValue.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function toDateOnly(value = new Date()) {
  const source = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(source.getTime())) return "";

  return [
    source.getUTCFullYear(),
    String(source.getUTCMonth() + 1).padStart(2, "0"),
    String(source.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(dateOnlyValue, days) {
  const parsed = parseDateOnly(dateOnlyValue);
  if (!parsed) return "";
  parsed.setUTCDate(parsed.getUTCDate() + Number(days || 0));
  return toDateOnly(parsed);
}

function daysBetween(startDateOnly, endDateOnly) {
  const start = parseDateOnly(startDateOnly);
  const end = parseDateOnly(endDateOnly);
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function normalizeCaisse(value) {
  const normalized = String(value || "CNAS").trim().toUpperCase();
  return normalized === "CASNOS" ? "CASNOS" : "CNAS";
}

function calculateRenewalStatus({
  caisse = "CNAS",
  nextRenewalDate = "",
  todayDateOnly = toDateOnly(),
} = {}) {
  const normalizedCaisse = normalizeCaisse(caisse);
  const today = parseDateOnly(todayDateOnly);
  const next = parseDateOnly(nextRenewalDate);

  if (!today || !next) {
    return {
      key: "a_jour",
      label: "À jour",
      eligibleFromDate: "",
      daysUntilRenewal: null,
    };
  }

  const safeToday = toDateOnly(today);
  const safeNext = toDateOnly(next);
  const overdueFromDate = addDays(safeNext, 7);
  const daysUntilRenewal = daysBetween(safeToday, safeNext);

  if (safeToday > overdueFromDate) {
    return {
      key: "en_retard",
      label: "En retard",
      eligibleFromDate:
        normalizedCaisse === "CNAS" ? addDays(safeNext, -10) : safeNext,
      daysUntilRenewal,
    };
  }

  if (normalizedCaisse === "CNAS") {
    const eligibleFromDate = addDays(safeNext, -10);

    // CNAS allows pharmacy renewal 10 date-only days before the expected date.
    if (safeToday < eligibleFromDate) {
      return {
        key: "a_jour",
        label: "À jour",
        eligibleFromDate,
        daysUntilRenewal,
      };
    }

    if (safeToday < safeNext) {
      return {
        key: "renouvellement_possible",
        label: "Renouvellement possible",
        eligibleFromDate,
        daysUntilRenewal,
      };
    }

    return {
      key: "a_contacter",
      label: "À contacter",
      eligibleFromDate,
      daysUntilRenewal,
    };
  }

  // CASNOS is stricter: eligibility starts only when the full period has passed.
  if (safeToday < safeNext) {
    return {
      key: "a_jour",
      label: "À jour",
      eligibleFromDate: safeNext,
      daysUntilRenewal,
    };
  }

  return {
    key: "renouvellement_possible_contact",
    label: "Renouvellement possible / À contacter",
    eligibleFromDate: safeNext,
    daysUntilRenewal,
  };
}

module.exports = {
  addDays,
  calculateRenewalStatus,
  dateOnlyPattern,
  normalizeCaisse,
  parseDateOnly,
  toDateOnly,
};

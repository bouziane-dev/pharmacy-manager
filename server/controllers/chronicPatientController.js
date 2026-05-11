const ChronicPatient = require("../models/ChronicPatient");
const Task = require("../models/Task");
const {
  cleanPhoneDigits,
  cleanSingleLine,
  cleanString,
  isValidObjectId,
} = require("../utils/input");
const { logActivity } = require("../services/activityLogger");
const {
  addDays,
  calculateRenewalStatus,
  dateOnlyPattern,
  normalizeCaisse,
  toDateOnly,
} = require("../utils/chronicRenewal");

const patientStatusValues = new Set(["active", "inactive"]);
const renewalFrequencyValues = new Set(["30", "60", "90", "custom"]);
const frequencyPeriodValues = new Set(["day", "week", "month", ""]);

function getActorName(user) {
  return cleanSingleLine(user?.displayName || user?.name || user?.email) || "Staff";
}

function normalizePatientStatus(value, fallback = "active") {
  const normalized = cleanSingleLine(value).toLowerCase();
  return patientStatusValues.has(normalized) ? normalized : fallback;
}

function normalizeDateOnly(value) {
  const normalized = cleanString(value);
  return normalized && dateOnlyPattern.test(normalized) ? normalized : "";
}

function normalizeBirthYear(value, fallback = null) {
  const source = value ?? fallback;
  if (source === "" || source === null || typeof source === "undefined") {
    return null;
  }

  const parsed = Math.round(Number(source));
  if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2200) {
    return null;
  }

  return parsed;
}

function normalizeRenewalFrequency(value) {
  const normalized = cleanSingleLine(value || "30").toLowerCase();
  return renewalFrequencyValues.has(normalized) ? normalized : "30";
}

function getRenewalDays(treatment) {
  const frequency = normalizeRenewalFrequency(treatment?.renewalFrequency);
  if (frequency === "custom") {
    const parsed = Math.round(Number(treatment?.customRenewalDays || 0));
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 365) : 30;
  }
  return Number(frequency);
}

function calculateAge({ birthYear, dateOfBirth } = {}) {
  const currentYear = Number(toDateOnly().slice(0, 4));
  const yearFromFullDate = dateOfBirth ? Number(String(dateOfBirth).slice(0, 4)) : null;
  const year = normalizeBirthYear(birthYear, yearFromFullDate);
  if (!year || year > currentYear) return null;
  return currentYear - year;
}

function calculateNextRenewalDate(lastDeliveryDate, treatment) {
  const normalizedLastDeliveryDate = normalizeDateOnly(lastDeliveryDate);
  if (!normalizedLastDeliveryDate) return "";
  return addDays(normalizedLastDeliveryDate, getRenewalDays(treatment));
}

function getPatientRenewalSummary(treatments, caisse) {
  const priority = {
    en_retard: 4,
    a_contacter: 3,
    renouvellement_possible_contact: 3,
    renouvellement_possible: 2,
    a_jour: 1,
  };

  const statuses = (treatments || [])
    .map((treatment) =>
      calculateRenewalStatus({
        caisse,
        nextRenewalDate: treatment.nextRenewalDate,
      }),
    )
    .filter(Boolean);

  if (statuses.length === 0) {
    return {
      key: "a_jour",
      label: "À jour",
      eligibleFromDate: "",
      daysUntilRenewal: null,
    };
  }

  return statuses.reduce((selected, current) =>
    (priority[current.key] || 0) > (priority[selected.key] || 0)
      ? current
      : selected,
  );
}

function toClientTreatment(treatmentDoc, caisse) {
  const treatment = treatmentDoc?.toObject ? treatmentDoc.toObject() : treatmentDoc;
  const renewalStatus = calculateRenewalStatus({
    caisse,
    nextRenewalDate: treatment?.nextRenewalDate || "",
  });

  return {
    id: String(treatment._id),
    productName: treatment.productName || "",
    dosage: treatment.dosage || "",
    frequency: treatment.frequency || "",
    frequencyQty: treatment.frequencyQty || "",
    frequencyTimes: treatment.frequencyTimes ?? null,
    frequencyPeriod: treatment.frequencyPeriod || "",
    quantity: treatment.quantity || "",
    renewalFrequency: normalizeRenewalFrequency(treatment.renewalFrequency),
    customRenewalDays: treatment.customRenewalDays || null,
    renewalDays: getRenewalDays(treatment),
    lastDeliveryDate: treatment.lastDeliveryDate || "",
    nextRenewalDate: treatment.nextRenewalDate || "",
    notes: treatment.notes || "",
    renewalStatus,
    createdAt: treatment.createdAt,
    updatedAt: treatment.updatedAt,
  };
}

function toClientPatient(patientDoc) {
  const caisse = normalizeCaisse(patientDoc.caisse);
  const treatments = (patientDoc.treatments || []).map((item) =>
    toClientTreatment(item, caisse),
  );
  const renewalSummary = getPatientRenewalSummary(treatments, caisse);

  return {
    id: String(patientDoc._id),
    pharmacyId: String(patientDoc.pharmacyId),
    fullName: patientDoc.fullName,
    phone: patientDoc.phone,
    caisse,
    insuredNumber: patientDoc.insuredNumber || "",
    birthYear: patientDoc.birthYear ?? null,
    age: calculateAge({
      birthYear: patientDoc.birthYear,
      dateOfBirth: patientDoc.dateOfBirth,
    }),
    dateOfBirth: patientDoc.dateOfBirth || "",
    address: patientDoc.address || "",
    notes: patientDoc.notes || "",
    status: normalizePatientStatus(patientDoc.status),
    renewalStatus: renewalSummary,
    treatments,
    history: (patientDoc.history || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((item) => ({
        id: String(item._id),
        type: item.type,
        text: item.text,
        treatmentId: item.treatmentId ? String(item.treatmentId) : null,
        authorName: item.authorName || "",
        actionDate: item.actionDate || "",
        createdAt: item.createdAt,
      })),
    createdAt: patientDoc.createdAt,
    updatedAt: patientDoc.updatedAt,
  };
}

function buildStats(patients) {
  return patients.reduce(
    (stats, patient) => {
      const key = patient.renewalStatus?.key || "a_jour";
      stats.total += 1;
      if (patient.status === "inactive") return stats;
      if (key === "en_retard") stats.enRetard += 1;
      if (key === "a_contacter" || key === "renouvellement_possible_contact" || key === "en_retard") {
        stats.aContacter += 1;
      }
      if (key === "renouvellement_possible" || key === "renouvellement_possible_contact") {
        stats.renouvellementPossible += 1;
      }
      return stats;
    },
    {
      total: 0,
      aContacter: 0,
      renouvellementPossible: 0,
      enRetard: 0,
    },
  );
}

function normalizePatientPayload(body, existing = {}) {
  const fullName = cleanSingleLine(body?.fullName ?? existing.fullName);
  const phone = cleanPhoneDigits(body?.phone ?? existing.phone);
  const caisse = normalizeCaisse(body?.caisse ?? existing.caisse);
  const insuredNumber = cleanSingleLine(body?.insuredNumber ?? existing.insuredNumber);
  const dateOfBirth = normalizeDateOnly(body?.dateOfBirth ?? existing.dateOfBirth);
  const birthYear = normalizeBirthYear(
    body?.birthYear,
    dateOfBirth ? Number(dateOfBirth.slice(0, 4)) : existing.birthYear,
  );
  const address = cleanString(body?.address ?? existing.address);
  const notes = cleanString(body?.notes ?? existing.notes);
  const status = normalizePatientStatus(body?.status ?? existing.status, "active");

  return {
    fullName,
    phone,
    caisse,
    insuredNumber,
    age: null,
    birthYear,
    dateOfBirth,
    address,
    notes,
    status,
  };
}

function normalizeTreatmentPayload(body, existing = {}) {
  const renewalFrequency = normalizeRenewalFrequency(
    body?.renewalFrequency ?? existing.renewalFrequency,
  );
  const customDays = Math.round(Number(body?.customRenewalDays ?? existing.customRenewalDays ?? 0));
  const frequencyPeriod = cleanSingleLine(body?.frequencyPeriod ?? existing.frequencyPeriod);
  const frequencyTimesRaw = body?.frequencyTimes ?? existing.frequencyTimes ?? null;
  const frequencyTimes =
    frequencyTimesRaw === "" || frequencyTimesRaw === null || typeof frequencyTimesRaw === "undefined"
      ? null
      : Number(frequencyTimesRaw);

  const payload = {
    productName: cleanSingleLine(body?.productName ?? existing.productName),
    dosage: cleanSingleLine(body?.dosage ?? existing.dosage),
    frequency: cleanSingleLine(body?.frequency ?? existing.frequency),
    frequencyQty: cleanSingleLine(body?.frequencyQty ?? existing.frequencyQty),
    frequencyTimes:
      Number.isFinite(frequencyTimes) && frequencyTimes >= 0
        ? Math.min(frequencyTimes, 50)
        : null,
    frequencyPeriod: frequencyPeriodValues.has(frequencyPeriod) ? frequencyPeriod : "",
    quantity: cleanSingleLine(body?.quantity ?? existing.quantity),
    renewalFrequency,
    customRenewalDays:
      renewalFrequency === "custom" && Number.isFinite(customDays) && customDays > 0
        ? Math.min(customDays, 365)
        : null,
    lastDeliveryDate: normalizeDateOnly(body?.lastDeliveryDate ?? existing.lastDeliveryDate),
    nextRenewalDate: "",
    notes: cleanString(body?.notes ?? existing.notes),
  };
  payload.nextRenewalDate = calculateNextRenewalDate(payload.lastDeliveryDate, payload);
  return payload;
}

function pushHistory(patient, req, type, text, treatmentId = null, actionDate = "") {
  patient.history.push({
    type,
    text,
    treatmentId,
    createdBy: req.user?._id || null,
    authorName: getActorName(req.user),
    actionDate,
  });
}

async function loadPatient(pharmacyId, patientId) {
  if (!patientId || !isValidObjectId(patientId)) return null;
  return ChronicPatient.findOne({ _id: patientId, pharmacyId });
}

async function listPatients(req, res) {
  try {
    const rows = await ChronicPatient.find({ pharmacyId: req.pharmacyId }).sort({
      updatedAt: -1,
      createdAt: -1,
    });
    const patients = rows.map(toClientPatient);

    return res.status(200).json({
      patients,
      stats: buildStats(patients),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createPatient(req, res) {
  try {
    const payload = normalizePatientPayload(req.body);
    if (!payload.fullName) {
      return res.status(400).json({ error: "Full name is required" });
    }
    if (!payload.phone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    const patient = await ChronicPatient.create({
      pharmacyId: req.pharmacyId,
      ...payload,
      treatments: [],
      history: [
        {
          type: "created",
          text: `Patient chronique ajouté: ${payload.fullName}`,
          createdBy: req.user?._id || null,
          authorName: getActorName(req.user),
          actionDate: toDateOnly(),
        },
      ],
    });

    await logActivity({
      action: "CREATE_CHRONIC_PATIENT",
      description: `Created chronic patient ${payload.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: { chronicPatientId: String(patient._id) },
    });

    return res.status(201).json({
      message: "Chronic patient created successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getPatient(req, res) {
  try {
    const patient = await loadPatient(req.pharmacyId, cleanString(req.params.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Chronic patient not found" });
    }

    return res.status(200).json({ patient: toClientPatient(patient) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updatePatient(req, res) {
  try {
    const patient = await loadPatient(req.pharmacyId, cleanString(req.params.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Chronic patient not found" });
    }

    const appendNote = cleanString(req.body?.appendNote);
    const payload = normalizePatientPayload(req.body, patient);
    if (appendNote) {
      const actionDate = toDateOnly();
      payload.notes = patient.notes
        ? `${patient.notes}\n${actionDate} - ${appendNote}`
        : `${actionDate} - ${appendNote}`;
      pushHistory(patient, req, "note", appendNote, null, actionDate);
    }
    if (!payload.fullName) {
      return res.status(400).json({ error: "Full name is required" });
    }
    if (!payload.phone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    Object.assign(patient, payload);
    pushHistory(patient, req, "updated", `Informations patient mises à jour`, null, toDateOnly());
    await patient.save();

    await logActivity({
      action: "UPDATE_CHRONIC_PATIENT",
      description: `Updated chronic patient ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: { chronicPatientId: String(patient._id) },
    });

    return res.status(200).json({
      message: "Chronic patient updated successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function archivePatient(req, res) {
  try {
    const patient = await loadPatient(req.pharmacyId, cleanString(req.params.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Chronic patient not found" });
    }

    patient.status = "inactive";
    pushHistory(patient, req, "updated", "Patient archivé / inactivé", null, toDateOnly());
    await patient.save();

    await logActivity({
      action: "ARCHIVE_CHRONIC_PATIENT",
      description: `Archived chronic patient ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: { chronicPatientId: String(patient._id) },
    });

    return res.status(200).json({
      message: "Chronic patient archived successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deletePatient(req, res) {
  try {
    const patient = await loadPatient(req.pharmacyId, cleanString(req.params.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Chronic patient not found" });
    }

    const patientId = String(patient._id);
    const fullName = patient.fullName;
    await Task.updateMany(
      { pharmacyId: req.pharmacyId, linkedChronicPatientId: patient._id },
      { $set: { linkedChronicPatientId: null } },
    );
    await ChronicPatient.deleteOne({ _id: patient._id, pharmacyId: req.pharmacyId });

    await logActivity({
      action: "DELETE_CHRONIC_PATIENT",
      description: `Deleted chronic patient ${fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: { chronicPatientId: patientId },
    });

    return res.status(200).json({
      message: "Chronic patient deleted successfully",
      patientId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function addTreatment(req, res) {
  try {
    const patient = await loadPatient(req.pharmacyId, cleanString(req.params.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Chronic patient not found" });
    }

    const payload = normalizeTreatmentPayload(req.body);
    if (!payload.productName) {
      return res.status(400).json({ error: "Product name is required" });
    }
    if (payload.renewalFrequency === "custom" && !payload.customRenewalDays) {
      return res.status(400).json({ error: "Custom renewal days is required" });
    }
    if (!payload.lastDeliveryDate) {
      return res.status(400).json({ error: "Last delivery date is required" });
    }

    patient.treatments.push(payload);
    const treatmentId = patient.treatments[patient.treatments.length - 1]._id;
    pushHistory(
      patient,
      req,
      "treatment_added",
      `Traitement ajouté: ${payload.productName}`,
      treatmentId,
      toDateOnly(),
    );
    await patient.save();

    await logActivity({
      action: "ADD_CHRONIC_TREATMENT",
      description: `Added chronic treatment for ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        chronicPatientId: String(patient._id),
        treatmentId: String(treatmentId),
      },
    });

    return res.status(201).json({
      message: "Treatment added successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updateTreatment(req, res) {
  try {
    const patient = await loadPatient(req.pharmacyId, cleanString(req.params.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Chronic patient not found" });
    }

    const treatment = patient.treatments.id(cleanString(req.params.treatmentId));
    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    const payload = normalizeTreatmentPayload(req.body, treatment);
    if (!payload.productName) {
      return res.status(400).json({ error: "Product name is required" });
    }
    if (payload.renewalFrequency === "custom" && !payload.customRenewalDays) {
      return res.status(400).json({ error: "Custom renewal days is required" });
    }
    if (!payload.lastDeliveryDate) {
      return res.status(400).json({ error: "Last delivery date is required" });
    }

    Object.assign(treatment, payload);
    pushHistory(
      patient,
      req,
      "treatment_updated",
      `Traitement modifié: ${payload.productName}`,
      treatment._id,
      toDateOnly(),
    );
    await patient.save();

    return res.status(200).json({
      message: "Treatment updated successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deleteTreatment(req, res) {
  try {
    const patient = await loadPatient(req.pharmacyId, cleanString(req.params.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Chronic patient not found" });
    }

    const treatment = patient.treatments.id(cleanString(req.params.treatmentId));
    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    const treatmentName = treatment.productName;
    const treatmentId = treatment._id;
    treatment.deleteOne();
    pushHistory(
      patient,
      req,
      "treatment_deleted",
      `Traitement supprimé: ${treatmentName}`,
      treatmentId,
      toDateOnly(),
    );
    await patient.save();

    return res.status(200).json({
      message: "Treatment deleted successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function recordDelivery(req, res) {
  try {
    const patient = await loadPatient(req.pharmacyId, cleanString(req.params.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Chronic patient not found" });
    }

    const treatment = patient.treatments.id(cleanString(req.params.treatmentId));
    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    const deliveredAt = normalizeDateOnly(req.body?.deliveredAt) || toDateOnly();
    const nextRenewalDate = calculateNextRenewalDate(deliveredAt, treatment);
    const note = cleanString(req.body?.note);

    treatment.lastDeliveryDate = deliveredAt;
    treatment.nextRenewalDate = nextRenewalDate;
    if (note) {
      treatment.notes = treatment.notes
        ? `${treatment.notes}\n${note}`
        : note;
    }

    pushHistory(
      patient,
      req,
      "renewal",
      `Renouvellement livré: ${treatment.productName} (prochain: ${nextRenewalDate || "-"})${note ? ` - ${note}` : ""}`,
      treatment._id,
      deliveredAt,
    );
    await patient.save();

    await logActivity({
      action: "RECORD_CHRONIC_RENEWAL",
      description: `Recorded chronic renewal for ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        chronicPatientId: String(patient._id),
        treatmentId: String(treatment._id),
        deliveredAt,
        nextRenewalDate,
      },
    });

    return res.status(200).json({
      message: "Delivery recorded successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function markContacted(req, res) {
  try {
    const patient = await loadPatient(req.pharmacyId, cleanString(req.params.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Chronic patient not found" });
    }

    const note = cleanString(req.body?.note);
    const actionDate = normalizeDateOnly(req.body?.contactedAt) || toDateOnly();
    const storedNote = note || "Patient contacté pour suivi traitement chronique";
    patient.notes = patient.notes
      ? `${patient.notes}\n${actionDate} - ${storedNote}`
      : `${actionDate} - ${storedNote}`;
    pushHistory(
      patient,
      req,
      "contact",
      note ? `Patient contacté: ${note}` : "Patient contacté pour suivi traitement chronique",
      null,
      actionDate,
    );
    await patient.save();

    await logActivity({
      action: "CONTACT_CHRONIC_PATIENT",
      description: `Marked chronic patient contacted ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: { chronicPatientId: String(patient._id) },
    });

    return res.status(200).json({
      message: "Patient contact recorded successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  addTreatment,
  archivePatient,
  createPatient,
  deletePatient,
  deleteTreatment,
  getPatient,
  listPatients,
  markContacted,
  recordDelivery,
  updatePatient,
  updateTreatment,
};

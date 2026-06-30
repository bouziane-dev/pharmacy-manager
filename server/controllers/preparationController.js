const Preparation = require("../models/Preparation");
const {
  cleanSingleLine,
  cleanString,
  isValidObjectId,
} = require("../utils/input");
const { logActivity } = require("../services/activityLogger");

const allowedStatus = new Set(["en_cours", "prepared", "completed"]);

function normalizeStatus(value) {
  const normalized = cleanSingleLine(value).toLowerCase();
  if (!normalized) return null;
  if (normalized === "en cours") return "en_cours";
  if (normalized === "in progress") return "en_cours";
  if (normalized === "in_progress" || normalized === "pending")
    return "en_cours";
  if (normalized === "delivered") return "completed";
  if (normalized === "completed") return "completed";
  return allowedStatus.has(normalized) ? normalized : null;
}

async function nextPreparationId(pharmacyId) {
  const last = await Preparation.findOne({ pharmacyId })
    .sort({ createdAt: -1 })
    .select("preparationId")
    .lean();
  const lastNum = last?.preparationId
    ? parseInt(last.preparationId.replace("PREP-", ""), 10) || 0
    : 0;
  return `PREP-${String(lastNum + 1).padStart(5, "0")}`;
}

function toClientPreparation(doc) {
  return {
    id: String(doc._id),
    pharmacyId: String(doc.pharmacyId),
    createdBy: doc.createdBy ? String(doc.createdBy) : null,
    preparationId: doc.preparationId,
    patientFullname: doc.patientFullname,
    phone: doc.phone,
    composition: doc.composition,
    price: doc.price,
    prescriber: doc.prescriber || "",
    receivedBy: doc.receivedBy,
    preparedBy: doc.preparedBy,
    status: normalizeStatus(doc.status) || "en_cours",
    notes: doc.notes || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildPreparationPayload(inputBody) {
  const payload = {
    patientFullname: cleanSingleLine(inputBody?.patientFullname),
    phone: cleanSingleLine(inputBody?.phone),
    composition: cleanString(inputBody?.composition),
    price: Number(inputBody?.price) || 0,
    prescriber: cleanSingleLine(inputBody?.prescriber),
    receivedBy: cleanSingleLine(inputBody?.receivedBy),
    preparedBy: cleanSingleLine(inputBody?.preparedBy),
    notes: Array.isArray(inputBody?.notes)
      ? inputBody.notes.map(n => ({
          text: cleanString(n.text || ''),
          createdAt: n.createdAt || new Date(),
          createdBy: cleanSingleLine(n.createdBy || '')
        }))
      : [],
    status: normalizeStatus(inputBody?.status) || "en_cours",
  };

  if (!payload.patientFullname) {
    return { error: "Patient fullname is required" };
  }
  if (!payload.phone) {
    return { error: "Phone is required" };
  }
  if (!payload.composition) {
    return { error: "Composition is required" };
  }
  if (payload.status === "prepared" && !payload.preparedBy) {
    return { error: "Prepared by is required when status is prepared" };
  }

  return { payload };
}

async function listPreparations(req, res) {
  try {
    const requestedStatus = normalizeStatus(req.query?.status);
    const filter = { pharmacyId: req.pharmacyId };
    if (requestedStatus) {
      filter.status = requestedStatus;
    }

    const rows = await Preparation.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      preparations: rows.map(toClientPreparation),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getPreparation(req, res) {
  try {
    const preparationId = cleanString(req.params.preparationId);
    if (!preparationId || !isValidObjectId(preparationId)) {
      return res.status(400).json({ error: "Valid preparationId is required" });
    }

    const preparation = await Preparation.findOne({
      _id: preparationId,
      pharmacyId: req.pharmacyId,
    });

    if (!preparation) {
      return res.status(404).json({ error: "Preparation not found" });
    }

    return res.status(200).json({
      preparation: toClientPreparation(preparation),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createPreparation(req, res) {
  try {
    const { payload, error } = buildPreparationPayload(req.body);
    if (error) {
      return res.status(400).json({ error });
    }
    console.log(
      "inside create prep, req is ============ :",
      req.body.pharmacyId,
    );

    const preparation = await Preparation.create({
      ...payload,
      preparationId: await nextPreparationId(req.pharmacyId),
      pharmacyId: req.pharmacyId,
      createdBy: req.user?._id || null,
    });

    await logActivity({
      action: "CREATE_PREPARATION",
      description: `Created preparation: ${preparation.preparationId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        preparationId: String(preparation._id),
        status: payload.status,
      },
    });

    return res.status(201).json({
      message: "Preparation created successfully",
      preparation: toClientPreparation(preparation),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updatePreparation(req, res) {
  try {
    const preparationId = cleanString(req.params.preparationId);
    if (!preparationId || !isValidObjectId(preparationId)) {
      return res.status(400).json({ error: "Valid preparationId is required" });
    }

    const preparation = await Preparation.findOne({
      _id: preparationId,
      pharmacyId: req.pharmacyId,
    });

    if (!preparation) {
      return res.status(404).json({ error: "Preparation not found" });
    }

    const updatableFields = [
      "patientFullname",
      "phone",
      "composition",
      "price",
      "prescriber",
      "preparedBy",
      "notes",
      "status",
    ];

    for (const field of updatableFields) {
      if (req.body[field] === undefined) continue;

      if (field === "status") {
        const normalizedStatus = normalizeStatus(req.body.status);
        if (!normalizedStatus) {
          return res.status(400).json({ error: "Invalid status value" });
        }
        preparation.status = normalizedStatus;
        continue;
      }

      if (field === "notes") {
        preparation.notes = Array.isArray(req.body.notes)
          ? req.body.notes.map(n => ({
              text: cleanString(n.text || ''),
              createdAt: n.createdAt || new Date(),
              createdBy: cleanSingleLine(n.createdBy || '')
            }))
          : [];
        continue;
      }

      if (field === "price") {
        preparation.price = Number(req.body.price) || 0;
        continue;
      }

      const value =
        field === "composition"
          ? cleanString(req.body[field])
          : cleanSingleLine(req.body[field]);

      const isRequiredCoreField =
        field === "patientFullname" ||
        field === "phone" ||
        field === "composition";
      if (isRequiredCoreField && !value) {
        return res.status(400).json({ error: `${field} cannot be empty` });
      }
      preparation[field] = value || "";
    }

    const nextStatus = normalizeStatus(preparation.status) || "en_cours";
    if (nextStatus === "prepared" && !cleanSingleLine(preparation.preparedBy)) {
      return res
        .status(400)
        .json({ error: "Prepared by is required for prepared status" });
    }

    await preparation.save();

    await logActivity({
      action: "UPDATE_PREPARATION",
      description: `Updated preparation ${preparationId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        preparationId,
        status: preparation.status,
      },
    });

    return res.status(200).json({
      message: "Preparation updated successfully",
      preparation: toClientPreparation(preparation),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deletePreparation(req, res) {
  try {
    const preparationId = cleanString(req.params.preparationId);
    if (!preparationId || !isValidObjectId(preparationId)) {
      return res.status(400).json({ error: "Valid preparationId is required" });
    }

    const preparation = await Preparation.findOneAndDelete({
      _id: preparationId,
      pharmacyId: req.pharmacyId,
    });

    if (!preparation) {
      return res.status(404).json({ error: "Preparation not found" });
    }

    await logActivity({
      action: "DELETE_PREPARATION",
      description: `Deleted preparation ${preparationId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        preparationId,
      },
    });

    return res.status(200).json({
      message: "Preparation deleted successfully",
      preparationId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listPreparations,
  getPreparation,
  createPreparation,
  updatePreparation,
  deletePreparation,
};

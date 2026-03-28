const Preparation = require("../models/Preparation");
const {
  cleanSingleLine,
  cleanString,
  isValidObjectId,
} = require("../utils/input");
const { logActivity } = require("../services/activityLogger");

const allowedStatus = new Set(["en_cours", "prepared", "delivered"]);

function normalizeStatus(value) {
  const normalized = cleanSingleLine(value).toLowerCase();
  if (!normalized) return null;
  if (normalized === "en cours") return "en_cours";
  if (normalized === "in progress") return "en_cours";
  if (normalized === "in_progress" || normalized === "pending") return "en_cours";
  if (normalized === "completed") return "delivered";
  return allowedStatus.has(normalized) ? normalized : null;
}

function toClientPreparation(doc) {
  return {
    id: String(doc._id),
    pharmacyId: String(doc.pharmacyId),
    createdBy: doc.createdBy ? String(doc.createdBy) : null,
    preparationType: doc.preparationType,
    composition: doc.composition,
    receivedBy: doc.receivedBy,
    preparedBy: doc.preparedBy,
    deliveredBy: doc.deliveredBy,
    status: normalizeStatus(doc.status) || "en_cours",
    notes: doc.notes || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildPreparationPayload(inputBody) {
  const payload = {
    preparationType: cleanSingleLine(inputBody?.preparationType),
    composition: cleanString(inputBody?.composition),
    receivedBy: cleanSingleLine(inputBody?.receivedBy),
    preparedBy: cleanSingleLine(inputBody?.preparedBy),
    deliveredBy: cleanSingleLine(inputBody?.deliveredBy),
    notes: cleanString(inputBody?.notes),
    status: normalizeStatus(inputBody?.status) || "en_cours",
  };

  if (!payload.preparationType) {
    return { error: "Preparation type is required" };
  }
  if (!payload.composition) {
    return { error: "Composition is required" };
  }
  if (payload.status === "en_cours" && !payload.receivedBy) {
    return { error: "Received by is required when status is en cours" };
  }
  if (payload.status === "prepared" && !payload.preparedBy) {
    return { error: "Prepared by is required when status is prepared" };
  }
  if (payload.status === "delivered" && !payload.deliveredBy) {
    return { error: "Delivered by is required when status is delivered" };
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

async function createPreparation(req, res) {
  try {
    const { payload, error } = buildPreparationPayload(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const preparation = await Preparation.create({
      ...payload,
      pharmacyId: req.pharmacyId,
      createdBy: req.user?._id || null,
    });

    await logActivity({
      action: "CREATE_PREPARATION",
      description: `Created preparation: ${payload.preparationType}`,
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
      "preparationType",
      "composition",
      "receivedBy",
      "preparedBy",
      "deliveredBy",
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
        preparation.notes = cleanString(req.body.notes);
        continue;
      }

      const value =
        field === "composition"
          ? cleanString(req.body[field])
          : cleanSingleLine(req.body[field]);

      const isRequiredCoreField = field === "preparationType" || field === "composition";
      if (isRequiredCoreField && !value) {
        return res.status(400).json({ error: `${field} cannot be empty` });
      }
      preparation[field] = value || "";
    }

    const nextStatus = normalizeStatus(preparation.status) || "en_cours";
    if (nextStatus === "en_cours" && !cleanSingleLine(preparation.receivedBy)) {
      return res.status(400).json({ error: "Received by is required for en cours status" });
    }
    if (nextStatus === "prepared" && !cleanSingleLine(preparation.preparedBy)) {
      return res.status(400).json({ error: "Prepared by is required for prepared status" });
    }
    if (nextStatus === "delivered" && !cleanSingleLine(preparation.deliveredBy)) {
      return res.status(400).json({ error: "Delivered by is required for delivered status" });
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
  createPreparation,
  updatePreparation,
  deletePreparation,
};

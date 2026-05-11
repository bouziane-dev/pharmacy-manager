const Task = require("../models/Task");
const {
  cleanPhoneDigits,
  cleanSingleLine,
  cleanString,
  isValidObjectId,
} = require("../utils/input");
const { logActivity } = require("../services/activityLogger");

const phonePattern = /^\d+$/;
const agendaDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const taskTypeLabels = {
  ordonnance: "Ordonnance a faire passer",
  patient_convoque: "Patient convoque",
  patient_appel: "Patient a appeler",
  autres: "Autre",
};
const typeAliases = {
  ordonnance: "ordonnance",
  ordonnances: "ordonnance",
  ordonnance_a_faire_passer: "ordonnance",
  "ordonnance a faire passer": "ordonnance",
  "ordonnance \u00e0 faire passer": "ordonnance",
  instance: "autres",
  patient_convoque: "patient_convoque",
  patientconvoque: "patient_convoque",
  patient_convoquee: "patient_convoque",
  patientconvoquee: "patient_convoque",
  patient_appel: "patient_appel",
  patientappel: "patient_appel",
  patient_a_appeler: "patient_appel",
  "patient a appeler": "patient_appel",
  "patient \u00e0 appeler": "patient_appel",
  "patient convoque": "patient_convoque",
  "patient convoqu\u00e9": "patient_convoque",
  "patient convoquee": "patient_convoque",
  "patient convoqu\u00e9e": "patient_convoque",
  autres: "autres",
  autre: "autres",
};
const statusAliases = {
  pending: "pending",
  attente: "pending",
  "en attente": "pending",
  in_progress: "pending",
  "in progress": "pending",
  encours: "pending",
  "en cours": "pending",
  done: "done",
  terminee: "done",
  terminees: "done",
  "termin\u00e9e": "done",
  "termin\u00e9es": "done",
  finished: "done",
  cancelled: "pending",
  canceled: "pending",
  annulee: "pending",
  annulees: "pending",
  annule: "pending",
  annules: "pending",
  "annul\u00e9e": "pending",
  "annul\u00e9es": "pending",
  "annul\u00e9": "pending",
  "annul\u00e9s": "pending",
};

function normalizeTaskTypeInput(inputValue) {
  const normalized = cleanSingleLine(inputValue);
  if (!normalized) return null;
  return typeAliases[String(normalized).toLowerCase()] || null;
}

function normalizeTaskStatusInput(inputValue) {
  const normalized = cleanSingleLine(inputValue);
  if (!normalized) return null;
  return statusAliases[String(normalized).toLowerCase()] || null;
}

function getTaskDisplayLabel(type, customTypeLabel = "") {
  if (type === "autres") {
    const label = cleanSingleLine(customTypeLabel);
    return label || taskTypeLabels.autres;
  }

  return taskTypeLabels[type] || type;
}

function toClientTask(taskDoc) {
  return {
    id: String(taskDoc._id),
    pharmacyId: String(taskDoc.pharmacyId),
    type: normalizeTaskTypeInput(taskDoc.type) || "autres",
    customTypeLabel: cleanSingleLine(taskDoc.customTypeLabel),
    displayLabel: getTaskDisplayLabel(
      normalizeTaskTypeInput(taskDoc.type) || "autres",
      taskDoc.customTypeLabel,
    ),
    comment: cleanString(taskDoc.comment),
    patientName: cleanSingleLine(taskDoc.patientName),
    phone: cleanPhoneDigits(taskDoc.phone),
    linkedChronicPatientId: taskDoc.linkedChronicPatientId
      ? String(taskDoc.linkedChronicPatientId)
      : null,
    agendaDate: cleanSingleLine(taskDoc.agendaDate),
    status: normalizeTaskStatusInput(taskDoc.status) || "pending",
    createdAt: taskDoc.createdAt,
    updatedAt: taskDoc.updatedAt,
    createdBy: taskDoc.createdBy?._id ? String(taskDoc.createdBy._id) : null,
    createdByName:
      taskDoc.createdBy?.displayName ||
      taskDoc.createdBy?.name ||
      taskDoc.createdBy?.email ||
      null,
    completedBy: taskDoc.completedBy?._id ? String(taskDoc.completedBy._id) : null,
    completedByName:
      taskDoc.completedBy?.displayName ||
      taskDoc.completedBy?.name ||
      taskDoc.completedBy?.email ||
      null,
    completedAt: taskDoc.completedAt || null,
    comments: (taskDoc.comments || []).map((item) => ({
      id: String(item._id),
      author: item.authorName,
      authorUserId: item.authorUserId ? String(item.authorUserId) : null,
      text: item.text,
      createdAt: item.createdAt,
    })),
  };
}

async function findTaskForWorkspace(taskId, pharmacyId) {
  return Task.findOne({ _id: taskId, pharmacyId })
    .populate("createdBy", "name displayName email")
    .populate("completedBy", "name displayName email");
}

async function listTasks(req, res) {
  try {
    const tasks = await Task.find({ pharmacyId: req.pharmacyId })
      .populate("createdBy", "name displayName email")
      .populate("completedBy", "name displayName email")
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.status(200).json({
      tasks: tasks.map(toClientTask),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createTask(req, res) {
  try {
    const normalizedType = normalizeTaskTypeInput(req.body.type);
    const normalizedCustomTypeLabel = cleanSingleLine(req.body.customTypeLabel);
    const normalizedComment = cleanString(req.body.comment);
    const normalizedPatientName = cleanSingleLine(req.body.patientName);
    const normalizedPhone = cleanPhoneDigits(req.body.phone);
    const normalizedAgendaDate = cleanSingleLine(req.body.agendaDate);
    const linkedChronicPatientId = cleanString(req.body.linkedChronicPatientId);

    if (!normalizedType) {
      return res.status(400).json({ error: "A valid task type is required" });
    }

    if (normalizedType === "autres" && !normalizedCustomTypeLabel) {
      return res
        .status(400)
        .json({ error: "Custom task label is required for autres" });
    }

    if (normalizedPhone && !phonePattern.test(normalizedPhone)) {
      return res.status(400).json({ error: "Phone must contain digits only" });
    }
    if (normalizedAgendaDate && !agendaDatePattern.test(normalizedAgendaDate)) {
      return res.status(400).json({ error: "Agenda date must be YYYY-MM-DD" });
    }
    if (linkedChronicPatientId && !isValidObjectId(linkedChronicPatientId)) {
      return res.status(400).json({ error: "linkedChronicPatientId is invalid" });
    }

    const task = await Task.create({
      pharmacyId: req.pharmacyId,
      createdBy: req.user._id,
      type: normalizedType,
      customTypeLabel:
        normalizedType === "autres" ? normalizedCustomTypeLabel : "",
      comment: normalizedComment,
      patientName: normalizedPatientName,
      phone: normalizedPhone,
      linkedChronicPatientId: linkedChronicPatientId || null,
      agendaDate: normalizedAgendaDate,
      status: "pending",
      comments: [],
    });

    const populatedTask = await findTaskForWorkspace(task._id, req.pharmacyId);

    await logActivity({
      action: "CREATE_TASK",
      description: `Created task ${getTaskDisplayLabel(
        normalizedType,
        normalizedCustomTypeLabel,
      )}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        taskId: String(task._id),
        type: normalizedType,
        linkedChronicPatientId: linkedChronicPatientId || null,
        status: "pending",
      },
    });

    return res.status(201).json({
      message: "Task created successfully",
      task: toClientTask(populatedTask),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updateTask(req, res) {
  try {
    const taskId = cleanString(req.params.taskId);
    if (!taskId || !isValidObjectId(taskId)) {
      return res.status(400).json({ error: "Valid taskId is required" });
    }

    const task = await findTaskForWorkspace(taskId, req.pharmacyId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const previousStatus = normalizeTaskStatusInput(task.status) || "pending";
    const nextType =
      req.body.type !== undefined
        ? normalizeTaskTypeInput(req.body.type)
        : normalizeTaskTypeInput(task.type) || "autres";

    if (!nextType) {
      return res.status(400).json({ error: "A valid task type is required" });
    }

    const nextCustomTypeLabel =
      req.body.customTypeLabel !== undefined
        ? cleanSingleLine(req.body.customTypeLabel)
        : cleanSingleLine(task.customTypeLabel);
    if (nextType === "autres" && !nextCustomTypeLabel) {
      return res
        .status(400)
        .json({ error: "Custom task label is required for autres" });
    }

    const nextStatus =
      req.body.status !== undefined
        ? normalizeTaskStatusInput(req.body.status)
        : previousStatus;
    if (!nextStatus) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    if (req.body.comment !== undefined) {
      task.comment = cleanString(req.body.comment);
    }

    if (req.body.patientName !== undefined) {
      task.patientName = cleanSingleLine(req.body.patientName);
    }

    if (req.body.phone !== undefined) {
      const normalizedPhone = cleanPhoneDigits(req.body.phone);
      if (normalizedPhone && !phonePattern.test(normalizedPhone)) {
        return res.status(400).json({ error: "Phone must contain digits only" });
      }
      task.phone = normalizedPhone;
    }

    if (req.body.linkedChronicPatientId !== undefined) {
      const linkedChronicPatientId = cleanString(req.body.linkedChronicPatientId);
      if (linkedChronicPatientId && !isValidObjectId(linkedChronicPatientId)) {
        return res.status(400).json({ error: "linkedChronicPatientId is invalid" });
      }
      task.linkedChronicPatientId = linkedChronicPatientId || null;
    }

    if (req.body.agendaDate !== undefined) {
      const normalizedAgendaDate = cleanSingleLine(req.body.agendaDate);
      if (normalizedAgendaDate && !agendaDatePattern.test(normalizedAgendaDate)) {
        return res.status(400).json({ error: "Agenda date must be YYYY-MM-DD" });
      }
      task.agendaDate = normalizedAgendaDate;
    }

    task.type = nextType;
    task.customTypeLabel = nextType === "autres" ? nextCustomTypeLabel : "";
    task.status = nextStatus;

    if (nextStatus === "done" && previousStatus !== "done") {
      task.completedAt = new Date();
      task.completedBy = req.user._id;
    } else if (nextStatus !== "done") {
      task.completedAt = null;
      task.completedBy = null;
    }

    await task.save();
    await task.populate("createdBy", "name displayName email");
    await task.populate("completedBy", "name displayName email");

    const statusChanged = previousStatus !== nextStatus;
    await logActivity({
      action: statusChanged ? "UPDATE_TASK_STATUS" : "UPDATE_TASK",
      description: statusChanged
        ? `Updated task ${taskId} status from ${previousStatus} to ${nextStatus}`
        : `Updated task ${taskId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        taskId,
        oldStatus: previousStatus,
        newStatus: nextStatus,
        type: nextType,
      },
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task: toClientTask(task),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function addTaskComment(req, res) {
  try {
    const taskId = cleanString(req.params.taskId);
    const normalizedText = cleanString(req.body.text);

    if (!taskId || !isValidObjectId(taskId)) {
      return res.status(400).json({ error: "Valid taskId is required" });
    }

    if (!normalizedText) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const task = await findTaskForWorkspace(taskId, req.pharmacyId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.comments.push({
      authorUserId: req.user._id,
      authorName: req.user.displayName || req.user.name || req.user.email || "Staff",
      text: normalizedText,
    });

    await task.save();
    await task.populate("createdBy", "name displayName email");
    await task.populate("completedBy", "name displayName email");

    await logActivity({
      action: "ADD_TASK_COMMENT",
      description: `Added comment on task ${taskId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        taskId,
        commentId: String(task.comments[task.comments.length - 1]?._id || ""),
      },
    });

    return res.status(200).json({
      message: "Task comment added successfully",
      task: toClientTask(task),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deleteTask(req, res) {
  try {
    const taskId = cleanString(req.params.taskId);
    if (!taskId || !isValidObjectId(taskId)) {
      return res.status(400).json({ error: "Valid taskId is required" });
    }

    const task = await Task.findOneAndDelete({
      _id: taskId,
      pharmacyId: req.pharmacyId,
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await logActivity({
      action: "DELETE_TASK",
      description: `Deleted task ${taskId}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        taskId,
        type: normalizeTaskTypeInput(task.type) || "autres",
      },
    });

    return res.status(200).json({
      message: "Task deleted successfully",
      taskId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  addTaskComment,
  deleteTask,
};

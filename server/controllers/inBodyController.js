const Patient = require("../models/Patient");
const InBodyTest = require("../models/InBodyTest");
const {
  cleanEmail,
  cleanPhoneDigits,
  cleanSingleLine,
  cleanString,
  isValidEmail,
  isValidObjectId,
} = require("../utils/input");
const { logActivity } = require("../services/activityLogger");

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function toClientPatient(doc) {
  return {
    id: String(doc._id),
    pharmacyId: String(doc.pharmacyId),
    patientId: doc.patientId,
    fullName: doc.fullName,
    email: doc.email || "",
    dateOfBirth: doc.dateOfBirth,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toClientTest(doc, patient) {
  return {
    id: String(doc._id),
    pharmacyId: String(doc.pharmacyId),
    patientId: String(doc.patientId),
    patientReference: patient?.patientId || "",
    testData: doc.testData && typeof doc.testData === "object" ? doc.testData : {},
    notes: doc.notes || "",
    testedAt: doc.testedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function listPatients(req, res) {
  try {
    const rows = await Patient.find({ pharmacyId: req.pharmacyId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      patients: rows.map(toClientPatient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createPatient(req, res) {
  try {
    const patientId = cleanPhoneDigits(req.body?.patientId);
    const fullName = cleanSingleLine(req.body?.fullName);
    const email = cleanEmail(req.body?.email);
    const dateOfBirth = cleanString(req.body?.dateOfBirth);

    if (!patientId) {
      return res.status(400).json({ error: "Patient ID is required" });
    }
    if (!fullName) {
      return res.status(400).json({ error: "Full name is required" });
    }
    if (!dateOfBirth) {
      return res.status(400).json({ error: "Date of birth is required" });
    }
    if (!datePattern.test(dateOfBirth)) {
      return res.status(400).json({ error: "Date of birth must be YYYY-MM-DD" });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: "Email is invalid" });
    }

    const patient = await Patient.create({
      pharmacyId: req.pharmacyId,
      patientId,
      fullName,
      email,
      dateOfBirth,
    });

    await logActivity({
      action: "CREATE_PATIENT",
      description: `Created patient ${fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        patientDbId: String(patient._id),
        patientId,
      },
    });

    return res.status(201).json({
      message: "Patient created successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "Patient ID already exists" });
    }
    return res.status(500).json({ error: error.message });
  }
}

async function loadPatientForWorkspace(pharmacyId, patientRecordId) {
  if (!patientRecordId || !isValidObjectId(patientRecordId)) {
    return null;
  }

  return Patient.findOne({
    _id: patientRecordId,
    pharmacyId,
  });
}

async function listPatientTests(req, res) {
  try {
    const patientRecordId = cleanString(req.params.patientId);
    const patient = await loadPatientForWorkspace(req.pharmacyId, patientRecordId);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const rows = await InBodyTest.find({
      pharmacyId: req.pharmacyId,
      patientId: patient._id,
    }).sort({ testedAt: -1, createdAt: -1 });

    return res.status(200).json({
      tests: rows.map((item) => toClientTest(item, patient)),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createPatientTest(req, res) {
  try {
    const patientRecordId = cleanString(req.params.patientId);
    const patient = await loadPatientForWorkspace(req.pharmacyId, patientRecordId);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const testData = req.body?.testData;
    const notes = cleanString(req.body?.notes);
    const testedAtRaw = cleanString(req.body?.testedAt);

    if (!testData || typeof testData !== "object" || Array.isArray(testData)) {
      return res.status(400).json({ error: "testData must be a JSON object" });
    }

    let testedAt = null;
    if (testedAtRaw) {
      const parsedDate = new Date(testedAtRaw);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "testedAt must be a valid date" });
      }
      testedAt = parsedDate;
    }

    const test = await InBodyTest.create({
      pharmacyId: req.pharmacyId,
      patientId: patient._id,
      testData,
      notes,
      testedAt: testedAt || new Date(),
      createdBy: req.user?._id || null,
    });

    await logActivity({
      action: "CREATE_INBODY_TEST",
      description: `Added InBody test for ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        patientDbId: String(patient._id),
        testId: String(test._id),
      },
    });

    return res.status(201).json({
      message: "InBody test created successfully",
      test: toClientTest(test, patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listPatients,
  createPatient,
  listPatientTests,
  createPatientTest,
};

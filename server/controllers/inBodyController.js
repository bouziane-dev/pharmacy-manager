const Patient = require("../models/Patient");
const InBodyTest = require("../models/InBodyTest");
const User = require("../models/User");
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
const SUBSCRIPTION_MODES = new Set(["replace", "topup"]);

function toFiniteMetric(value) {
  if (value === null || typeof value === "undefined") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function normalizeSubscription(subscription) {
  const totalSessions = Math.max(
    0,
    Math.round(Number(subscription?.totalSessions || 0)),
  );
  const remainingSessions = Math.max(
    0,
    Math.round(Number(subscription?.remainingSessions || 0)),
  );

  return {
    totalSessions,
    remainingSessions: Math.min(totalSessions, remainingSessions),
    updatedAt: subscription?.updatedAt || null,
  };
}

function toClientPatient(doc, overrides = {}) {
  const subscription = normalizeSubscription(doc.subscription);

  return {
    id: String(doc._id),
    pharmacyId: String(doc.pharmacyId),
    patientId: doc.patientId,
    phone: doc.phone || doc.patientId,
    fullName: doc.fullName,
    email: doc.email || "",
    dateOfBirth: doc.dateOfBirth || "",
    subscription,
    lastInBodyTestAt:
      overrides.lastInBodyTestAt || doc.lastInBodyTestAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toClientTest(doc, patient) {
  const safeData =
    doc.testData && typeof doc.testData === "object" ? doc.testData : {};

  const operator =
    cleanSingleLine(doc.operator || safeData.operator || safeData.operateur) || "";

  const weight = toFiniteMetric(doc.weight ?? safeData.weight ?? safeData.poids);
  const bodyFat = toFiniteMetric(
    doc.bodyFat ?? safeData.bodyFat ?? safeData.masseGrasse,
  );
  const muscleMass = toFiniteMetric(
    doc.muscleMass ?? safeData.muscleMass ?? safeData.masseMusculaire,
  );
  const bmi = toFiniteMetric(doc.bmi ?? safeData.bmi ?? safeData.imc);
  const bodyWater = toFiniteMetric(
    doc.bodyWater ?? safeData.bodyWater ?? safeData.eauCorporelle,
  );

  return {
    id: String(doc._id),
    pharmacyId: String(doc.pharmacyId),
    patientId: String(doc.patientId),
    patientReference: patient?.patientId || "",
    operator,
    weight,
    bodyFat,
    muscleMass,
    bmi,
    bodyWater,
    testData: safeData,
    notes: doc.notes || "",
    testedAt: doc.testedAt,
    consumedSession: !!doc.consumedSession,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function listPatients(req, res) {
  try {
    const [rows, latestTests] = await Promise.all([
      Patient.find({ pharmacyId: req.pharmacyId }).sort({ createdAt: -1 }),
      InBodyTest.aggregate([
        { $match: { pharmacyId: req.pharmacyId } },
        { $sort: { testedAt: -1, createdAt: -1 } },
        {
          $group: {
            _id: "$patientId",
            lastInBodyTestAt: { $first: "$testedAt" },
          },
        },
      ]),
    ]);

    const latestByPatientId = new Map(
      latestTests.map((item) => [String(item._id), item.lastInBodyTestAt || null]),
    );

    return res.status(200).json({
      patients: rows.map((item) =>
        toClientPatient(item, {
          lastInBodyTestAt:
            latestByPatientId.get(String(item._id)) || item.lastInBodyTestAt || null,
        }),
      ),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getOverviewStats(req, res) {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const startOfWeek = new Date(startOfToday);
    const dayOfWeek = startOfWeek.getDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    const [
      totalPatients,
      testsToday,
      testsThisMonth,
      activeSubscriptions,
      staffUsers,
      staffTestCounts,
    ] =
      await Promise.all([
        Patient.countDocuments({ pharmacyId: req.pharmacyId }),
        InBodyTest.countDocuments({
          pharmacyId: req.pharmacyId,
          testedAt: { $gte: startOfToday },
        }),
        InBodyTest.countDocuments({
          pharmacyId: req.pharmacyId,
          testedAt: { $gte: startOfMonth },
        }),
        Patient.countDocuments({
          pharmacyId: req.pharmacyId,
          "subscription.remainingSessions": { $gt: 0 },
        }),
        User.find({
          pharmacyId: req.pharmacyId,
          role: "staff",
        })
          .select("_id name displayName staffRole isActive")
          .sort({ name: 1, displayName: 1 }),
        InBodyTest.aggregate([
          {
            $match: {
              pharmacyId: req.pharmacyId,
              createdBy: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$createdBy",
              testsToday: {
                $sum: {
                  $cond: [{ $gte: ["$testedAt", startOfToday] }, 1, 0],
                },
              },
              testsThisWeek: {
                $sum: {
                  $cond: [{ $gte: ["$testedAt", startOfWeek] }, 1, 0],
                },
              },
              testsThisMonth: {
                $sum: {
                  $cond: [{ $gte: ["$testedAt", startOfMonth] }, 1, 0],
                },
              },
              testsThisYear: {
                $sum: {
                  $cond: [{ $gte: ["$testedAt", startOfYear] }, 1, 0],
                },
              },
              totalTests: { $sum: 1 },
            },
          },
        ]),
      ]);

    const countsByUserId = new Map(
      staffTestCounts.map((item) => [
        String(item._id),
        {
          testsToday: item.testsToday || 0,
          testsThisWeek: item.testsThisWeek || 0,
          testsThisMonth: item.testsThisMonth || 0,
          testsThisYear: item.testsThisYear || 0,
          totalTests: item.totalTests || 0,
        },
      ]),
    );

    const staffPerformance = staffUsers.map((staffUser) => {
      const counts = countsByUserId.get(String(staffUser._id)) || {
        testsToday: 0,
        testsThisWeek: 0,
        testsThisMonth: 0,
        testsThisYear: 0,
        totalTests: 0,
      };

      return {
        id: String(staffUser._id),
        name: cleanSingleLine(staffUser.displayName || staffUser.name) || "Unknown",
        role: cleanSingleLine(staffUser.staffRole || "staff") || "staff",
        isActive: staffUser.isActive !== false,
        ...counts,
      };
    });

    return res.status(200).json({
      stats: {
        totalPatients,
        testsToday,
        testsThisMonth,
        activeSubscriptions,
        staffPerformance,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createPatient(req, res) {
  try {
    const patientId = cleanPhoneDigits(req.body?.patientId || req.body?.phone);
    const phone = cleanPhoneDigits(req.body?.phone) || patientId;
    const fullName = cleanSingleLine(req.body?.fullName);
    const email = cleanEmail(req.body?.email);
    const dateOfBirth = cleanString(req.body?.dateOfBirth);

    if (!patientId) {
      return res.status(400).json({ error: "Patient ID is required" });
    }
    if (!fullName) {
      return res.status(400).json({ error: "Full name is required" });
    }
    if (dateOfBirth && !datePattern.test(dateOfBirth)) {
      return res.status(400).json({ error: "Date of birth must be YYYY-MM-DD" });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: "Email is invalid" });
    }

    const patient = await Patient.create({
      pharmacyId: req.pharmacyId,
      patientId,
      phone,
      fullName,
      email,
      dateOfBirth,
      subscription: {
        totalSessions: 0,
        remainingSessions: 0,
        updatedAt: null,
      },
      lastInBodyTestAt: null,
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

async function getPatientProfile(req, res) {
  try {
    const patientRecordId = cleanString(req.params.patientId);
    const patient = await loadPatientForWorkspace(req.pharmacyId, patientRecordId);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const latestTest = await InBodyTest.findOne({
      pharmacyId: req.pharmacyId,
      patientId: patient._id,
    }).sort({ testedAt: -1, createdAt: -1 });

    return res.status(200).json({
      patient: toClientPatient(patient, {
        lastInBodyTestAt: latestTest?.testedAt || patient.lastInBodyTestAt || null,
      }),
      latestTest: latestTest ? toClientTest(latestTest, patient) : null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updatePatientSubscription(req, res) {
  try {
    const patientRecordId = cleanString(req.params.patientId);
    const patient = await loadPatientForWorkspace(req.pharmacyId, patientRecordId);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const parsedTotal = Number(req.body?.totalSessions);
    const totalSessions = Math.round(parsedTotal);

    if (!Number.isFinite(totalSessions) || totalSessions <= 0 || totalSessions > 500) {
      return res.status(400).json({
        error: "totalSessions must be a number between 1 and 500",
      });
    }

    // We support two modes so teams can either replace the package or add more sessions.
    const modeRaw = cleanString(req.body?.mode).toLowerCase();
    const mode = SUBSCRIPTION_MODES.has(modeRaw) ? modeRaw : "replace";

    const currentSubscription = normalizeSubscription(patient.subscription);
    const updatedAt = new Date();

    if (mode === "topup") {
      const nextTotal = Math.min(500, currentSubscription.totalSessions + totalSessions);
      const nextRemaining = Math.min(
        nextTotal,
        currentSubscription.remainingSessions + totalSessions,
      );

      patient.subscription = {
        totalSessions: nextTotal,
        remainingSessions: nextRemaining,
        updatedAt,
      };
    } else {
      patient.subscription = {
        totalSessions,
        remainingSessions: totalSessions,
        updatedAt,
      };
    }

    await patient.save();

    await logActivity({
      action: "UPDATE_INBODY_SUBSCRIPTION",
      description: `Updated InBody sessions for ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        patientDbId: String(patient._id),
        totalSessions: patient.subscription.totalSessions,
        remainingSessions: patient.subscription.remainingSessions,
        mode,
      },
    });

    return res.status(200).json({
      message: "Subscription updated successfully",
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
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
  let test = null;

  try {
    const patientRecordId = cleanString(req.params.patientId);
    const patient = await loadPatientForWorkspace(req.pharmacyId, patientRecordId);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const rawTestData =
      req.body?.testData &&
      typeof req.body.testData === "object" &&
      !Array.isArray(req.body.testData)
        ? req.body.testData
        : {};

    const notes = cleanString(req.body?.notes);
    const testedAtRaw = cleanString(req.body?.testedAt || req.body?.testDate);
    const operator = cleanSingleLine(
      req.body?.operator || rawTestData.operator || rawTestData.operateur,
    );

    const weight = toFiniteMetric(req.body?.weight ?? rawTestData.weight ?? rawTestData.poids);
    const bodyFat = toFiniteMetric(
      req.body?.bodyFat ?? rawTestData.bodyFat ?? rawTestData.masseGrasse,
    );
    const muscleMass = toFiniteMetric(
      req.body?.muscleMass ??
        rawTestData.muscleMass ??
        rawTestData.masseMusculaire,
    );
    const bmi = toFiniteMetric(req.body?.bmi ?? rawTestData.bmi ?? rawTestData.imc);
    const bodyWater = toFiniteMetric(
      req.body?.bodyWater ?? rawTestData.bodyWater ?? rawTestData.eauCorporelle,
    );

    if ([weight, bodyFat, muscleMass, bmi, bodyWater].every((value) => value === null)) {
      return res.status(400).json({
        error: "At least one body composition metric is required",
      });
    }

    let testedAt = null;
    if (testedAtRaw) {
      const parsedDate = new Date(testedAtRaw);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "testedAt must be a valid date" });
      }
      testedAt = parsedDate;
    }

    const subscription = normalizeSubscription(patient.subscription);
    // Tests are always allowed. We only consume a session when one is available.
    const consumedSession = subscription.remainingSessions > 0;
    if (consumedSession) {
      patient.subscription = {
        totalSessions: subscription.totalSessions,
        remainingSessions: Math.max(0, subscription.remainingSessions - 1),
        updatedAt: new Date(),
      };
    }

    const normalizedTestData = {
      ...rawTestData,
      ...(operator ? { operator } : {}),
      ...(weight !== null ? { weight } : {}),
      ...(bodyFat !== null ? { bodyFat } : {}),
      ...(muscleMass !== null ? { muscleMass } : {}),
      ...(bmi !== null ? { bmi } : {}),
      ...(bodyWater !== null ? { bodyWater } : {}),
    };

    test = await InBodyTest.create({
      pharmacyId: req.pharmacyId,
      patientId: patient._id,
      testData: normalizedTestData,
      operator,
      weight,
      bodyFat,
      muscleMass,
      bmi,
      bodyWater,
      notes,
      testedAt: testedAt || new Date(),
      createdBy: req.user?._id || null,
      consumedSession,
    });

    patient.lastInBodyTestAt = test.testedAt;
    await patient.save();

    await logActivity({
      action: "CREATE_INBODY_TEST",
      description: `Added InBody test for ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        patientDbId: String(patient._id),
        testId: String(test._id),
        consumedSession,
      },
    });

    return res.status(201).json({
      message: "InBody test created successfully",
      patient: toClientPatient(patient),
      test: toClientTest(test, patient),
    });
  } catch (error) {
    if (test?._id) {
      await InBodyTest.deleteOne({ _id: test._id }).catch(() => null);
    }
    return res.status(500).json({ error: error.message });
  }
}

async function deletePatientTest(req, res) {
  try {
    const patientRecordId = cleanString(req.params.patientId);
    const testId = cleanString(req.params.testId);

    if (!isValidObjectId(testId)) {
      return res.status(400).json({ error: "Invalid test ID" });
    }

    const patient = await loadPatientForWorkspace(req.pharmacyId, patientRecordId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const test = await InBodyTest.findOne({
      _id: testId,
      pharmacyId: req.pharmacyId,
      patientId: patient._id,
    });

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    await InBodyTest.deleteOne({ _id: test._id });

    const subscription = normalizeSubscription(patient.subscription);
    if (test.consumedSession && subscription.totalSessions > 0) {
      patient.subscription = {
        totalSessions: subscription.totalSessions,
        remainingSessions: Math.min(
          subscription.totalSessions,
          subscription.remainingSessions + 1,
        ),
        updatedAt: new Date(),
      };
    }

    const latestTest = await InBodyTest.findOne({
      pharmacyId: req.pharmacyId,
      patientId: patient._id,
    }).sort({ testedAt: -1, createdAt: -1 });

    patient.lastInBodyTestAt = latestTest?.testedAt || null;
    await patient.save();

    await logActivity({
      action: "DELETE_INBODY_TEST",
      description: `Deleted an InBody test for ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        patientDbId: String(patient._id),
        testId,
      },
    });

    return res.status(200).json({
      message: "InBody test deleted successfully",
      deletedTestId: testId,
      patient: toClientPatient(patient),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deletePatient(req, res) {
  try {
    const patientRecordId = cleanString(req.params.patientId);
    const patient = await loadPatientForWorkspace(req.pharmacyId, patientRecordId);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const deletedTests = await InBodyTest.deleteMany({
      pharmacyId: req.pharmacyId,
      patientId: patient._id,
    });

    await Patient.deleteOne({ _id: patient._id });

    await logActivity({
      action: "DELETE_PATIENT",
      description: `Deleted patient ${patient.fullName}`,
      userId: req.user._id,
      pharmacyId: req.pharmacyId,
      metadata: {
        patientDbId: String(patient._id),
        deletedTests: deletedTests?.deletedCount || 0,
      },
    });

    return res.status(200).json({
      message: "Patient deleted successfully",
      patientId: String(patient._id),
      deletedTests: deletedTests?.deletedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listPatients,
  getOverviewStats,
  createPatient,
  getPatientProfile,
  updatePatientSubscription,
  listPatientTests,
  createPatientTest,
  deletePatientTest,
  deletePatient,
};


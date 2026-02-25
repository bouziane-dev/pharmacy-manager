const Pharmacy = require("../models/Pharmacy");
const Membership = require("../models/Membership");
const User = require("../models/User");

async function createPharmacy(req, res) {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Pharmacy name is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.primaryRole !== "owner") {
      return res
        .status(403)
        .json({ error: "Only owners can create a pharmacy workspace" });
    }

    if (!user.subscriptionActive) {
      return res.status(403).json({
        error: "An active subscription is required before pharmacy creation",
      });
    }

    const pharmacy = await Pharmacy.create({
      name: String(name).trim(),
      ownerUserId: user._id,
      subscriptionStatus: "active",
    });

    await Membership.create({
      userId: user._id,
      pharmacyId: pharmacy._id,
      role: "owner",
    });

    return res.status(201).json({
      message: "Pharmacy created successfully",
      pharmacy,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createPharmacy,
};

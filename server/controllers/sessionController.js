const Membership = require("../models/Membership");
const Pharmacy = require("../models/Pharmacy");

async function getBootstrapSession(req, res) {
  try {
    const workspaceMap = new Map();
    const membershipItems = [];

    if (req.user.pharmacyId) {
      const directPharmacy = await Pharmacy.findById(req.user.pharmacyId).select(
        "_id name subdomain ownerId ownerUserId subscriptionStatus isActive"
      );
      if (directPharmacy) {
        workspaceMap.set(String(directPharmacy._id), {
          id: directPharmacy._id,
          name: directPharmacy.name,
          subdomain: directPharmacy.subdomain,
          ownerUserId: directPharmacy.ownerId || directPharmacy.ownerUserId,
          subscriptionStatus: directPharmacy.subscriptionStatus,
          isActive: directPharmacy.isActive,
        });
        membershipItems.push({
          id: `direct-${req.user._id.toString()}`,
          pharmacyId: directPharmacy._id,
          role: req.user.role === "owner" ? "owner" : "pharmacist",
        });
      }
    }

    const memberships = await Membership.find({ userId: req.user._id })
      .populate("pharmacyId")
      .sort({ createdAt: 1 });

    memberships
      .filter((item) => item.pharmacyId)
      .forEach((item) => {
        const pharmacy = item.pharmacyId;
        workspaceMap.set(String(pharmacy._id), {
          id: pharmacy._id,
          name: pharmacy.name,
          subdomain: pharmacy.subdomain,
          ownerUserId: pharmacy.ownerId || pharmacy.ownerUserId,
          subscriptionStatus: pharmacy.subscriptionStatus,
          isActive: pharmacy.isActive,
        });
        membershipItems.push({
          id: item._id,
          pharmacyId: pharmacy._id,
          role: item.role,
        });
      });

    const uniqueMemberships = membershipItems.filter(
      (item, index, arr) =>
        arr.findIndex((candidate) => String(candidate.pharmacyId) === String(item.pharmacyId)) ===
        index
    );

    return res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name || req.user.displayName || req.user.email,
        email: req.user.email,
        displayName: req.user.displayName || req.user.name || "",
        picture: req.user.picture,
        onboardingCompleted: req.user.onboardingCompleted,
        primaryRole: req.user.primaryRole,
        subscriptionActive: req.user.subscriptionActive,
        role: req.user.role,
        staffRole: req.user.staffRole,
        pharmacyId: req.user.pharmacyId,
        isActive: req.user.isActive,
      },
      memberships: uniqueMemberships,
      workspaces: Array.from(workspaceMap.values()),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getBootstrapSession,
};

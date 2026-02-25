const Membership = require("../models/Membership");

async function getBootstrapSession(req, res) {
  try {
    const memberships = await Membership.find({ userId: req.user._id })
      .populate("pharmacyId")
      .sort({ createdAt: 1 });

    const workspaceMap = new Map();
    const membershipItems = memberships
      .filter((item) => item.pharmacyId)
      .map((item) => {
        const pharmacy = item.pharmacyId;
        workspaceMap.set(String(pharmacy._id), {
          id: pharmacy._id,
          name: pharmacy.name,
          ownerUserId: pharmacy.ownerUserId,
          subscriptionStatus: pharmacy.subscriptionStatus,
        });
        return {
          id: item._id,
          pharmacyId: pharmacy._id,
          role: item.role,
        };
      });

    return res.status(200).json({
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
        picture: req.user.picture,
        onboardingCompleted: req.user.onboardingCompleted,
        primaryRole: req.user.primaryRole,
        subscriptionActive: req.user.subscriptionActive,
      },
      memberships: membershipItems,
      workspaces: Array.from(workspaceMap.values()),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getBootstrapSession,
};

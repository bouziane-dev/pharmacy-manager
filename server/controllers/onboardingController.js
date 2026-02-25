const User = require("../models/User");

async function chooseRole(req, res) {
  try {
    const { role } = req.body;

    if (!["owner", "pharmacist"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Allowed values are owner or pharmacist",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.primaryRole = role;
    user.onboardingCompleted = true;
    await user.save();

    // Flow hint for frontend routing after role selection.
    const nextStep = role === "owner" ? "subscription" : "pending_invitations";

    return res.status(200).json({
      message: "Role saved successfully",
      user: {
        id: user._id,
        email: user.email,
        primaryRole: user.primaryRole,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionActive: user.subscriptionActive,
      },
      nextStep,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  chooseRole,
  activateSubscription: async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.primaryRole !== "owner") {
        return res
          .status(403)
          .json({ error: "Only owners can activate subscriptions" });
      }

      user.subscriptionActive = true;
      await user.save();

      return res.status(200).json({
        message: "Subscription activated",
        subscriptionActive: user.subscriptionActive,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};


import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { sendEmail } from "../config/subscribeEmail.js";
import cron from "node-cron";

/**
 * 📌 Create or Renew Subscription
 **/
export const createOrRenewSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType } = req.body;

    // Prices for each plan
    const planPrices = { Free: 3.5, Standard: 7.5, Premium: 13.5 };

    // Normalize planType to match schema enum (capitalize first letter)
    const key = planType.charAt(0).toUpperCase() + planType.slice(1).toLowerCase();

    if (!(key in planPrices)) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    const startDate = new Date();
    let endDate = new Date();

    // Free plan = 3.5 days, Paid plans = 1 month
    if (key === "Free") {
      endDate = new Date(startDate.getTime() + 3.5 * 24 * 60 * 60 * 1000); // 3.5 days
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    let subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.planType = key;
      subscription.price = planPrices[key];
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.isActive = true;
    } else {
      subscription = new Subscription({
        userId,
        planType: key,
        price: planPrices[key],
        startDate,
        endDate,
        isActive: true,
      });
    }

    await subscription.save();

    const user = await User.findById(userId);
    if (user?.email) {
      const expiryText =
        key === "Free"
          ? "with unlimited access for 3.5 days 🎉"
          : `until <b>${endDate.toDateString()}</b>`;

      await sendEmail(
        user.email,
        "Subscription Confirmation - CMwood",
        `<h2>Hello ${user.username},</h2>
         <p>Your <b>${key}</b> subscription is now active ${expiryText}.</p>
         <p>Enjoy unlimited movies! 🎬</p>`
      );
    }

    res.status(200).json({
      message: "Subscription created/renewed successfully",
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/**
 * 📌 Middleware: Check Active Subscription
 */
export const checkSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });

    if (!subscription || !subscription.isActive || subscription.endDate < new Date()) {
      if (subscription && subscription.endDate < new Date()) {
        subscription.isActive = false;
        await subscription.save();
      }
      return res.status(403).json({ message: "Access denied. Please subscribe or renew." });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * 📌 Get Current User Subscription
 */
export const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) return res.status(404).json({ message: "No subscription found" });
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * 📌 CRON JOB: Send Expiry Reminder Emails Daily at 9 AM
 */
cron.schedule("0 9 * * *", async () => {
  console.log("🔔 Checking subscriptions for expiry reminders...");
  const now = new Date();
  const threeDaysLater = new Date(now);
  threeDaysLater.setDate(now.getDate() + 3);

  const expiringSubs = await Subscription.find({ endDate: { $gte: now, $lte: threeDaysLater }, isActive: true });
  for (const sub of expiringSubs) {
    const user = await User.findById(sub.userId);
    if (user?.email) {
await sendEmail(
  user.email,
  "Your Subscription is Expiring Soon - CMwood",
  `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #f9f9f9;">
    <h2 style="color: #0070f3;">Hello ${user.username},</h2>
    <p style="font-size: 16px;">
      We hope you are enjoying your time with <strong>CMwood 🎬</strong>.
    </p>
    <p style="font-size: 16px;">
      Your <strong>${sub.planType}</strong> subscription is set to expire on 
      <strong>${sub.endDate.toDateString()}</strong>.
    </p>
    <p style="font-size: 16px; color: #555;">
      To continue watching your favorite movies and series without interruption, please renew your subscription before it expires.
    </p>
    <a href="https://cmwood.com/renew" 
       style="display: inline-block; margin-top: 15px; padding: 12px 25px; background-color: #0070f3; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
       Renew Subscription
    </a>
    <p style="font-size: 14px; color: #999; margin-top: 20px;">
      Thank you for being a valued member of CMwood 🎬.
    </p>
  </div>
  `
);

    }
  }
});

/**
 * 📌 CRON JOB: Auto Deactivate Expired Subscriptions Daily at Midnight
 */
cron.schedule("0 0 * * *", async () => {
  console.log("⚡ Auto-deactivating expired subscriptions...");
  await Subscription.updateMany({ endDate: { $lt: new Date() }, isActive: true }, { isActive: false });
});

/**
 * 📌 Renew Subscription
 */
export const renewSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType } = req.body;
    const planPrices = { Free: 3.5, Standard: 7.5, Premium: 13.5 };
    if (!(planType in planPrices)) return res.status(400).json({ message: "Invalid plan type" });

    const subscription = await Subscription.findOne({ userId });
    if (!subscription) return res.status(404).json({ message: "No existing subscription found." });

    const currentEndDate = subscription.endDate > new Date() ? subscription.endDate : new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    subscription.planType = planType;
    subscription.price = planPrices[planType];
    subscription.endDate = newEndDate;
    subscription.isActive = true;
    await subscription.save();

    const user = await User.findById(userId);
    if (user?.email) {
await sendEmail(
  user.email,
  "Subscription Renewed - CMwood",
  `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #f9f9f9;">
    <h2 style="color: #0070f3;">Hello ${user.username},</h2>
    <p style="font-size: 16px;">
      Great news! Your <strong>${planType}</strong> subscription has been successfully renewed.
    </p>
    <p style="font-size: 16px;">
      Your subscription is now valid until <strong>${newEndDate.toDateString()}</strong>.
    </p>
    <p style="font-size: 16px; color: #555;">
      You can continue enjoying unlimited movies and series without interruption.
    </p>
    <a href="https://cmwood.com/movies" 
       style="display: inline-block; margin-top: 15px; padding: 12px 25px; background-color: #0070f3; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
       Watch Movies Now
    </a>
    <p style="font-size: 14px; color: #999; margin-top: 20px;">
      Thank you for continuing with CMwood 🎬. Enjoy your entertainment!
    </p>
  </div>
  `
);
    }

    res.status(200).json({ message: "Subscription renewed successfully", subscription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * 📌 Cancel Subscription
 */
export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription || !subscription.isActive) return res.status(400).json({ message: "No active subscription to cancel." });

    subscription.isActive = false;
    await subscription.save();

    const user = await User.findById(req.user.id);
    if (user?.email) {
await sendEmail(
  user.email,
  "Subscription Cancelled - CMwood",
  `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #f9f9f9;">
    <h2 style="color: #0070f3;">Hello ${user.username},</h2>
    <p style="font-size: 16px;">
      We wanted to inform you that your <strong>${subscription.planType}</strong> subscription has been cancelled successfully.
    </p>
    <p style="font-size: 16px; color: #555;">
      You will no longer be charged for the next period, and access to subscription content will end according to your cancellation.
    </p>
    <p style="font-size: 16px;">
      If you change your mind, you can <a href="https://cmwood.com/subscribe" style="color: #0070f3; text-decoration: none; font-weight: bold;">resubscribe at any time</a>.
    </p>
    <p style="font-size: 14px; color: #999; margin-top: 20px;">
      Thank you for being a part of CMwood 🎬. We hope to see you again soon!
    </p>
  </div>
  `
);

    }

    res.status(200).json({ message: "Subscription cancelled successfully", subscription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/**
 * 📌 Upgrade Subscription
 */
export const upgradeSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPlan } = req.body;

    const planPrices = { Free: 3.5, Standard: 7.5, Premium: 13.5 };
    const levels = { Free: 1, Standard: 2, Premium: 3 };

    // Normalize input (capitalize properly)
    const key = newPlan.charAt(0).toUpperCase() + newPlan.slice(1).toLowerCase();

    if (!(key in planPrices)) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      return res.status(404).json({ message: "No subscription found. Please create one first." });
    }

    // Prevent downgrade
    if (levels[key] <= levels[subscription.planType]) {
      return res.status(400).json({ message: `You can only upgrade, not downgrade.` });
    }

    const startDate = new Date();
    let endDate = new Date();

    // Set new duration
    if (key === "Free") {
      endDate = new Date(startDate.getTime() + 3.5 * 24 * 60 * 60 * 1000);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    subscription.planType = key;
    subscription.price = planPrices[key];
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.isActive = true;
    await subscription.save();

    // Send confirmation email
    const user = await User.findById(userId);
    if (user?.email) {
      await sendEmail(
        user.email,
        "Subscription Upgraded - CMwood",
        `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="color: #0070f3;">Hello ${user.username},</h2>
          <p style="font-size: 16px;">
            Congratulations! 🎉 You have successfully upgraded to <strong>${key}</strong> plan.
          </p>
          <p style="font-size: 16px;">
            Your subscription is now valid until <strong>${endDate.toDateString()}</strong>.
          </p>
          <p style="font-size: 16px; color: #555;">
            Enjoy unlimited movies, downloads, and premium features with CMwood.
          </p>
          <a href="https://cmwood.com/movies" 
             style="display: inline-block; margin-top: 15px; padding: 12px 25px; background-color: #0070f3; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
             Start Watching Now
          </a>
          <p style="font-size: 14px; color: #999; margin-top: 20px;">
            Thank you for upgrading with CMwood 🎬
          </p>
        </div>
        `
      );
    }

    res.status(200).json({ message: "Subscription upgraded successfully", subscription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


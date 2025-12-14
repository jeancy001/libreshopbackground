import express from "express";
import {createOrRenewSubscription,getMySubscription,checkSubscription,
  renewSubscription,
  cancelSubscription,
  upgradeSubscription
} from "../controllers/subscribeController.js";
import { verifyToken } from "../middlewares/userAuthenticate.js";


const router = express.Router();

// 🔹 Subscribe or Renew Subscription
// Method: POST
// Endpoint: /api/subscription/subscribe
router.post("/subscribe", verifyToken, createOrRenewSubscription);


router.post("/renew", verifyToken, renewSubscription);

router.post("/cancel", verifyToken, cancelSubscription);
// 🔹 Get Current User Subscription
// Method: GET
// Endpoint: /api/subscription/my-subscription
router.get("/my-subscription", verifyToken, getMySubscription);

// 🔹 Protected Movie Route (only active subscribers)
// Method:Upgrade
router.put("/upgrade", verifyToken, upgradeSubscription);
// Endpoint: /api/subscription/movies
router.get("/", verifyToken, checkSubscription, (req, res) => {
  res.json({ message: "Welcome! You can now watch movies." });
});

export{router as subcribeRouter };

import express from "express";
import passport from "passport";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "User not logged in" });
      }
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { refId: true, coins: true },
      });
      res.status(200).json({ refId: userData.refId, coins: userData.coins });
    } catch (error) {
      console.error("Error retrieving referral info:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;

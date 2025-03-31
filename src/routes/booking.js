import express from "express";
import passport from "passport";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get(
  "/referral",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    console.log("Referral endpoint hit");
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

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "User not logged in" });
      }
      const { manufacturer, model, battery, refId } = req.body;
      if (!manufacturer || !model || !battery) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const preBooking = await prisma.preBooking.create({
        data: {
          manufacturer,
          model,
          battery,
          userId: user.id,
        },
      });
      if (refId && refId !== user.refId) {
        await prisma.user.update({
          where: { refId: refId },
          data: {
            coins: { increment: 10 },
          },
        });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          coins: { increment: 5 },
        },
      });
      res
        .status(201)
        .json({ message: "Pre-booking created successfully", preBooking });
    } catch (error) {
      console.error("Error creating pre-booking:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const bookings = await prisma.preBooking.findMany({
        where: { userId: user.id },
        include: { user: true },
      });
      res.status(200).json({ bookings });
    } catch (error) {
      console.error("Error retrieving bookings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);
export default router;

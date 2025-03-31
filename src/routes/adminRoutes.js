import express from "express";
import { prisma } from "../prismaClient.js"; // Adjust the path as needed

const router = express.Router();

// GET /admin/users - Retrieve all user data
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        state: true,
        city: true,
        pincode: true,
        refId: true, // Referral Code
        coins: true, // Coin Balance
        createdAt: true, // Registration Date
      },
    });

    const formattedUsers = users.map((user) => ({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      location: `${user.city}, ${user.state} - ${user.pincode}`,
      referralCode: user.refId,
      coinBalance: user.coins,
      registrationDate: user.createdAt,
    }));

    res.status(200).json({ users: formattedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/bookings - Retrieve all booking data
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await prisma.preBooking.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const formattedBookings = bookings.map((booking) => ({
      bookingId: booking.id,
      manufacturer: booking.manufacturer,
      model: booking.model,
      battery: booking.battery,
      user: `${booking.user.firstName} ${booking.user.lastName} (${booking.user.email})`,
      date: booking.createdAt,
    }));

    res.status(200).json({ bookings: formattedBookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/dashboard - Retrieve numeric metrics and recent bookings
router.get("/dashboard", async (req, res) => {
  try {
    // Set startOfToday to midnight
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const totalUsers = await prisma.user.count();
    const totalBookings = await prisma.preBooking.count();
    const newUsersToday = await prisma.user.count({
      where: { createdAt: { gte: startOfToday } },
    });
    const newBookingsToday = await prisma.preBooking.count({
      where: { createdAt: { gte: startOfToday } },
    });

    const recentBookings = await prisma.preBooking.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    res.status(200).json({
      totalUsers,
      totalBookings,
      newUsersToday,
      newBookingsToday,
      recentBookings,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

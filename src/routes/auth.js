import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { prisma } from "../prismaClient.js";

dotenv.config();

const router = express.Router();

function generateRefId() {
  const randomPart = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `NETTS${randomPart}`;
}
router.post("/register", async (req, res) => {
  try {
    let { firstName, lastName, email, password, phone, state, city, pincode } = req.body;

    // Check for common required fields
    if (!firstName || !lastName || !state || !city || !pincode) {
      return res.status(400).json({
        error:
          "Missing required fields. Must provide firstName, lastName, state, city, and pincode.",
      });
    }

    // Trim and default empty values
    email = email ? email.trim() : "";
    phone = phone ? phone.trim() : "";
    password = password ? password.trim() : "";

    // At least one of email or phone must be provided
    if (!email && !phone) {
      return res.status(400).json({ error: "Either email or phone must be provided." });
    }

    // If registering with phone (local registration), password is required.
    // Google OAuth registration is assumed when an email is provided and password is empty.
    if (phone && !email && password === "") {
      return res.status(400).json({ error: "Password is required when registering with phone." });
    }

    // Uniqueness check: If email is provided, verify it isn't already used.
    if (email !== "") {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }

    // Uniqueness check: If phone is provided, verify it isn't already used.
    if (phone !== "") {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ error: "Phone number already registered" });
      }
    }

    // For local registration, hash the password; if password is empty (Google OAuth), leave it as an empty string.
    const hashedPassword = password !== "" ? await bcrypt.hash(password, 10) : "";

    // If only phone is provided (local registration), generate a dummy email.
    if (!email && phone) {
      email = `${phone}@dummy.netts.in`;
    }

    const refId = generateRefId();

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        state,
        city,
        pincode,
        refId,
        coins: 0,
      },
    });

    // Generate a JWT token upon successful registration.
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Local Login Endpoint using phone
router.post("/login", (req, res, next) => {
  passport.authenticate(
    "local-login",
    { session: false },
    (err, user, info) => {
      if (err || !user) {
        return res
          .status(400)
          .json({ error: info ? info.message : "Login failed" });
      }
      const token = jwt.sign(
        { id: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );
      res.json({ message: "Login successful", token, user });
    },
  )(req, res, next);
});

// Google OAuth Initiation
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Google OAuth Callback: Return JSON with token and user info (or email for registration)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/register",
    failureMessage: true,
  }),
  (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const { id, email } = req.user;
    const frontendUrl = process.env.FRONTEND_URL; // New frontend page to handle login

    if (id) {
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not set");
        return res.status(500).json({ message: "Internal server error" });
      }

      // Generate JWT token
      const token = jwt.sign({ id, email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Redirect to frontend with data
      return res.redirect(`${frontendUrl}/login?token=${token}&email=${email}`);
    } else {
      // Redirect to register page with user email
      return res.redirect(
        `${frontendUrl}/register?message=User%20not%20registered&email=${email}`,
      );
    }
  },
);
// Session Endpoint (for checking current session)
router.get(
  "/session",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ user: req.user });
  },
);

export default router;

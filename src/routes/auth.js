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
    // Destructure input from the request body.
    // Both email and phone are now optional, but at least one must be provided.
    let { firstName, lastName, email, password, phone, state, city, pincode } = req.body;

    // Check for required fields (excluding email, which is optional, but require phone if email is missing)
    if (
      !firstName ||
      !lastName ||
      !password ||
      !state ||
      !city ||
      !pincode ||
      (!email && !phone)
    ) {
      return res.status(400).json({
        error: "Missing required fields. Must provide password, firstName, lastName, state, city, pincode, and at least one of email or phone",
      });
    }

    // If email is not provided, generate a dummy email using the phone number.
    if (!email && phone) {
      email = `${phone}@dummy.netts.in`;
    }

    // Check if a user exists with the given email.
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Check if a user exists with the given phone (if provided).
    if (phone) {
      user = await prisma.user.findUnique({ where: { phone } });
      if (user) {
        return res.status(400).json({ error: "Phone number already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const refId = generateRefId();

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phone || "", // if phone is missing, store an empty string (ensure your schema allows this if needed)
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

    res.status(201).json({ message: "User registered successfully", token, user: newUser });
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
      return res.redirect(`${frontendUrl}?token=${token}&email=${email}`);
    } else {
      // Redirect to register page with user email
      return res.redirect(`${frontendUrl}?message=User%20not%20registered&email=${email}`);
    }
  }
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

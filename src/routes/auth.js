import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { prisma } from "../prismaClient.js";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const router = express.Router();
const googleClient = new OAuth2Client();

function generateRefId() {
  const randomPart = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `NETTS${randomPart}`;
}
router.post("/register", async (req, res) => {
  try {
    let { firstName, lastName, email, password, phone, state, city, pincode } = req.body;

    // Required common fields.
    if (!firstName || !lastName || !state || !city || !pincode) {
      return res.status(400).json({
        error: "Missing required fields. Must provide firstName, lastName, state, city, and pincode.",
      });
    }

    // Convert optional fields to trimmed values or null.
    email = email && email.trim() !== "" ? email.trim() : null;
    phone = phone && phone.trim() !== "" ? phone.trim() : null;
    password = password && password.trim() !== "" ? password.trim() : null;

    // At least one of email or phone must be provided.
    if (!email && !phone) {
      return res.status(400).json({ error: "Either email or phone must be provided." });
    }

    // For local registration (using phone only) require password.
    if (phone && !email && !password) {
      return res.status(400).json({ error: "Password is required when registering with phone only." });
    }

    // Uniqueness check for email (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }

    // Uniqueness check for phone (if provided)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ error: "Phone number already registered" });
      }
    }

    // Hash the password if provided.
    const hashedPassword = password ? await bcrypt.hash(password, 10) : "";

    const refId = generateRefId();

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,       // May be null.
        password: hashedPassword,
        phone,       // May be null.
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
    res.status(500).json({ error: "Registration failed", details: error.message });
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


router.post("/google-phone-auth", async (req, res) => {
  const { email, accessToken } = req.body;

  if (!email || !accessToken) {
    return res.status(400).json({ message: "Email and accessToken are required" });
  }

  try {
    // Step 1: Verify Google Access Token
    const tokenInfo = await googleClient.getTokenInfo(accessToken);

    if (!tokenInfo || tokenInfo.email !== email) {
      return res.status(401).json({ message: "Invalid or mismatched access token" });
    }

    // Step 2: Check if user exists in DB
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        state: true,
        city: true,
        pincode: true,
        refId: true,
        coins: true,
      },
    });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return res.status(500).json({ message: "Server error" });
    }

    if (user) {
      // Step 3: Generate 30-day JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      return res.status(201).json({
        message: "User exists, proceed to login",
        token,
        user,
      });
    } else {
      return res.status(202).json({
        message: "User not found, proceed to registration",
        email,
      });
    }
  } catch (error) {
    console.error("Phone Auth Error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid access token" });
  }
});

// Session Endpoint (for checking current session)
router.get(
  "/session",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ user: req.user });
  },
);

export default router;

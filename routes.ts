import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs/promises";
import { 
  insertUserSchema, 
  insertContestEntrySchema,
  insertVoteSchema,
  insertPaymentSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";

// Get __dirname equivalent in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads
const uploadDir = join(__dirname, "..", "uploads");

// Ensure uploads directory exists
try {
  await fs.mkdir(uploadDir, { recursive: true });
} catch (error) {
  console.error("Failed to create uploads directory", error);
}

const storage_disk = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage_disk,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (_req, file, cb) => {
    // Accept only jpg, png, and pdf
    if (file.mimetype === "image/jpeg" || 
        file.mimetype === "image/png" || 
        file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .png, and .pdf files are allowed"));
    }
  }
});

// Create session store
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "colorcompete-secret",
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  }));

  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username is already taken
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email is already taken
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Error creating user" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // User routes
  app.get("/api/user/current", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.get("/api/user/entries", authenticate, async (req, res) => {
    try {
      const entries = await storage.getUserEntries(req.session.userId!);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching entries" });
    }
  });

  app.get("/api/user/ranking", authenticate, async (req, res) => {
    try {
      const ranking = await storage.getUserRanking(req.session.userId!);
      if (!ranking) {
        return res.status(404).json({ message: "Ranking not found" });
      }
      res.json(ranking);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ranking" });
    }
  });

  // Contest routes
  app.get("/api/contests", async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const contests = await storage.getContests(activeOnly);
      res.json(contests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contests" });
    }
  });

  app.get("/api/contests/current", async (req, res) => {
    try {
      const contest = await storage.getCurrentContest();
      if (!contest) {
        return res.status(404).json({ message: "No active contest found" });
      }
      res.json(contest);
    } catch (error) {
      res.status(500).json({ message: "Error fetching current contest" });
    }
  });

  app.get("/api/contests/:id", async (req, res) => {
    try {
      const contestId = parseInt(req.params.id);
      const contest = await storage.getContest(contestId);
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      res.json(contest);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contest" });
    }
  });

  app.get("/api/contests/:id/download", async (req, res) => {
    try {
      const contestId = parseInt(req.params.id);
      const contest = await storage.getContest(contestId);
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      // In a real implementation, you would serve the actual file
      // For this mock implementation, we'll return the lineartUrl
      res.json({ downloadUrl: contest.lineartUrl });
    } catch (error) {
      res.status(500).json({ message: "Error downloading line art" });
    }
  });

  // Entry routes
  app.get("/api/entries", async (req, res) => {
    try {
      const sortBy = req.query.sort?.toString() || 'newest';
      const entries = await storage.getAllEntries(12, sortBy);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching entries" });
    }
  });

  app.get("/api/entries/gallery", async (req, res) => {
    try {
      const sortBy = req.query.sort?.toString() || 'newest';
      const mediumFilter = req.query.medium?.toString() || '';
      
      let entries = await storage.getAllEntries(undefined, sortBy);
      
      // Apply medium filter if provided
      if (mediumFilter) {
        const mediums = mediumFilter.split(',');
        if (mediums.length > 0 && mediums[0] !== '') {
          entries = entries.filter(entry => mediums.includes(entry.medium));
        }
      }
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching gallery" });
    }
  });

  app.get("/api/entries/contest/:id", async (req, res) => {
    try {
      const contestId = parseInt(req.params.id);
      const entries = await storage.getContestEntries(contestId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contest entries" });
    }
  });

  app.post("/api/entries", authenticate, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }
      
      // Get the uploaded file path
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Parse and validate entry data
      const entryData = {
        ...req.body,
        contestId: parseInt(req.body.contestId),
        userId: req.session.userId!,
        imageUrl
      };
      
      const validatedData = insertContestEntrySchema.parse(entryData);
      
      // Create entry
      const entry = await storage.createContestEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Error creating entry" });
      }
    }
  });

  app.post("/api/entries/:id/vote", authenticate, async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if entry exists
      const entry = await storage.getContestEntry(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      // Check if user has already voted for this entry
      const existingVote = await storage.getVote(entryId, userId);
      if (existingVote) {
        return res.status(400).json({ message: "You have already voted for this entry" });
      }
      
      // Create vote
      const voteData = { entryId, userId };
      const validatedData = insertVoteSchema.parse(voteData);
      const vote = await storage.createVote(validatedData);
      
      res.status(201).json(vote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Error casting vote" });
      }
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Error fetching leaderboard" });
    }
  });

  // Payment routes
  app.post("/api/payments", authenticate, async (req, res) => {
    try {
      const paymentData = {
        ...req.body,
        userId: req.session.userId!,
        status: "completed" // For demonstration; in a real app, this would come from the payment processor
      };
      
      const validatedData = insertPaymentSchema.parse(paymentData);
      const payment = await storage.createPayment(validatedData);
      
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Error processing payment" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

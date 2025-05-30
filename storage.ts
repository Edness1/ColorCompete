import { 
  users, type User, type InsertUser,
  contests, type Contest, type InsertContest,
  contestEntries, type ContestEntry, type InsertContestEntry,
  votes, type Vote, type InsertVote,
  payments, type Payment, type InsertPayment,
  type UserRanking
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";

// Storage interface with CRUD methods for all entities
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User | undefined>;
  
  // Contest methods
  getContests(activeOnly?: boolean): Promise<Contest[]>;
  getContest(id: number): Promise<Contest | undefined>;
  getCurrentContest(): Promise<Contest | undefined>;
  createContest(contest: InsertContest): Promise<Contest>;
  updateContest(id: number, contestData: Partial<Contest>): Promise<Contest | undefined>;
  incrementContestEntryCount(id: number): Promise<void>;
  
  // Contest entry methods
  getContestEntries(contestId: number): Promise<ContestEntry[]>;
  getUserEntries(userId: number): Promise<ContestEntry[]>;
  getContestEntry(id: number): Promise<ContestEntry | undefined>;
  createContestEntry(entry: InsertContestEntry): Promise<ContestEntry>;
  updateContestEntry(id: number, entryData: Partial<ContestEntry>): Promise<ContestEntry | undefined>;
  incrementEntryVotes(id: number): Promise<void>;
  getAllEntries(limit?: number, sortBy?: string): Promise<ContestEntry[]>;
  
  // Vote methods
  getVote(entryId: number, userId: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  getUserVotes(userId: number): Promise<Vote[]>;
  
  // Rankings methods
  getLeaderboard(limit?: number): Promise<UserRanking[]>;
  getUserRanking(userId: number): Promise<UserRanking | undefined>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getUserPayments(userId: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string): Promise<Payment | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contests: Map<number, Contest>;
  private contestEntries: Map<number, ContestEntry>;
  private votes: Map<number, Vote>;
  private payments: Map<number, Payment>;
  
  private userIdCounter: number;
  private contestIdCounter: number;
  private entryIdCounter: number;
  private voteIdCounter: number;
  private paymentIdCounter: number;

  constructor() {
    this.users = new Map();
    this.contests = new Map();
    this.contestEntries = new Map();
    this.votes = new Map();
    this.payments = new Map();
    
    this.userIdCounter = 1;
    this.contestIdCounter = 1;
    this.entryIdCounter = 1;
    this.voteIdCounter = 1;
    this.paymentIdCounter = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  // Helper method to initialize sample data
  private initializeSampleData() {
    // Create sample users
    const sampleUsers: InsertUser[] = [
      { username: "emma", password: "password123", email: "emma@example.com" },
      { username: "mia", password: "password123", email: "mia@example.com" },
      { username: "jack", password: "password123", email: "jack@example.com" },
    ];
    
    sampleUsers.forEach(user => this.createUser(user));
    
    // Update users with avatar URLs
    this.updateUser(1, { avatarUrl: "https://randomuser.me/api/portraits/women/32.jpg", membership: "premium" });
    this.updateUser(2, { avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg", membership: "pro" });
    this.updateUser(3, { avatarUrl: "https://randomuser.me/api/portraits/men/55.jpg" });
    
    // Create sample contests
    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(now.getDate() + 7);
    
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(now.getDate() + 14);
    
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const sampleContests: InsertContest[] = [
      {
        title: "Spring Explosion",
        description: "Bring to life our spring-themed line art with your most vibrant coloring techniques! Whether you prefer traditional media or digital tools, show us your interpretation of spring's explosive colors.",
        imageUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        lineartUrl: "/lineart/spring_explosion.png",
        startDate: now,
        endDate: oneWeekLater,
        prizeAmount: 250,
        entryFee: 5.00,
        difficulty: 3,
        isActive: true,
      },
      {
        title: "Ocean Dreams",
        description: "Dive into the deep blue with our underwater themed line art. Use your coloring skills to bring marine life to vibrant reality!",
        imageUrl: "https://images.unsplash.com/photo-1530053969600-caed2596d242?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        lineartUrl: "/lineart/ocean_dreams.png",
        startDate: oneWeekLater,
        endDate: twoWeeksLater,
        prizeAmount: 300,
        entryFee: 7.50,
        difficulty: 4,
        isActive: true,
      },
      {
        title: "Winter Wonderland",
        description: "Our winter themed line art is waiting for your colorful touch. Show us your interpretation of a snowy landscape!",
        imageUrl: "https://images.unsplash.com/photo-1457269449834-928af64c684d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        lineartUrl: "/lineart/winter_wonderland.png",
        startDate: oneWeekAgo,
        endDate: now,
        prizeAmount: 200,
        entryFee: 5.00,
        difficulty: 2,
        isActive: false,
      }
    ];
    
    sampleContests.forEach(contest => this.createContest(contest));
    
    // Create sample entries
    const sampleEntries: InsertContestEntry[] = [
      {
        contestId: 1,
        userId: 1,
        title: "Spring Dreams",
        description: "I used watercolors to create a dreamy spring landscape.",
        imageUrl: "https://images.unsplash.com/photo-1496309732348-3627f3f040ee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400",
        medium: "traditional",
      },
      {
        contestId: 1,
        userId: 2,
        title: "Butterfly Garden",
        description: "I focused on creating vibrant butterfly colors using digital tools.",
        imageUrl: "https://images.unsplash.com/photo-1545608444-f045a6db6133?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400",
        medium: "digital",
      },
      {
        contestId: 1,
        userId: 3,
        title: "Abstract Spring",
        description: "An abstract interpretation of spring using bright colors.",
        imageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400",
        medium: "digital",
      },
      {
        contestId: 3,
        userId: 1,
        title: "Frozen Lake",
        description: "A serene winter scene with a frozen lake.",
        imageUrl: "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400",
        medium: "traditional",
      }
    ];
    
    sampleEntries.forEach(entry => this.createContestEntry(entry));
    
    // Add votes
    const sampleVotes: InsertVote[] = [
      { entryId: 1, userId: 2 },
      { entryId: 1, userId: 3 },
      { entryId: 2, userId: 1 },
      { entryId: 2, userId: 3 },
      { entryId: 3, userId: 1 },
      { entryId: 3, userId: 2 },
      { entryId: 4, userId: 2 },
      { entryId: 4, userId: 3 },
    ];
    
    sampleVotes.forEach(vote => this.createVote(vote));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      membership: "free",
      avatarUrl: undefined,
      stripeCustomerId: undefined,
      stripeSubscriptionId: undefined,
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId });
  }
  
  async updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(userId, { 
      stripeCustomerId: info.customerId,
      stripeSubscriptionId: info.subscriptionId
    });
  }
  
  // Contest methods
  async getContests(activeOnly: boolean = false): Promise<Contest[]> {
    let contests = Array.from(this.contests.values());
    
    if (activeOnly) {
      const now = new Date();
      contests = contests.filter(contest => 
        contest.isActive && new Date(contest.endDate) > now
      );
    }
    
    return contests.sort((a, b) => {
      // Sort by start date, newest first
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }
  
  async getContest(id: number): Promise<Contest | undefined> {
    return this.contests.get(id);
  }
  
  async getCurrentContest(): Promise<Contest | undefined> {
    const now = new Date();
    return Array.from(this.contests.values()).find(contest => 
      contest.isActive && 
      new Date(contest.startDate) <= now && 
      new Date(contest.endDate) > now
    );
  }
  
  async createContest(contestData: InsertContest): Promise<Contest> {
    const id = this.contestIdCounter++;
    const contest: Contest = { ...contestData, id, entryCount: 0 };
    this.contests.set(id, contest);
    return contest;
  }
  
  async updateContest(id: number, contestData: Partial<Contest>): Promise<Contest | undefined> {
    const contest = this.contests.get(id);
    if (!contest) return undefined;
    
    const updatedContest = { ...contest, ...contestData };
    this.contests.set(id, updatedContest);
    return updatedContest;
  }
  
  async incrementContestEntryCount(id: number): Promise<void> {
    const contest = this.contests.get(id);
    if (contest) {
      contest.entryCount += 1;
      this.contests.set(id, contest);
    }
  }
  
  // Contest entry methods
  async getContestEntries(contestId: number): Promise<ContestEntry[]> {
    return Array.from(this.contestEntries.values())
      .filter(entry => entry.contestId === contestId)
      .map(entry => {
        const user = this.users.get(entry.userId);
        return { ...entry, username: user?.username };
      });
  }
  
  async getUserEntries(userId: number): Promise<ContestEntry[]> {
    return Array.from(this.contestEntries.values())
      .filter(entry => entry.userId === userId)
      .map(entry => {
        const user = this.users.get(entry.userId);
        return { ...entry, username: user?.username };
      });
  }
  
  async getContestEntry(id: number): Promise<ContestEntry | undefined> {
    const entry = this.contestEntries.get(id);
    if (!entry) return undefined;
    
    const user = this.users.get(entry.userId);
    return { ...entry, username: user?.username };
  }
  
  async createContestEntry(entryData: InsertContestEntry): Promise<ContestEntry> {
    const id = this.entryIdCounter++;
    const now = new Date();
    const entry: ContestEntry = { 
      ...entryData, 
      id, 
      votes: 0, 
      createdAt: now 
    };
    this.contestEntries.set(id, entry);
    
    // Increment contest entry count
    await this.incrementContestEntryCount(entryData.contestId);
    
    const user = this.users.get(entry.userId);
    return { ...entry, username: user?.username };
  }
  
  async updateContestEntry(id: number, entryData: Partial<ContestEntry>): Promise<ContestEntry | undefined> {
    const entry = this.contestEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry = { ...entry, ...entryData };
    this.contestEntries.set(id, updatedEntry);
    
    const user = this.users.get(updatedEntry.userId);
    return { ...updatedEntry, username: user?.username };
  }
  
  async incrementEntryVotes(id: number): Promise<void> {
    const entry = this.contestEntries.get(id);
    if (entry) {
      entry.votes += 1;
      this.contestEntries.set(id, entry);
    }
  }
  
  async getAllEntries(limit?: number, sortBy: string = 'newest'): Promise<ContestEntry[]> {
    let entries = Array.from(this.contestEntries.values()).map(entry => {
      const user = this.users.get(entry.userId);
      return { ...entry, username: user?.username };
    });
    
    // Sort entries
    if (sortBy === 'most_votes') {
      entries = entries.sort((a, b) => b.votes - a.votes);
    } else if (sortBy === 'newest') {
      entries = entries.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'oldest') {
      entries = entries.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
    
    if (limit && entries.length > limit) {
      entries = entries.slice(0, limit);
    }
    
    return entries;
  }
  
  // Vote methods
  async getVote(entryId: number, userId: number): Promise<Vote | undefined> {
    return Array.from(this.votes.values()).find(
      vote => vote.entryId === entryId && vote.userId === userId
    );
  }
  
  async createVote(voteData: InsertVote): Promise<Vote> {
    const id = this.voteIdCounter++;
    const now = new Date();
    const vote: Vote = { ...voteData, id, createdAt: now };
    this.votes.set(id, vote);
    
    // Increment entry votes
    await this.incrementEntryVotes(voteData.entryId);
    
    return vote;
  }
  
  async getUserVotes(userId: number): Promise<Vote[]> {
    return Array.from(this.votes.values())
      .filter(vote => vote.userId === userId);
  }
  
  // Rankings methods
  async getLeaderboard(limit: number = 10): Promise<UserRanking[]> {
    // Get all users and count their total votes
    const userVotes = new Map<number, number>();
    
    for (const entry of this.contestEntries.values()) {
      const currentVotes = userVotes.get(entry.userId) || 0;
      userVotes.set(entry.userId, currentVotes + entry.votes);
    }
    
    // Convert to array and sort by votes
    const rankings = Array.from(userVotes.entries())
      .map(([userId, votes]) => {
        const user = this.users.get(userId);
        return {
          id: userId,
          username: user?.username || 'Unknown',
          avatarUrl: user?.avatarUrl,
          votes,
          rank: 0 // Placeholder, will be set below
        };
      })
      .sort((a, b) => b.votes - a.votes);
    
    // Assign ranks
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });
    
    return limit ? rankings.slice(0, limit) : rankings;
  }
  
  async getUserRanking(userId: number): Promise<UserRanking | undefined> {
    const leaderboard = await this.getLeaderboard(100); // Get top 100 to ensure we cover most users
    return leaderboard.find(ranking => ranking.id === userId);
  }
  
  // Payment methods
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const now = new Date();
    const payment: Payment = { ...paymentData, id, createdAt: now };
    this.payments.set(id, payment);
    return payment;
  }
  
  async getUserPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, status };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId });
  }

  async updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(userId, { 
      stripeCustomerId: info.customerId, 
      stripeSubscriptionId: info.subscriptionId 
    });
  }
  
  async getContests(activeOnly: boolean = false): Promise<Contest[]> {
    let query = db.select().from(contests);
    
    if (activeOnly) {
      const now = new Date();
      query = query.where(
        and(
          lte(contests.startDate, now),
          gte(contests.endDate, now)
        )
      );
    }
    
    return query.orderBy(desc(contests.startDate));
  }

  async getContest(id: number): Promise<Contest | undefined> {
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, id));
    return contest || undefined;
  }

  async getCurrentContest(): Promise<Contest | undefined> {
    const now = new Date();
    const [contest] = await db
      .select()
      .from(contests)
      .where(
        and(
          lte(contests.startDate, now),
          gte(contests.endDate, now)
        )
      )
      .orderBy(desc(contests.startDate))
      .limit(1);
    return contest || undefined;
  }

  async createContest(contestData: InsertContest): Promise<Contest> {
    const [contest] = await db
      .insert(contests)
      .values({ ...contestData, entryCount: 0 })
      .returning();
    return contest;
  }

  async updateContest(id: number, contestData: Partial<Contest>): Promise<Contest | undefined> {
    const [updatedContest] = await db
      .update(contests)
      .set(contestData)
      .where(eq(contests.id, id))
      .returning();
    return updatedContest || undefined;
  }

  async incrementContestEntryCount(id: number): Promise<void> {
    await db
      .update(contests)
      .set({ 
        entryCount: sql`${contests.entryCount} + 1` 
      })
      .where(eq(contests.id, id));
  }

  async getContestEntries(contestId: number): Promise<ContestEntry[]> {
    return db
      .select({
        ...contestEntries,
        username: users.username
      })
      .from(contestEntries)
      .leftJoin(users, eq(contestEntries.userId, users.id))
      .where(eq(contestEntries.contestId, contestId))
      .orderBy(desc(contestEntries.createdAt));
  }

  async getUserEntries(userId: number): Promise<ContestEntry[]> {
    return db
      .select()
      .from(contestEntries)
      .where(eq(contestEntries.userId, userId))
      .orderBy(desc(contestEntries.createdAt));
  }

  async getContestEntry(id: number): Promise<ContestEntry | undefined> {
    const [entry] = await db
      .select({
        ...contestEntries,
        username: users.username
      })
      .from(contestEntries)
      .leftJoin(users, eq(contestEntries.userId, users.id))
      .where(eq(contestEntries.id, id));
    return entry || undefined;
  }

  async createContestEntry(entryData: InsertContestEntry): Promise<ContestEntry> {
    const [entry] = await db
      .insert(contestEntries)
      .values({ ...entryData, votes: 0 })
      .returning();
    
    // Increment contest entry count
    await this.incrementContestEntryCount(entryData.contestId);
    
    return entry;
  }

  async updateContestEntry(id: number, entryData: Partial<ContestEntry>): Promise<ContestEntry | undefined> {
    const [updatedEntry] = await db
      .update(contestEntries)
      .set(entryData)
      .where(eq(contestEntries.id, id))
      .returning();
    return updatedEntry || undefined;
  }

  async incrementEntryVotes(id: number): Promise<void> {
    await db
      .update(contestEntries)
      .set({ 
        votes: sql`${contestEntries.votes} + 1` 
      })
      .where(eq(contestEntries.id, id));
  }

  async getAllEntries(limit?: number, sortBy: string = 'newest'): Promise<ContestEntry[]> {
    let query = db
      .select({
        ...contestEntries,
        username: users.username
      })
      .from(contestEntries)
      .leftJoin(users, eq(contestEntries.userId, users.id));
    
    if (sortBy === 'newest') {
      query = query.orderBy(desc(contestEntries.createdAt));
    } else if (sortBy === 'popular') {
      query = query.orderBy(desc(contestEntries.votes));
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }

  async getVote(entryId: number, userId: number): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.entryId, entryId),
          eq(votes.userId, userId)
        )
      );
    return vote || undefined;
  }

  async createVote(voteData: InsertVote): Promise<Vote> {
    const [vote] = await db
      .insert(votes)
      .values(voteData)
      .returning();
    
    // Increment entry votes
    await this.incrementEntryVotes(voteData.entryId);
    
    return vote;
  }

  async getUserVotes(userId: number): Promise<Vote[]> {
    return db
      .select()
      .from(votes)
      .where(eq(votes.userId, userId))
      .orderBy(desc(votes.createdAt));
  }

  async getLeaderboard(limit: number = 10): Promise<UserRanking[]> {
    // This requires a complex SQL query to calculate rankings
    const rankingsResult = await sql`
      WITH user_votes AS (
        SELECT 
          u.id,
          u.username,
          u.avatar_url as "avatarUrl",
          COALESCE(SUM(ce.votes), 0) as votes
        FROM users u
        LEFT JOIN contest_entries ce ON u.id = ce.user_id
        GROUP BY u.id, u.username, u.avatar_url
      ),
      ranked_users AS (
        SELECT 
          id,
          username,
          "avatarUrl",
          votes,
          RANK() OVER (ORDER BY votes DESC) as rank
        FROM user_votes
      )
      SELECT id, username, "avatarUrl", votes, rank
      FROM ranked_users
      ORDER BY rank ASC
      LIMIT ${limit}
    `.execute(pool);
    
    return rankingsResult.rows as UserRanking[];
  }

  async getUserRanking(userId: number): Promise<UserRanking | undefined> {
    const rankingResult = await sql`
      WITH user_votes AS (
        SELECT 
          u.id,
          u.username,
          u.avatar_url as "avatarUrl",
          COALESCE(SUM(ce.votes), 0) as votes
        FROM users u
        LEFT JOIN contest_entries ce ON u.id = ce.user_id
        GROUP BY u.id, u.username, u.avatar_url
      ),
      ranked_users AS (
        SELECT 
          id,
          username,
          "avatarUrl",
          votes,
          RANK() OVER (ORDER BY votes DESC) as rank
        FROM user_votes
      )
      SELECT id, username, "avatarUrl", votes, rank
      FROM ranked_users
      WHERE id = ${userId}
    `.execute(pool);
    
    return rankingResult.rows.length > 0 
      ? (rankingResult.rows[0] as UserRanking)
      : undefined;
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return payment;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment || undefined;
  }
}

// Temporarily use memory storage while database connection is resolved
export const storage = new MemStorage();

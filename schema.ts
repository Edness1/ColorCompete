import { pgTable, text, serial, integer, boolean, timestamp, real, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  membership: text("membership").default("free"), // free, pro, premium
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Contests table
export const contests = pgTable("contests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  lineartUrl: text("lineart_url").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  prizeAmount: doublePrecision("prize_amount").notNull(),
  entryFee: doublePrecision("entry_fee").notNull(),
  difficulty: integer("difficulty").notNull(), // 1-5 rating
  isActive: boolean("is_active").default(true).notNull(),
  entryCount: integer("entry_count").default(0).notNull(),
});

export const insertContestSchema = createInsertSchema(contests).omit({
  id: true,
  entryCount: true,
});

export type InsertContest = z.infer<typeof insertContestSchema>;
export type Contest = typeof contests.$inferSelect;

// Contest entries table
export const contestEntries = pgTable("contest_entries", {
  id: serial("id").primaryKey(),
  contestId: integer("contest_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  medium: text("medium").notNull(), // digital or traditional
  votes: integer("votes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContestEntrySchema = createInsertSchema(contestEntries).omit({
  id: true,
  votes: true,
  createdAt: true,
});

export type InsertContestEntry = z.infer<typeof insertContestEntrySchema>;
export type ContestEntry = typeof contestEntries.$inferSelect & { username?: string };

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

// User ranking (derived from votes)
export type UserRanking = {
  id: number;
  username: string;
  avatarUrl?: string;
  votes: number;
  rank: number;
};

// Payment transactions
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contestId: integer("contest_id"),
  amount: doublePrecision("amount").notNull(),
  paymentType: text("payment_type").notNull(), // contest_entry, subscription
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull(), // completed, pending, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;


import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("user"),
  balance: text("balance").notNull().default("0"), // Main wallet balance
  depositBalance: text("deposit_balance").notNull().default("0"), // Balance from deposits
  profitBalance: text("profit_balance").notNull().default("0"), // Balance from investment profits
  totalDeposits: text("total_deposits").notNull().default("0"),
  totalWithdrawals: text("total_withdrawals").notNull().default("0"),
  totalProfit: text("total_profit").notNull().default("0"),
  currentTier: integer("current_tier").notNull().default(1),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  profilePhoto: text("profile_photo"),
  upiId: text("upi_id"),
  accountHolderName: text("account_holder_name"),
  accountNumber: text("account_number"),
  ifscCode: text("ifsc_code"),
  bankName: text("bank_name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Investment plans table
export const investmentPlans = pgTable("investment_plans", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  amount: text("amount").notNull(),
  dailyReturn: text("daily_return").notNull(),
  maxWithdrawalPerDay: text("max_withdrawal_per_day").notNull(),
  durationDays: integer("duration_days").notNull().default(20),
  tier: integer("tier").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User investments table
export const userInvestments = pgTable("user_investments", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  amount: text("amount").notNull(),
  dailyReturn: text("daily_return").notNull(),
  totalReturned: text("total_returned").notNull().default("0"),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  amount: text("amount").notNull(),
  status: text("status").notNull().default("pending"),
  description: text("description"),
  reference: text("reference"),
  paymentMethod: text("payment_method"),
  paymentScreenshot: text("payment_screenshot"),
  transactionNumber: text("transaction_number"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Referrals table
export const referrals = pgTable("referrals", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  referrerId: text("referrer_id").notNull(),
  referredUserId: text("referred_user_id").notNull(),
  level: integer("level").notNull(),
  commissionRate: text("commission_rate").notNull(),
  totalEarned: text("total_earned").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Daily returns table
export const dailyReturns = pgTable("daily_returns", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  investmentId: text("investment_id").notNull(),
  userId: text("user_id").notNull(),
  amount: text("amount").notNull(),
  returnDate: timestamp("return_date").notNull().defaultNow(),
  processed: boolean("processed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Support chats table
export const supportChats = pgTable("support_chats", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  chatId: text("chat_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderType: text("sender_type").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment methods configuration
export const paymentMethods = pgTable("payment_methods", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  type: text("type").notNull(),
  name: text("name").notNull(),
  upiId: text("upi_id"),
  qrCodeUrl: text("qr_code_url"),
  bankAccountNumber: text("bank_account_number"),
  bankIfsc: text("bank_ifsc"),
  bankName: text("bank_name"),
  accountHolderName: text("account_holder_name"),
  instructions: text("instructions"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Admin payment configuration
export const paymentConfig = pgTable("payment_config", {
  id: integer("id").primaryKey().default(1),
  upiId: text("upi_id"),
  qrCodeUrl: text("qr_code_url"),
  bankAccountNumber: text("bank_account_number"),
  bankIfsc: text("bank_ifsc"),
  bankName: text("bank_name"),
  accountHolderName: text("account_holder_name"),
  depositInstructions: text("deposit_instructions"),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  investments: many(userInvestments),
  transactions: many(transactions),
  referralsGiven: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
  dailyReturns: many(dailyReturns),
  supportChats: many(supportChats),
  supportMessages: many(supportMessages),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.referralCode],
  }),
}));

export const investmentPlansRelations = relations(investmentPlans, ({ many }) => ({
  userInvestments: many(userInvestments),
}));

export const userInvestmentsRelations = relations(userInvestments, ({ one, many }) => ({
  user: one(users, {
    fields: [userInvestments.userId],
    references: [users.id],
  }),
  plan: one(investmentPlans, {
    fields: [userInvestments.planId],
    references: [investmentPlans.id],
  }),
  dailyReturns: many(dailyReturns),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
    relationName: "referred",
  }),
}));

export const dailyReturnsRelations = relations(dailyReturns, ({ one }) => ({
  investment: one(userInvestments, {
    fields: [dailyReturns.investmentId],
    references: [userInvestments.id],
  }),
  user: one(users, {
    fields: [dailyReturns.userId],
    references: [users.id],
  }),
}));

export const supportChatsRelations = relations(supportChats, ({ one, many }) => ({
  user: one(users, {
    fields: [supportChats.userId],
    references: [users.id],
  }),
  messages: many(supportMessages),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  chat: one(supportChats, {
    fields: [supportMessages.chatId],
    references: [supportChats.id],
  }),
  sender: one(users, {
    fields: [supportMessages.senderId],
    references: [users.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  transactions: many(transactions),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  phone: true,
}).extend({
  referralCode: z.string().optional(),
});

export const paymentMethodSchema = z.object({
  upiId: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
});

export const supportChatSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
});

export const supportMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export const insertInvestmentSchema = createInsertSchema(userInvestments).omit({
  id: true,
  createdAt: true,
  totalReturned: true,
  endDate: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProfileSchema = insertUserSchema.pick({
  fullName: true,
  phone: true,
}).extend({
  profilePhoto: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const withdrawalRequestSchema = z.object({
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paymentMethod: z.enum(["upi", "bank"]),
  processingTime: z.enum(["24hours"]).default("24hours"),
});

export const paymentMethodConfigSchema = z.object({
  type: z.enum(["google_pay", "phone_pe", "paytm", "bank_transfer"]),
  name: z.string().min(1, "Name is required"),
  upiId: z.string().optional(),
  qrCodeUrl: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  instructions: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export const depositRequestSchema = z.object({
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paymentMethod: z.enum(["google_pay", "phone_pe", "paytm", "bank_transfer"]),
  paymentScreenshot: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type InvestmentPlan = typeof investmentPlans.$inferSelect;
export type UserInvestment = typeof userInvestments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Referral = typeof referrals.$inferSelect;
export type DailyReturn = z.infer<typeof dailyReturns.$inferSelect>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type WithdrawalRequest = z.infer<typeof withdrawalRequestSchema>;
export type SupportChat = typeof supportChats.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentMethodConfig = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethodConfig = z.infer<typeof paymentMethodConfigSchema>;
export type DepositRequest = z.infer<typeof depositRequestSchema>;
export type SupportChatData = z.infer<typeof supportChatSchema>;
export type SupportMessageData = z.infer<typeof supportMessageSchema>;

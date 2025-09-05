import { 
  users, 
  investmentPlans, 
  userInvestments, 
  transactions, 
  referrals, 
  dailyReturns,
  supportChats,
  supportMessages,
  paymentConfig,
  paymentMethods,
  type User, 
  type InsertUser, 
  type InvestmentPlan,
  type UserInvestment,
  type Transaction,
  type InsertTransaction,
  type Referral,
  type DailyReturn,
  type SupportChat,
  type SupportMessage,
  type PaymentMethodConfig,
  type InsertPaymentMethodConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, sum, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: string, amount: string): Promise<void>;

  // Authentication
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

  // Investment plans
  getInvestmentPlans(): Promise<InvestmentPlan[]>;
  getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined>;
  createInvestmentPlan(plan: {
    id: number;
    name: string;
    amount: string;
    dailyReturn: string;
    maxWithdrawalPerDay: string;
    tier: number;
  }): Promise<InvestmentPlan>;

  // User investments
  getUserInvestments(userId: string): Promise<UserInvestment[]>;
  getAllInvestments(): Promise<UserInvestment[]>;
  createInvestment(userId: string, planId: number, amount: string): Promise<UserInvestment>;

  // Transactions
  getTransactions(userId?: string, type?: string, status?: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string, adminNotes?: string): Promise<void>;

  // Referrals
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  getUserReferrals(userId: string): Promise<Referral[]>;
  createReferral(referrerId: string, referredUserId: string, level: number, commissionRate: string): Promise<Referral>;
  updateReferralEarnings(referrerId: string, amount: string): Promise<void>;

  // Admin functions
  getAllUsers(): Promise<User[]>;
  getPendingTransactions(): Promise<Transaction[]>;
  getDashboardStats(): Promise<{
    totalUsers: number;
    totalVolume: string;
    pendingWithdrawals: number;
  }>;

  // Daily returns
  processDailyReturns(): Promise<void>;
  getUserDailyReturns(userId: string): Promise<DailyReturn[]>;

  // Support system
  createSupportChat(userId: string, subject: string): Promise<SupportChat>;
  getSupportChats(userId?: string): Promise<SupportChat[]>;
  getSupportChat(chatId: string): Promise<SupportChat | undefined>;
  createSupportMessage(chatId: string, senderId: string, senderType: 'user' | 'admin', message: string): Promise<SupportMessage>;
  getSupportMessages(chatId: string): Promise<SupportMessage[]>;
  updateSupportChatStatus(chatId: string, status: string): Promise<void>;
  markMessagesAsRead(chatId: string, userId: string): Promise<void>;

  // Payment configuration
  getPaymentConfig(): Promise<any>;
  updatePaymentConfig(config: any): Promise<void>;

  // Payment methods
  getPaymentMethods(): Promise<PaymentMethodConfig[]>;
  getPaymentMethod(id: string): Promise<PaymentMethodConfig | undefined>;
  createPaymentMethod(method: InsertPaymentMethodConfig): Promise<PaymentMethodConfig>;
  updatePaymentMethod(id: string, updates: Partial<PaymentMethodConfig>): Promise<PaymentMethodConfig | undefined>;
  deletePaymentMethod(id: string): Promise<void>;

  // Enhanced user management for admin
  banUser(id: string): Promise<void>;
  unbanUser(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  getUserWithDetails(id: string): Promise<{
    user: User;
    transactions: Transaction[];
    investments: UserInvestment[];
    referrals: Referral[];
  } | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Username field doesn't exist in schema, search by email instead  
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(insertUser.password);
    const referralCode = `EV-${randomUUID().slice(0, 8).toUpperCase()}`;

    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        referralCode,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserBalance(id: string, amount: string): Promise<void> {
    try {
      await db.update(users)
        .set({ 
          balance: sql`(CAST(${users.balance} AS DECIMAL) + CAST(${amount} AS DECIMAL))::text`,
          updatedAt: new Date()
        })
        .where(eq(users.id, id));
    } catch (error) {
      console.error("Error updating user balance:", error);
      throw error;
    }
  }

  async updateDepositBalance(id: string, amount: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        depositBalance: sql`(${users.depositBalance}::numeric + ${amount}::numeric)::text`,
        balance: sql`(${users.balance}::numeric + ${amount}::numeric)::text`,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async updateProfitBalance(id: string, amount: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        profitBalance: sql`(${users.profitBalance}::numeric + ${amount}::numeric)::text`,
        balance: sql`(${users.balance}::numeric + ${amount}::numeric)::text`,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  // Process referral commission when user deposits
  async processReferralCommission(userId: string, depositAmount: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user || !user.referredBy) return;

    const referrer = await this.getUserById(user.referredBy);
    if (!referrer) return;

    const commissionAmount = (parseFloat(depositAmount) * 0.10).toString(); // 10% commission
    console.log(`Processing referral commission: ₹${commissionAmount} to ${referrer.fullName}`);

    // Add commission to referrer's balance
    await this.updateUserBalance(referrer.id, commissionAmount);

    // Create transaction record for referrer
    await this.createTransaction({
      userId: referrer.id,
      type: "referral",
      amount: commissionAmount,
      status: "completed",
      description: `Referral commission from ${user.fullName}'s deposit (₹${depositAmount})`,
      reference: `referral-commission-${Date.now()}`,
    });
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async getInvestmentPlans(): Promise<InvestmentPlan[]> {
    try {
      const plans = await db.select().from(investmentPlans).where(eq(investmentPlans.isActive, true));
      return plans || [];
    } catch (error) {
      console.error("Error fetching investment plans:", error);
      return [];
    }
  }

  async getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined> {
    const [plan] = await db.select().from(investmentPlans).where(eq(investmentPlans.id, id));
    return plan || undefined;
  }

  async createInvestmentPlan(plan: {
    id: number;
    name: string;
    amount: string;
    dailyReturn: string;
    maxWithdrawalPerDay: string;
    tier: number;
  }): Promise<InvestmentPlan> {
    const [created] = await db
      .insert(investmentPlans)
      .values(plan)
      .returning();
    return created;
  }

  async getUserInvestments(userId: string): Promise<UserInvestment[]> {
    return db.select().from(userInvestments).where(eq(userInvestments.userId, userId));
  }

  async getAllInvestments(): Promise<UserInvestment[]> {
    return db.select().from(userInvestments).orderBy(desc(userInvestments.createdAt));
  }

  async createInvestment(userId: string, planId: number, amount: string): Promise<UserInvestment> {
    const plan = await this.getInvestmentPlan(planId);
    if (!plan) throw new Error("Investment plan not found");

    const [investment] = await db
      .insert(userInvestments)
      .values({
        userId,
        planId,
        amount,
        dailyReturn: plan.dailyReturn,
      })
      .returning();
    return investment;
  }

  async getTransactions(userId?: string, type?: string, status?: string): Promise<Transaction[]> {
    const conditions = [];
    if (userId) conditions.push(eq(transactions.userId, userId));
    if (type) conditions.push(eq(transactions.type, type));
    if (status) conditions.push(eq(transactions.status, status));

    if (conditions.length > 0) {
      return db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.createdAt));
    }

    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return created;
  }

  async updateTransactionStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    await db
      .update(transactions)
      .set({ 
        status, 
        adminNotes,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id));
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.referrerId, referrerId));
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.referredUserId, userId));
  }

  async createReferral(referrerId: string, referredUserId: string, level: number, commissionRate: string): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId,
        referredUserId,
        level,
        commissionRate,
      })
      .returning();
    return referral;
  }

  async updateReferralEarnings(referrerId: string, amount: string): Promise<void> {
    await db
      .update(referrals)
      .set({ 
        totalEarned: sql`${referrals.totalEarned} + ${amount}`
      })
      .where(eq(referrals.referrerId, referrerId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(eq(transactions.status, "pending"))
      .orderBy(desc(transactions.createdAt));
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalVolume: string;
    pendingWithdrawals: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [volumeResult] = await db.select({ 
      total: sum(sql`CAST(${users.totalDeposits} AS DECIMAL)`) 
    }).from(users);
    const [pendingCount] = await db.select({ count: count() })
      .from(transactions)
      .where(and(
        eq(transactions.type, "withdrawal"),
        eq(transactions.status, "pending")
      ));

    return {
      totalUsers: userCount.count,
      totalVolume: volumeResult.total || "0",
      pendingWithdrawals: pendingCount.count,
    };
  }

  async processDailyReturns(): Promise<void> {
    // This would be called by a cron job
    const activeInvestments = await db.select().from(userInvestments)
      .where(eq(userInvestments.status, "active"));

    for (const investment of activeInvestments) {
      // Check if investment has reached its end date (20 days)
      const startDate = new Date(investment.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 20); // 20 days duration

      const now = new Date();

      // If investment has completed its duration, mark as completed
      if (now >= endDate) {
        await db
          .update(userInvestments)
          .set({ 
            status: "completed",
            endDate: endDate
          })
          .where(eq(userInvestments.id, investment.id));

        // No original amount returned - it's cut as per requirement
        await this.createTransaction({
          userId: investment.userId,
          type: "investment_completed",
          amount: "0", // No amount returned
          status: "completed",
          description: `Investment plan completed. Original amount (₹${investment.amount}) is retained by platform.`,
          reference: investment.id,
        });

        continue; // Skip daily return processing for completed investment
      }

      // Check if daily return already processed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [existingReturn] = await db.select().from(dailyReturns)
        .where(and(
          eq(dailyReturns.investmentId, investment.id),
          sql`DATE(${dailyReturns.returnDate}) = DATE(${today})`
        ));

      if (!existingReturn) {
        // Create daily return
        await db.insert(dailyReturns).values({
          investmentId: investment.id,
          userId: investment.userId,
          amount: investment.dailyReturn,
        });

        // Update user profit balance (only daily returns, not original amount)
        await this.updateProfitBalance(investment.userId, investment.dailyReturn);

        // Create transaction record
        await this.createTransaction({
          userId: investment.userId,
          type: "daily_return",
          amount: investment.dailyReturn,
          status: "completed",
          description: "Daily return from investment",
          reference: investment.id,
        });
      }
    }
  }

  async getUserDailyReturns(userId: string): Promise<DailyReturn[]> {
    return db.select().from(dailyReturns)
      .where(eq(dailyReturns.userId, userId))
      .orderBy(desc(dailyReturns.returnDate));
  }

  // Support system methods
  async createSupportChat(userId: string, subject: string): Promise<SupportChat> {
    const [chat] = await db
      .insert(supportChats)
      .values({ userId, subject })
      .returning();
    return chat;
  }

  async getSupportChats(userId?: string): Promise<SupportChat[]> {
    if (userId) {
      return db.select().from(supportChats)
        .where(eq(supportChats.userId, userId))
        .orderBy(desc(supportChats.lastMessageAt));
    }
    return db.select().from(supportChats)
      .orderBy(desc(supportChats.lastMessageAt));
  }

  async getSupportChat(chatId: string): Promise<SupportChat | undefined> {
    const [chat] = await db.select().from(supportChats)
      .where(eq(supportChats.id, chatId));
    return chat || undefined;
  }

  async createSupportMessage(chatId: string, senderId: string, senderType: 'user' | 'admin', message: string): Promise<SupportMessage> {
    const [msg] = await db
      .insert(supportMessages)
      .values({ chatId, senderId, senderType, message })
      .returning();

    // Update last message time in chat
    await db
      .update(supportChats)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(supportChats.id, chatId));

    return msg;
  }

  async getSupportMessages(chatId: string): Promise<SupportMessage[]> {
    return db.select().from(supportMessages)
      .where(eq(supportMessages.chatId, chatId))
      .orderBy(supportMessages.createdAt);
  }

  async updateSupportChatStatus(chatId: string, status: string): Promise<void> {
    await db
      .update(supportChats)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportChats.id, chatId));
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await db
      .update(supportMessages)
      .set({ isRead: true })
      .where(and(
        eq(supportMessages.chatId, chatId),
        eq(supportMessages.senderId, userId)
      ));
  }

  async getPaymentConfig(): Promise<any> {
    const [config] = await db.select().from(paymentConfig).limit(1);
    return config || null;
  }

  async updatePaymentConfig(configData: any): Promise<void> {
    const existingConfig = await this.getPaymentConfig();

    if (existingConfig) {
      await db
        .update(paymentConfig)
        .set({ 
          ...configData,
          updatedAt: new Date()
        })
        .where(eq(paymentConfig.id, existingConfig.id));
    } else {
      await db
        .insert(paymentConfig)
        .values({
          id: 1,
          ...configData,
          isActive: true,
          updatedAt: new Date()
        });
    }
  }

  // Payment methods implementation
  async getPaymentMethods(): Promise<PaymentMethodConfig[]> {
    return db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true));
  }

  async getPaymentMethod(id: string): Promise<PaymentMethodConfig | undefined> {
    const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return method || undefined;
  }

  async createPaymentMethod(method: InsertPaymentMethodConfig): Promise<PaymentMethodConfig> {
    const [created] = await db
      .insert(paymentMethods)
      .values(method)
      .returning();
    return created;
  }

  async updatePaymentMethod(id: string, updates: Partial<PaymentMethodConfig>): Promise<PaymentMethodConfig | undefined> {
    const [updated] = await db
      .update(paymentMethods)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  // Enhanced user management for admin
  async banUser(id: string): Promise<void> {
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async unbanUser(id: string): Promise<void> {
    await db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    // Note: In production, consider soft delete instead of hard delete
    // Delete related records first
    await db.delete(transactions).where(eq(transactions.userId, id));
    await db.delete(userInvestments).where(eq(userInvestments.userId, id));
    await db.delete(referrals).where(eq(referrals.referrerId, id));
    await db.delete(referrals).where(eq(referrals.referredUserId, id));
    await db.delete(dailyReturns).where(eq(dailyReturns.userId, id));
    await db.delete(supportChats).where(eq(supportChats.userId, id));

    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async cancelInvestment(id: string, reason: string): Promise<void> {
    await db
      .update(userInvestments)
      .set({ 
        status: "cancelled"
      })
      .where(eq(userInvestments.id, id));

    // Create a transaction record for the cancellation
    const investment = await db.select().from(userInvestments).where(eq(userInvestments.id, id)).limit(1);
    if (investment.length > 0) {
      await this.createTransaction({
        userId: investment[0].userId,
        type: "investment_cancelled",
        amount: "0",
        status: "completed",
        description: `Investment cancelled: ${reason}`,
        reference: id,
      });
    }
  }

  async getUserWithDetails(id: string): Promise<{
    user: User;
    transactions: Transaction[];
    investments: UserInvestment[];
    referrals: Referral[];
  } | undefined> {
    const user = await this.getUserById(id);
    if (!user) return undefined;

    const [transactionsList, investments, referrals] = await Promise.all([
      this.getTransactions(id),
      this.getUserInvestments(id),
      this.getUserReferrals(id)
    ]);

    return {
      user,
      transactions: transactionsList,
      investments,
      referrals
    };
  }

  // Database cleanup - Keep only users, clear everything else
  async resetDatabaseKeepUsers(): Promise<void> {
    // Clear all transactional data but keep users
    await db.delete(dailyReturns);
    await db.delete(transactions);
    await db.delete(userInvestments);
    await db.delete(referrals);
    await db.delete(supportChats);
    
    // Reset all user balances to 0
    await db.update(users).set({ 
      balance: "0"
    });

    console.log("Database reset completed - Only users retained with zero balances");
  }
}

export const storage = new DatabaseStorage();
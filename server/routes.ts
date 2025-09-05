import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  loginSchema, 
  registerSchema, 
  updateProfileSchema, 
  changePasswordSchema,
  withdrawalRequestSchema,
  paymentMethodSchema,
  paymentMethodConfigSchema,
  depositRequestSchema,
  supportChatSchema,
  supportMessageSchema
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Multer config for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"));
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Generate referral code
const generateReferralCode = () => {
  return `EV-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize investment plans with doubling system
  const initializePlans = async () => {
    try {
      const existingPlans = await storage.getInvestmentPlans();
      if (existingPlans.length === 0) {
        // Create doubling investment plans: 3k→6k→12k→24k→48k→96k up to 1 lakh
        const plans = [];
        let amount = 3000;
        let tier = 1;
        
        const planNames = [
          "Starter Plan", "Basic Plan", "Silver Plan", "Gold Plan", "Platinum Plan",
          "Diamond Plan", "Elite Plan", "Premium Plan", "Supreme Plan", "Ultimate Plan"
        ];
        
        while (amount <= 100000 && tier <= 6) {
          const dailyReturn = amount * 0.1; // 10% daily return
          const maxWithdrawal = dailyReturn; // Can withdraw daily return
          
          await storage.createInvestmentPlan({
            id: tier,
            name: planNames[tier - 1],
            amount: amount.toString(),
            dailyReturn: dailyReturn.toString(),
            maxWithdrawalPerDay: maxWithdrawal.toString(),
            tier,
          });
          
          console.log(`Created ${planNames[tier - 1]}: ₹${amount.toLocaleString()} → ₹${dailyReturn.toLocaleString()} daily`);
          
          // Double the amount for next tier
          amount = amount * 2;
          tier++;
        }
        
        console.log(`Created ${tier - 1} doubling investment plans from ₹3,000 to ₹96,000`);
      }
    } catch (error) {
      console.error("Error initializing plans:", error);
    }
  };

  // Initialize default admin user
  const initializeAdmin = async () => {
    try {
      const adminUser = await storage.getUserByEmail("admin@evinvestment.com");
      if (!adminUser) {
        await storage.createUser({
          username: "admin",
          email: "admin@evinvestment.com",
          password: "admin123",
          fullName: "System Administrator",
          phone: "+91 9999999999",
          referralCode: "ADMIN001",
          role: "admin",
          referredBy: undefined,
          balance: "0",
          totalDeposits: "0",
          totalWithdrawals: "0",
        });
        
        console.log("=".repeat(60));
        console.log("🔐 ADMIN PANEL ACCESS CREATED:");
        console.log("📧 Email: admin@evinvestment.com");
        console.log("🔒 Password: admin123");
        console.log("🔗 Admin URL: http://localhost:5000/admin");
        console.log("💡 You can change password from admin settings");
        console.log("=".repeat(60));
      } else {
        console.log("✅ Admin already exists - Use admin@evinvestment.com / admin123 at /admin");
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
    }
  };

  // Initialize default user
  const initializeDefaultUser = async () => {
    try {
      const defaultUser = await storage.getUserByEmail("rajesh.kumar@email.com");
      if (!defaultUser) {
        await storage.createUser({
          username: "rajeshkumar",
          email: "rajesh.kumar@email.com",
          password: "user123",
          fullName: "Rajesh Kumar",
          phone: "+91 9876543210",
          referralCode: "RAJESH001",
          role: "user",
          referredBy: undefined,
        });
        console.log("Default user created");
      }
    } catch (error) {
      console.error("Error creating default user:", error);
    }
  };

  // Initialize default payment methods
  const initializePaymentMethods = async () => {
    try {
      const existingMethods = await storage.getPaymentMethods();
      if (existingMethods.length === 0) {
        const defaultMethods = [
          {
            type: "google_pay" as const,
            name: "Google Pay",
            upiId: "merchant@googlepay",
            instructions: "Pay using Google Pay and upload screenshot",
            isActive: true,
            sortOrder: 1
          },
          {
            type: "phone_pe" as const,
            name: "PhonePe",
            upiId: "merchant@phonepe",
            instructions: "Pay using PhonePe and upload screenshot",
            isActive: true,
            sortOrder: 2
          },
          {
            type: "paytm" as const,
            name: "Paytm",
            upiId: "merchant@paytm",
            instructions: "Pay using Paytm and upload screenshot",
            isActive: true,
            sortOrder: 3
          },
          {
            type: "bank_transfer" as const,
            name: "Bank Transfer",
            bankAccountNumber: "1234567890",
            bankIfsc: "SBIN0000123",
            bankName: "State Bank of India",
            accountHolderName: "EV Investment Ltd",
            instructions: "Transfer to bank account and upload receipt",
            isActive: true,
            sortOrder: 4
          }
        ];

        for (const method of defaultMethods) {
          await storage.createPaymentMethod(method);
        }
        console.log("✅ Default payment methods created (Google Pay, PhonePe, Paytm, Bank Transfer)");
      }
    } catch (error) {
      console.error("Error creating payment methods:", error);
    }
  };

  await initializePlans();
  await initializeAdmin();
  await initializeDefaultUser();
  await initializePaymentMethods();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Handle referral
      let referredBy = undefined;
      if (data.referralCode) {
        const referrer = await storage.getUserByReferralCode(data.referralCode);
        if (referrer) {
          referredBy = referrer.referralCode;
        }
      }

      // Generate unique referral code
      const referralCode = `${data.username.toUpperCase()}${Date.now().toString().slice(-4)}`;
      
      const user = await storage.createUser({
        ...data,
        referralCode,
        referredBy,
      });

      // Create referral relationships if referred
      if (referredBy) {
        const referrer = await storage.getUserByReferralCode(referredBy);
        if (referrer) {
          // Level 1 referral
          await storage.createReferral(referrer.id, user.id, 1, "10.00");
          
          // Level 2 referral (if referrer was also referred)
          if (referrer.referredBy) {
            const level2Referrer = await storage.getUserByReferralCode(referrer.referredBy);
            if (level2Referrer) {
              await storage.createReferral(level2Referrer.id, user.id, 2, "2.00");
            }
          }
        }
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await storage.verifyPassword(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({ user: { ...req.user, password: undefined } });
  });

  // Investment plans
  app.get("/api/investment-plans", authenticateToken, async (req, res) => {
    try {
      const plans = await storage.getInvestmentPlans();
      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching investment plans:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // User investments
  app.get("/api/investments", authenticateToken, async (req: any, res) => {
    try {
      const investments = await storage.getUserInvestments(req.user.id);
      res.json(investments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/investments", authenticateToken, async (req: any, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const plan = await storage.getInvestmentPlan(parseInt(planId));
      
      if (!plan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }

      // Check if user has sufficient balance
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userBalance = parseFloat(user.balance || "0");
      const planAmount = parseFloat(plan.amount);

      if (userBalance < planAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct amount from balance
      await storage.updateUserBalance(req.user.id, `-${plan.amount}`);
      
      // Create investment
      const investment = await storage.createInvestment(req.user.id, plan.id, plan.amount);
      
      // Create transaction record
      await storage.createTransaction({
        userId: req.user.id,
        type: "investment",
        amount: plan.amount,
        status: "completed",
        description: `Investment in ${plan.name}`,
        reference: investment.id,
      });

      // Add first daily return immediately (same day investment)
      const dailyReturnAmount = plan.dailyReturn;
      
      // Add daily return to profit balance
      await storage.updateProfitBalance(req.user.id, dailyReturnAmount);
      
      // Create daily return transaction
      await storage.createTransaction({
        userId: req.user.id,
        type: "daily_return",
        amount: dailyReturnAmount,
        status: "completed",
        description: "Daily return from investment (Day 1)",
        reference: investment.id,
      });

      // Create daily return record
      const { db } = await import('./db');
      const { dailyReturns } = await import('@shared/schema');
      await db.insert(dailyReturns).values({
        investmentId: investment.id,
        userId: req.user.id,
        amount: dailyReturnAmount.toString(),
        processed: true,
      });

      // Process referral commission for investment (if user has referrer)
      if (user.referredBy) {
        await storage.processReferralCommission(req.user.id, plan.amount);
      }

      res.status(200).json({ 
        success: true, 
        investment,
        message: "Investment created successfully! Daily returns will start today."
      });
    } catch (error: any) {
      console.error("Investment creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create investment" });
    }
  });

  // Transactions
  app.get("/api/transactions", authenticateToken, async (req: any, res) => {
    try {
      const { type, status } = req.query;
      const transactions = await storage.getTransactions(req.user.id, type, status);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Deposit request with file upload support
  app.post("/api/deposit", upload.single('screenshot'), authenticateToken, async (req: any, res) => {
    try {
      const { amount, paymentMethod, transactionNumber } = req.body;
      const screenshot = req.file;
      
      console.log("Deposit request data:", { 
        amount, 
        paymentMethod, 
        transactionNumber,
        hasFile: !!screenshot,
        filePath: screenshot?.path,
        filename: screenshot?.filename,
        originalName: screenshot?.originalname
      });
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 100) {
        return res.status(400).json({ message: "Minimum deposit amount is ₹100" });
      }

      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }

      if (!transactionNumber || transactionNumber.trim().length === 0) {
        return res.status(400).json({ message: "Transaction number is required" });
      }

      if (!screenshot) {
        return res.status(400).json({ message: "Payment screenshot is required" });
      }

      // Generate unique transaction reference
      const transactionId = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      // Store the file path properly
      const screenshotPath = screenshot.path || screenshot.filename;
      console.log("Screenshot path stored:", screenshotPath);
      
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        type: "deposit",
        amount: amount.toString(),
        status: "pending",
        description: `${paymentMethod.toUpperCase().replace('_', ' ')} deposit of ₹${parseFloat(amount).toLocaleString()}`,
        reference: transactionId,
        paymentMethod: paymentMethod,
        paymentScreenshot: screenshotPath,
        transactionNumber: transactionNumber,
      });

      console.log("Transaction created with screenshot:", transaction.paymentScreenshot);
      res.json(transaction);
    } catch (error: any) {
      console.error("Deposit error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Enhanced withdrawal request with 5% fee and payment method selection
  app.post("/api/withdrawal", authenticateToken, async (req: any, res) => {
    try {
      const data = withdrawalRequestSchema.parse(req.body);
      const amount = parseFloat(data.amount);
      const fee = amount * 0.05; // 5% withdrawal fee
      const netAmount = amount - fee;
      const paymentMethod = data.paymentMethod;

      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate withdrawable balance (only daily returns, not deposited amounts)
      const userTransactions = await storage.getTransactions(req.user.id);
      const dailyReturns = userTransactions
        .filter(t => t.type === "daily_return" && t.status === "completed")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const previousWithdrawals = userTransactions
        .filter(t => t.type === "withdrawal" && (t.status === "approved" || t.status === "pending"))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
      const withdrawableBalance = dailyReturns - previousWithdrawals;

      if (withdrawableBalance < amount) {
        return res.status(400).json({ 
          message: `Insufficient withdrawable balance. You can only withdraw daily returns. Available: ₹${withdrawableBalance.toFixed(2)}` 
        });
      }

      // Check if user has completed their FIRST investment AND has no referrals
      const userInvestments = await storage.getUserInvestments(req.user.id);
      const completedInvestments = userInvestments.filter(inv => inv.status === 'completed');
      
      // Only apply referral restriction when user has completed their FIRST plan
      if (completedInvestments.length === 1) {
        const referrals = await storage.getReferralsByReferrer(req.user.id);
        const level1Referrals = referrals.filter(r => r.level === 1);
        
        if (level1Referrals.length < 2) {
          return res.status(400).json({ 
            message: "आपका पहला plan complete हो गया है! अब withdrawal के लिए 2 referrals करना जरूरी है। अपना referral code share करें!" 
          });
        }
      }

      // Check payment method configuration based on selected method
      if (paymentMethod === "upi" && !user.upiId) {
        return res.status(400).json({ 
          message: "Please configure your UPI ID first in profile settings" 
        });
      }

      if (paymentMethod === "bank" && (!user.accountNumber || !user.ifscCode)) {
        return res.status(400).json({ 
          message: "Please configure your bank account details first in profile settings" 
        });
      }

      // Create withdrawal transaction with 24-hour processing time
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: "withdrawal",
        amount: netAmount.toString(),
        status: "pending",
        description: `${paymentMethod.toUpperCase()} Withdrawal - ₹${amount} (Fee: ₹${fee.toFixed(2)}) - Processing Time: 24 hours`,
        reference: `withdrawal-${Date.now()}`,
        paymentMethod: paymentMethod,
      });

      // Create fee transaction
      await storage.createTransaction({
        userId: user.id,
        type: "withdrawal_fee",
        amount: fee.toString(),
        status: "completed",
        description: `Withdrawal processing fee (5% of ₹${amount})`,
        reference: transaction.id,
      });

      res.json({ 
        message: "Withdrawal request submitted successfully. Processing time: 24 hours",
        transaction,
        fee: fee.toFixed(2),
        netAmount: netAmount.toFixed(2),
        processingTime: "24 hours"
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Referrals
  app.get("/api/referrals", authenticateToken, async (req: any, res) => {
    try {
      const referrals = await storage.getReferralsByReferrer(req.user.id);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Profile management
  app.put("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, data);
      res.json({ user: { ...updatedUser, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/profile/password", authenticateToken, async (req: any, res) => {
    try {
      const data = changePasswordSchema.parse(req.body);
      
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await storage.verifyPassword(data.currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await storage.hashPassword(data.newPassword);
      await storage.updateUser(req.user.id, { password: hashedPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Profile photo upload
  app.post("/api/profile/photo", authenticateToken, upload.single("photo"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const photoPath = `/uploads/${req.file.filename}`;
      await storage.updateUser(req.user.id, { profilePhoto: photoPath });
      
      res.json({ photoPath });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  // Get telegram group link
  app.get("/api/config/telegram", async (req, res) => {
    try {
      const config = await storage.getPaymentConfig();
      const depositInstructions = config?.depositInstructions || '{}';
      const parsedInstructions = typeof depositInstructions === 'string' 
        ? JSON.parse(depositInstructions) 
        : depositInstructions;
      
      res.json({ 
        telegramGroupLink: parsedInstructions.telegram_group_link || "https://t.me/+YourGroupLinkHere"
      });
    } catch (error: any) {
      res.status(500).json({ 
        telegramGroupLink: "https://t.me/+YourGroupLinkHere"
      });
    }
  });

  // Admin route to update telegram group link
  app.put("/api/admin/config/telegram", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { telegramGroupLink } = req.body;
      
      if (!telegramGroupLink || !telegramGroupLink.includes('t.me')) {
        return res.status(400).json({ message: "Valid Telegram group link is required" });
      }

      const config = await storage.getPaymentConfig();
      const existingInstructions = config?.depositInstructions || '{}';
      const parsedInstructions = typeof existingInstructions === 'string' 
        ? JSON.parse(existingInstructions) 
        : existingInstructions;
      
      const updatedInstructions = {
        ...parsedInstructions,
        telegram_group_link: telegramGroupLink
      };

      await storage.updatePaymentConfig({
        depositInstructions: JSON.stringify(updatedInstructions)
      });

      res.json({ message: "Telegram group link updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin route to get payment config
  app.get("/api/admin/payment-config", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getPaymentConfig();
      res.json(config || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin route to update payment config  
  app.put("/api/admin/payment-config", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { upiId, qrCodeUrl, bankAccountNumber, bankIfsc, bankName, accountHolderName, depositInstructions } = req.body;
      
      await storage.updatePaymentConfig({
        upiId,
        qrCodeUrl,
        bankAccountNumber,
        bankIfsc,
        bankName,
        accountHolderName,
        depositInstructions,
      });

      res.json({ message: "Payment configuration updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user detailed profile by ID
  app.get("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's transactions and investments
      const transactions = await storage.getTransactions(id);
      const investments = await storage.getUserInvestments(id);
      const referrals = await storage.getUserReferrals(id);
      
      res.json({
        user: { ...user, password: undefined },
        transactions,
        investments,
        referrals
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update user details by admin
  app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Remove sensitive fields that shouldn't be updated directly
      delete updates.password;
      delete updates.id;
      
      await storage.updateUser(id, updates);
      res.json({ message: "User updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Change admin password
  app.put("/api/admin/change-password", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = req.user.id;
      
      const bcrypt = (await import("bcryptjs")).default;
      const admin = await storage.getUserById(adminId);
      
      if (!admin || !(await bcrypt.compare(currentPassword, admin.password))) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(adminId, { password: hashedNewPassword });
      
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/transactions", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { type, status } = req.query;
      const transactions = await storage.getTransactions(undefined, type as string, status as string);
      
      // Filter to show only deposits and withdrawals (hide profit/referral transactions)
      const filteredTransactions = transactions.filter((t: any) => 
        t.type === 'deposit' || t.type === 'withdrawal'
      );
      
      // For each transaction, get user details including payment info for withdrawals
      const transactionsWithUserDetails = await Promise.all(
        filteredTransactions.map(async (transaction) => {
          const user = await storage.getUserById(transaction.userId);
          
          // Fix screenshot URL path
          let screenshotUrl = transaction.paymentScreenshot;
          if (screenshotUrl && !screenshotUrl.startsWith('http')) {
            if (!screenshotUrl.startsWith('/')) {
              screenshotUrl = `/uploads/${screenshotUrl}`;
            }
          }
          
          return {
            ...transaction,
            paymentScreenshot: screenshotUrl,
            userDetails: user ? {
              fullName: user.fullName,
              email: user.email,
              phone: user.phone,
              upiId: user.upiId,
              accountHolderName: user.accountHolderName,
              accountNumber: user.accountNumber,
              ifscCode: user.ifscCode,
              bankName: user.bankName,
              referralCode: user.referralCode,
              balance: user.balance
            } : null,
            paymentMethodDetails: transaction.paymentMethod ? {
              method: transaction.paymentMethod,
              upiId: transaction.paymentMethod === 'upi' ? user?.upiId : null,
              accountNumber: transaction.paymentMethod === 'bank' ? user?.accountNumber : null,
              ifscCode: transaction.paymentMethod === 'bank' ? user?.ifscCode : null,
              bankName: transaction.paymentMethod === 'bank' ? user?.bankName : null,
              accountHolderName: transaction.paymentMethod === 'bank' ? user?.accountHolderName : null
            } : null
          };
        })
      );
      
      res.json(transactionsWithUserDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/transactions/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Validate rejection reason for rejected transactions
      if (status === "rejected" && (!adminNotes || adminNotes.trim().length < 5)) {
        return res.status(400).json({ message: "Rejection reason is required and must be at least 5 characters" });
      }

      // Get transaction details
      const transactions = await storage.getTransactions();
      const transaction = transactions.find(t => t.id === id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Update transaction status
      await storage.updateTransactionStatus(id, status, adminNotes);

      // If approved, update user balance for deposits
      if (status === "approved") {
        if (transaction.type === "deposit") {
          await storage.updateDepositBalance(transaction.userId, transaction.amount);
          
          // Process referral commission when deposit is approved
          await storage.processReferralCommission(transaction.userId, transaction.amount);
          
          // Update user's total deposits
          const user = await storage.getUserById(transaction.userId);
          if (user) {
            const newTotalDeposits = parseFloat(user.totalDeposits) + parseFloat(transaction.amount);
            await storage.updateUser(transaction.userId, { 
              totalDeposits: newTotalDeposits.toString() 
            });
          }
        } else if (transaction.type === "withdrawal") {
          // Deduct from balance and update total withdrawals
          await storage.updateUserBalance(transaction.userId, `-${transaction.amount}`);
          
          const user = await storage.getUserById(transaction.userId);
          if (user) {
            const newTotalWithdrawals = parseFloat(user.totalWithdrawals) + parseFloat(transaction.amount);
            await storage.updateUser(transaction.userId, { 
              totalWithdrawals: newTotalWithdrawals.toString() 
            });
          }
        }
      }

      res.json({ 
        message: `Transaction ${status} successfully`,
        transaction: {
          ...transaction,
          status,
          adminNotes
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/dashboard", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get comprehensive dashboard stats
  app.get("/api/admin/dashboard-detailed", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const transactions = await storage.getTransactions();
      const investments = await storage.getAllInvestments();
      
      const stats = {
        totalUsers: users.length,
        totalDeposits: transactions
          .filter(t => t.type === "deposit" && t.status === "approved")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalWithdrawals: transactions
          .filter(t => t.type === "withdrawal" && t.status === "approved")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalProfits: transactions
          .filter(t => t.type === "daily_return" && t.status === "completed")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalInvestments: investments
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
        pendingDeposits: transactions
          .filter(t => t.type === "deposit" && t.status === "pending").length,
        pendingWithdrawals: transactions
          .filter(t => t.type === "withdrawal" && t.status === "pending").length,
        activeInvestments: investments
          .filter(inv => inv.status === "active").length,
        completedInvestments: investments
          .filter(inv => inv.status === "completed").length,
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment methods for withdrawal
  app.put("/api/profile/payment-methods", authenticateToken, async (req: any, res) => {
    try {
      const data = paymentMethodSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, data);
      res.json({ user: { ...updatedUser, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get withdrawable balance for user
  app.get("/api/withdrawal/balance", authenticateToken, async (req: any, res) => {
    try {
      const userTransactions = await storage.getTransactions(req.user.id);
      const dailyReturns = userTransactions
        .filter(t => t.type === "daily_return" && t.status === "completed")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const previousWithdrawals = userTransactions
        .filter(t => t.type === "withdrawal" && (t.status === "approved" || t.status === "pending"))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
      const withdrawableBalance = dailyReturns - previousWithdrawals;
      
      res.json({ 
        withdrawableBalance: Math.max(0, withdrawableBalance).toFixed(2),
        totalDailyReturns: dailyReturns.toFixed(2),
        totalWithdrawn: previousWithdrawals.toFixed(2)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // Support system routes
  app.post("/api/support/chat", authenticateToken, async (req: any, res) => {
    try {
      const data = supportChatSchema.parse(req.body);
      const chat = await storage.createSupportChat(req.user.id, data.subject);
      res.json(chat);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/support/chats", authenticateToken, async (req: any, res) => {
    try {
      const chats = await storage.getSupportChats(req.user.id);
      res.json(chats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/support/chat/:chatId", authenticateToken, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const chat = await storage.getSupportChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Check if user owns this chat or is admin
      if (chat.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getSupportMessages(chatId);
      res.json({ chat, messages });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/support/chat/:chatId/message", authenticateToken, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const data = supportMessageSchema.parse(req.body);
      
      const chat = await storage.getSupportChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Check if user owns this chat or is admin
      if (chat.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const senderType = req.user.role === "admin" ? "admin" : "user";
      const message = await storage.createSupportMessage(chatId, req.user.id, senderType, data.message);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Payment configuration endpoint
  app.get("/api/payment-config", async (req, res) => {
    try {
      const config = await storage.getPaymentConfig();
      res.json(config);
    } catch (error: any) {
      console.error("Error fetching payment config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin support routes
  app.get("/api/admin/support/chats", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const chats = await storage.getSupportChats(); // Get all chats for admin
      res.json(chats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/support/messages/:chatId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { chatId } = req.params;
      const messages = await storage.getSupportMessages(chatId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/support/messages/:chatId", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const data = supportMessageSchema.parse(req.body);
      const message = await storage.createSupportMessage(chatId, req.user.id, "admin", data.message);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/support/chat/:chatId/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { chatId } = req.params;
      const { status } = req.body;
      await storage.updateSupportChatStatus(chatId, status);
      res.json({ message: "Chat status updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin add balance to user
  app.post("/api/admin/add-balance", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { userId, amount } = req.body;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBalance = (parseFloat(user.balance) + parseFloat(amount)).toString();
      await storage.updateUserBalance(userId, amount.toString());
      
      // Create transaction record
      await storage.createTransaction({
        userId: userId,
        type: "admin_credit",
        amount: amount.toString(),
        status: "completed",
        description: `Admin added balance: ₹${amount}`,
        reference: `admin-credit-${Date.now()}`,
      });
      
      res.json({ message: "Balance added successfully", newBalance });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Payment Methods Management APIs
  app.get("/api/admin/payment-methods", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/payment-methods", upload.single('qrCode'), authenticateToken, requireAdmin, async (req, res) => {
    try {
      let data = { ...req.body };
      
      // Convert string 'true'/'false' to boolean
      if (typeof data.isActive === 'string') {
        data.isActive = data.isActive === 'true';
      }
      if (typeof data.sortOrder === 'string') {
        data.sortOrder = parseInt(data.sortOrder) || 1;
      }
      
      // If QR code file uploaded, set the URL with full path
      if (req.file) {
        data.qrCodeUrl = `/uploads/${req.file.filename}`;
        console.log("QR Code uploaded:", data.qrCodeUrl);
      }
      
      const method = await storage.createPaymentMethod(data);
      res.json(method);
    } catch (error: any) {
      console.error("Payment method creation error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Helper middleware to handle optional file upload with better error handling
  const optionalUpload = (req: any, res: any, next: any) => {
    const contentType = req.headers['content-type'] || '';
    console.log('Content-Type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      upload.single('qrCode')(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Maximum 5MB allowed.' });
          }
          return res.status(400).json({ message: 'File upload error: ' + err.message });
        }
        next();
      });
    } else {
      next();
    }
  };

  app.put("/api/admin/payment-methods/:id", optionalUpload, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      let updates = { ...req.body };
      
      console.log('Payment method update request:', { id, body: req.body, file: req.file });
      
      // Convert string 'true'/'false' to boolean
      if (typeof updates.isActive === 'string') {
        updates.isActive = updates.isActive === 'true';
      }
      if (typeof updates.sortOrder === 'string') {
        updates.sortOrder = parseInt(updates.sortOrder) || 1;
      }
      
          // If QR code file uploaded, update the URL with full path
      if (req.file) {
        updates.qrCodeUrl = `/uploads/${req.file.filename}`;
        console.log("QR Code updated:", updates.qrCodeUrl);
      } else if (!updates.qrCodeUrl || updates.qrCodeUrl === 'undefined' || updates.qrCodeUrl === '') {
        // If no new file uploaded and no existing URL provided, preserve existing QR code URL
        // Remove qrCodeUrl from updates to prevent overwriting with undefined/null
        delete updates.qrCodeUrl;
        console.log("No new QR code file - preserving existing QR code");
      } else {
        console.log("Keeping provided QR code URL:", updates.qrCodeUrl);
      }
      
      const method = await storage.updatePaymentMethod(id, updates);
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      res.json(method);
    } catch (error: any) {
      console.error("Payment method update error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/payment-methods/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePaymentMethod(id);
      res.json({ message: "Payment method deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Enhanced User Management APIs
  app.put("/api/admin/users/:id/ban", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.banUser(id);
      res.json({ message: "User banned successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/users/:id/unban", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.unbanUser(id);
      res.json({ message: "User unbanned successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/details", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userDetails = await storage.getUserWithDetails(id);
      if (!userDetails) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(userDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public Payment Methods API (for users during deposit)
  app.get("/api/payment-methods", async (req, res) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced Deposit API with Screenshot Upload
  app.post("/api/deposit", authenticateToken, upload.single('screenshot'), async (req: any, res) => {
    try {
      const { amount, paymentMethod } = req.body;
      const userId = req.user.id;
      
      if (!amount || !paymentMethod) {
        return res.status(400).json({ message: "Amount and payment method are required" });
      }

      let screenshotUrl = null;
      if (req.file) {
        screenshotUrl = `/uploads/${req.file.filename}`;
      }

      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount,
        status: "pending",
        description: `Deposit via ${paymentMethod}`,
        paymentMethod,
        paymentScreenshot: screenshotUrl
      });

      res.json({ 
        transaction,
        message: "Deposit request submitted successfully. Please wait for admin approval." 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Cancel Investment Plan (Admin only)
  app.put("/api/admin/investments/:id/cancel", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await storage.cancelInvestment(id, reason || "Cancelled by admin");
      res.json({ message: "Investment cancelled successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete User (Admin only)
  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Reset Database - Keep only users (Admin only)
  app.post("/api/admin/reset-database", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.resetDatabaseKeepUsers();
      res.json({ message: "Database reset successfully - All users retained with clean slate" });
    } catch (error: any) {
      res.status(500).json({ message: "Database reset failed: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

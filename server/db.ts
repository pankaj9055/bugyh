import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'fs';
import path from 'path';

// Create database directory if it doesn't exist
const dbDir = path.dirname('./database.sqlite');
if (!fs.existsSync(dbDir) && dbDir !== '.') {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
const sqlite = new Database('./database.sqlite');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Initialize database with tables and seed data  
const initializeDatabase = async () => {
  try {
    // Create all tables using raw SQL (since we can't run migrations)
    sqlite.exec(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        balance TEXT NOT NULL DEFAULT '0',
        total_deposits TEXT NOT NULL DEFAULT '0',
        total_withdrawals TEXT NOT NULL DEFAULT '0',
        total_profit TEXT NOT NULL DEFAULT '0',
        current_tier INTEGER NOT NULL DEFAULT 1,
        referral_code TEXT NOT NULL UNIQUE,
        referred_by TEXT,
        profile_photo TEXT,
        upi_id TEXT,
        account_holder_name TEXT,
        account_number TEXT,
        ifsc_code TEXT,
        bank_name TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );

      -- Investment plans table
      CREATE TABLE IF NOT EXISTS investment_plans (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        amount TEXT NOT NULL,
        daily_return TEXT NOT NULL,
        max_withdrawal_per_day TEXT NOT NULL,
        duration_days INTEGER NOT NULL DEFAULT 20,
        tier INTEGER NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );

      -- User investments table
      CREATE TABLE IF NOT EXISTS user_investments (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        plan_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        daily_return REAL NOT NULL,
        total_returned REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        start_date INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        end_date INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );

      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        reference TEXT,
        payment_method TEXT,
        payment_screenshot TEXT,
        admin_notes TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );

      -- Referrals table
      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        referrer_id TEXT NOT NULL,
        referred_user_id TEXT NOT NULL,
        level INTEGER NOT NULL,
        commission_rate REAL NOT NULL,
        total_earned REAL NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );

      -- Daily returns table
      CREATE TABLE IF NOT EXISTS daily_returns (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        investment_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        return_date INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        processed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );

      -- Support chats table
      CREATE TABLE IF NOT EXISTS support_chats (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );

      -- Support messages table
      CREATE TABLE IF NOT EXISTS support_messages (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        chat_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );

      -- Payment methods table
      CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        upi_id TEXT,
        qr_code_url TEXT,
        bank_account_number TEXT,
        bank_ifsc TEXT,
        bank_name TEXT,
        account_holder_name TEXT,
        instructions TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
    `);
    
    console.log('✅ SQLite tables created successfully');
    
    // Seed investment plans if they don't exist
    const existingPlans = sqlite.prepare('SELECT COUNT(*) as count FROM investment_plans').get() as { count: number };
    
    if (existingPlans.count === 0) {
      console.log('📦 Seeding investment plans...');
      
      const insertPlan = sqlite.prepare(`
        INSERT INTO investment_plans (id, name, amount, daily_return, max_withdrawal_per_day, tier)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const plans = [
        { id: 1, name: "Starter Plan", amount: 3000, daily_return: 300, max_withdrawal_per_day: 300, tier: 1 },
        { id: 2, name: "Basic Plan", amount: 6000, daily_return: 600, max_withdrawal_per_day: 600, tier: 2 },
        { id: 3, name: "Standard Plan", amount: 12000, daily_return: 1200, max_withdrawal_per_day: 1200, tier: 3 },
        { id: 4, name: "Premium Plan", amount: 24000, daily_return: 2400, max_withdrawal_per_day: 2400, tier: 4 },
        { id: 5, name: "Gold Plan", amount: 48000, daily_return: 4800, max_withdrawal_per_day: 4800, tier: 5 },
        { id: 6, name: "Diamond Plan", amount: 96000, daily_return: 9600, max_withdrawal_per_day: 9600, tier: 6 }
      ];
      
      for (const plan of plans) {
        insertPlan.run(plan.id, plan.name, plan.amount, plan.daily_return, plan.max_withdrawal_per_day, plan.tier);
      }
      
      console.log('✅ Investment plans seeded successfully');
    }
    
    console.log('✅ SQLite database initialized successfully');
    
    // Now seed data using drizzle ORM
    await seedInitialData();
    
  } catch (error) {
    console.error('❌ Error creating SQLite tables:', error);
  }
};

// Seed initial data function
const seedInitialData = async () => {
  try {
    // Import schema and other modules inside function to avoid circular imports  
    const { db } = await import('./db');
    const { users, investmentPlans } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const bcrypt = (await import('bcryptjs')).default;
    
    // Check and create admin user
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, 'admin@evinvestment.com'));
    
    if (!existingAdmin) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.insert(users).values({
        username: 'admin',
        email: 'admin@evinvestment.com',
        password: hashedPassword,
        fullName: 'Admin User',
        phone: '9999999999',
        role: 'admin',
        referralCode: 'ADMIN001',
        balance: '0'
      });
      
      console.log('✅ Admin user created - Use admin@evinvestment.com / admin123 at /admin');
    }
    
    // Check and seed investment plans
    const existingPlansData = await db.select().from(investmentPlans);
    
    if (existingPlansData.length === 0) {
      console.log('📦 Seeding investment plans with drizzle...');
      
      const plansData = [
        { id: 1, name: "Starter Plan", amount: "3000", dailyReturn: "300", maxWithdrawalPerDay: "300", tier: 1 },
        { id: 2, name: "Basic Plan", amount: "6000", dailyReturn: "600", maxWithdrawalPerDay: "600", tier: 2 },
        { id: 3, name: "Standard Plan", amount: "12000", dailyReturn: "1200", maxWithdrawalPerDay: "1200", tier: 3 },
        { id: 4, name: "Premium Plan", amount: "24000", dailyReturn: "2400", maxWithdrawalPerDay: "2400", tier: 4 },
        { id: 5, name: "Gold Plan", amount: "48000", dailyReturn: "4800", maxWithdrawalPerDay: "4800", tier: 5 },
        { id: 6, name: "Diamond Plan", amount: "96000", dailyReturn: "9600", maxWithdrawalPerDay: "9600", tier: 6 }
      ];
      
      for (const plan of plansData) {
        await db.insert(investmentPlans).values(plan);
      }
      
      console.log('✅ Investment plans seeded successfully with drizzle ORM');
    }
    
  } catch (error) {
    console.error('❌ Error seeding initial data:', error);
  }
};

// Initialize database (async)
initializeDatabase();

export { sqlite };
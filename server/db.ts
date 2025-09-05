import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from "@shared/schema";
import { migrate } from 'drizzle-orm/neon-http/migrator';

// Neon database connection - hardcoded connection string
const connectionString = "postgresql://neondb_owner:npg_enNyPYF4H2VW@ep-small-unit-a8k45mqj-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

// Configure Neon with proper SSL handling for certificate issues
const sql = neon(connectionString, {
  fullResults: true
});

export const db = drizzle(sql, { schema });

// Initialize database with tables and seed data  
const initializeDatabase = async () => {
  try {
    // Run migrations to create tables
    console.log('🔄 Running database migrations...');
    await migrate(db, { migrationsFolder: 'migrations' });
    console.log('✅ PostgreSQL migrations completed successfully');
    
    // Now seed data using drizzle ORM
    await seedInitialData();
    
  } catch (error: any) {
    // Handle cases where tables already exist (common on restart)
    if (error.code === '42P07') {
      console.log('✅ Database tables already exist, skipping migration');
    } else {
      console.error('❌ Database initialization error:', error);
    }
    
    // Always try to seed initial data even if migration failed
    try {
      await seedInitialData();
    } catch (seedError) {
      console.log('ℹ️ Seeding completed or skipped');
    }
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

// Database initialized and ready to use
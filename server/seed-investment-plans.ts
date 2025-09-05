import { db } from "./db";
import { investmentPlans } from "@shared/schema";

async function seedInvestmentPlans() {
  console.log("Seeding investment plans...");
  
  // Delete existing plans first
  await db.delete(investmentPlans);
  
  // Create 10 investment plans as requested:
  // 3k→300rs daily, 6k→600rs daily, etc.
  const plans = [
    {
      id: 1,
      name: "Starter Plan",
      amount: "3000",
      dailyReturn: "300",
      durationDays: 20,
      maxWithdrawalPerDay: "300",
      tier: 1,
      isActive: true
    },
    {
      id: 2,
      name: "Basic Plan",
      amount: "6000",
      dailyReturn: "600",
      durationDays: 20,
      maxWithdrawalPerDay: "600",
      tier: 2,
      isActive: true
    },
    {
      id: 3,
      name: "Silver Plan",
      amount: "9000",
      dailyReturn: "900",
      durationDays: 20,
      maxWithdrawalPerDay: "900",
      tier: 3,
      isActive: true
    },
    {
      id: 4,
      name: "Gold Plan",
      amount: "12000",
      dailyReturn: "1200",
      durationDays: 20,
      maxWithdrawalPerDay: "1200",
      tier: 4,
      isActive: true
    },
    {
      id: 5,
      name: "Platinum Plan",
      amount: "15000",
      dailyReturn: "1500",
      durationDays: 20,
      maxWithdrawalPerDay: "1500",
      tier: 5,
      isActive: true
    },
    {
      id: 6,
      name: "Diamond Plan",
      amount: "18000",
      dailyReturn: "1800",
      durationDays: 20,
      maxWithdrawalPerDay: "1800",
      tier: 6,
      isActive: true
    },
    {
      id: 7,
      name: "Elite Plan",
      amount: "21000",
      dailyReturn: "2100",
      durationDays: 20,
      maxWithdrawalPerDay: "2100",
      tier: 7,
      isActive: true
    },
    {
      id: 8,
      name: "Premium Plan",
      amount: "24000",
      dailyReturn: "2400",
      durationDays: 20,
      maxWithdrawalPerDay: "2400",
      tier: 8,
      isActive: true
    },
    {
      id: 9,
      name: "Supreme Plan",
      amount: "27000",
      dailyReturn: "2700",
      durationDays: 20,
      maxWithdrawalPerDay: "2700",
      tier: 9,
      isActive: true
    },
    {
      id: 10,
      name: "Ultimate Plan",
      amount: "30000",
      dailyReturn: "3000",
      durationDays: 20,
      maxWithdrawalPerDay: "3000",
      tier: 10,
      isActive: true
    }
  ];

  // Insert all plans
  for (const plan of plans) {
    await db.insert(investmentPlans).values(plan);
  }
  
  console.log(`Created ${plans.length} investment plans successfully!`);
}

seedInvestmentPlans().catch(console.error);
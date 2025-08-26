import { db } from "./db";
import { users, transactions, supportChats, supportMessages, userInvestments } from "../shared/schema";
import bcrypt from "bcryptjs";

async function createTestData() {
  console.log("Creating test users and data...");

  const testUsers = [
    {
      username: "testuser1",
      email: "test1@example.com", 
      password: await bcrypt.hash("password123", 10),
      fullName: "राहुल शर्मा",
      phone: "9876543210",
      balance: "5000",
      referralCode: "REF001",
      currentTier: 1,
    },
    {
      username: "testuser2", 
      email: "test2@example.com",
      password: await bcrypt.hash("password123", 10),
      fullName: "प्रिया गुप्ता",
      phone: "9876543211", 
      balance: "8500",
      referralCode: "REF002",
      currentTier: 2,
    },
    {
      username: "testuser3",
      email: "test3@example.com",
      password: await bcrypt.hash("password123", 10), 
      fullName: "अमित कुमार",
      phone: "9876543212",
      balance: "12000",
      referralCode: "REF003", 
      currentTier: 3,
    },
    {
      username: "testuser4",
      email: "test4@example.com",
      password: await bcrypt.hash("password123", 10),
      fullName: "सुनीता देवी",
      phone: "9876543213", 
      balance: "3000",
      referralCode: "REF004",
      currentTier: 1,
    },
    {
      username: "testuser5",
      email: "test5@example.com",
      password: await bcrypt.hash("password123", 10),
      fullName: "विकास सिंह", 
      phone: "9876543214",
      balance: "15000",
      referralCode: "REF005",
      currentTier: 4,
    }
  ];

  // Create users
  const createdUsers = [];
  for (const userData of testUsers) {
    const [user] = await db.insert(users).values(userData).returning();
    createdUsers.push(user);
    console.log(`Created user: ${user.fullName} (${user.email})`);
  }

  // Create test transactions
  const testTransactions = [
    // Deposits
    {
      userId: createdUsers[0].id,
      type: "deposit",
      amount: "5000",
      status: "approved",
      description: "Initial deposit via Google Pay",
      reference: "deposit-001",
    },
    {
      userId: createdUsers[1].id, 
      type: "deposit",
      amount: "8500",
      status: "approved", 
      description: "Deposit via PhonePe",
      reference: "deposit-002",
    },
    {
      userId: createdUsers[2].id,
      type: "deposit", 
      amount: "12000",
      status: "approved",
      description: "Bank transfer deposit",
      reference: "deposit-003", 
    },
    // Withdrawals
    {
      userId: createdUsers[0].id,
      type: "withdrawal",
      amount: "1000", 
      status: "pending",
      description: "Withdrawal request",
      reference: "withdrawal-001",
    },
    {
      userId: createdUsers[1].id,
      type: "withdrawal", 
      amount: "2500",
      status: "approved",
      description: "Approved withdrawal",
      reference: "withdrawal-002", 
    },
    // Referral bonuses
    {
      userId: createdUsers[0].id,
      type: "referral",
      amount: "500",
      status: "completed", 
      description: "Referral bonus from user signup",
      reference: "referral-001",
    }
  ];

  for (const txData of testTransactions) {
    await db.insert(transactions).values(txData);
    console.log(`Created transaction: ${txData.type} - ₹${txData.amount} for ${txData.userId.slice(0, 8)}`);
  }

  // Create test support chats and messages
  const supportChatsData = [
    {
      userId: createdUsers[0].id,
      subject: "Account balance issue",
      status: "open",
      priority: "medium",
    },
    {
      userId: createdUsers[1].id, 
      subject: "Investment plan query",
      status: "open",
      priority: "low",
    },
    {
      userId: createdUsers[2].id,
      subject: "Withdrawal problem", 
      status: "closed",
      priority: "high",
    }
  ];

  const createdChats = [];
  for (const chatData of supportChatsData) {
    const [chat] = await db.insert(supportChats).values(chatData).returning();
    createdChats.push(chat);
    console.log(`Created support chat: ${chat.subject} for user ${chat.userId.slice(0, 8)}`);
  }

  // Add messages to support chats  
  const messagesData = [
    {
      chatId: createdChats[0].id,
      senderId: createdUsers[0].id,
      senderType: "user",
      message: "मेरे अकाउंट में balance सही नहीं दिख रहा है। कृपया help करें।",
    },
    {
      chatId: createdChats[0].id,
      senderId: "admin",
      senderType: "admin", 
      message: "हम आपकी समस्या देख रहे हैं। कृपया 24 घंटे प्रतीक्षा करें।",
    },
    {
      chatId: createdChats[1].id,
      senderId: createdUsers[1].id,
      senderType: "user",
      message: "Investment plan में कितना return मिलेगा?",
    },
    {
      chatId: createdChats[1].id,
      senderId: "admin", 
      senderType: "admin",
      message: "हमारे investment plans में आपको 10% daily return मिलता है।",
    }
  ];

  for (const msgData of messagesData) {
    await db.insert(supportMessages).values(msgData);
    console.log(`Added message to chat ${msgData.chatId.slice(0, 8)}`);
  }

  // Create test investments
  const investmentData = [
    {
      userId: createdUsers[0].id,
      planId: 1, // Assuming plan ID 1 exists
      amount: "3000",
      dailyReturn: "300",
      status: "active",
      startDate: new Date(),
    },
    {
      userId: createdUsers[1].id,
      planId: 2,
      amount: "12000", 
      dailyReturn: "1200",
      status: "active",
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    }
  ];

  for (const invData of investmentData) {
    await db.insert(userInvestments).values(invData);
    console.log(`Created investment: ₹${invData.amount} for user ${invData.userId.slice(0, 8)}`);
  }

  console.log("✅ Test data created successfully!");
  console.log("\nTest user credentials:");
  console.log("Email: test1@example.com | Password: password123 | Name: राहुल शर्मा");
  console.log("Email: test2@example.com | Password: password123 | Name: प्रिया गुप्ता"); 
  console.log("Email: test3@example.com | Password: password123 | Name: अमित कुमार");
  console.log("Email: test4@example.com | Password: password123 | Name: सुनीता देवी");
  console.log("Email: test5@example.com | Password: password123 | Name: विकास सिंह");
}

createTestData().catch(console.error);
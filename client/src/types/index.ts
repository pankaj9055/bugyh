export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  balance: string;
  totalDeposits: string;
  totalWithdrawals: string;
  totalProfit: string;
  referralCode: string;
  referredBy?: string;
  profilePhoto?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentPlan {
  id: number;
  name: string;
  amount: string;
  dailyReturn: string;
  maxWithdrawalPerDay: string;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface UserInvestment {
  id: string;
  userId: string;
  planId: number;
  amount: string;
  dailyReturn: string;
  totalReturned: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: string;
  status: string;
  description?: string;
  reference?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  level: number;
  commissionRate: string;
  totalEarned: string;
  createdAt: string;
}

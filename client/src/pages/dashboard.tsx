import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EarningsChart } from "@/components/charts/earnings-chart";
import { ActiveInvestments } from "@/components/dashboard/active-investments";
import { authService } from "@/lib/auth";
import { Link } from "wouter";
import { 
  Wallet, 
  ArrowDown, 
  ArrowUp, 
  Users, 
  PlusCircle, 
  Banknote,
  TrendingUp,
  Copy,
  Shield,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const user = authService.getUser();
  const isAdmin = authService.isAdmin();
  const { toast } = useToast();

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: investments = [], isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/investments"],
  });

  // Transform investments for ActiveInvestments component 
  const allInvestments = investments.map((inv: any) => {
    const startDate = new Date(inv.startDate);
    const daysElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 20 - daysElapsed);
    
    return {
      id: inv.id,
      planName: `₹${parseFloat(inv.amount).toLocaleString()} Plan`,
      amount: inv.amount,
      dailyReturn: inv.dailyReturn,
      totalReturned: inv.totalReturned || "0",
      status: inv.status,
      startDate: inv.startDate,
      endDate: inv.endDate,
      daysRemaining,
      totalDays: 20
    };
  });

  const activeInvestments = allInvestments.filter((inv: any) => inv.status === 'active');

  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ["/api/referrals"],
  });

  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAdmin,
  });

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast({
        title: "Success",
        description: "Referral code copied to clipboard!",
      });
    }
  };

  const earningsData = [
    { label: "Jan", value: 1200 },
    { label: "Feb", value: 1900 },
    { label: "Mar", value: 3000 },
    { label: "Apr", value: 5000 },
    { label: "May", value: 6500 },
    { label: "Jun", value: 8000 },
  ];

  const recentTransactions = Array.isArray(transactions) ? transactions.slice(0, 5) : [];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDown className="text-green-600" size={16} />;
      case "withdrawal":
        return <ArrowUp className="text-blue-600" size={16} />;
      case "referral":
        return <Users className="text-purple-600" size={16} />;
      case "daily_return":
        return <TrendingUp className="text-green-600" size={16} />;
      default:
        return <Wallet className="text-gray-600" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "approved":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <AppLayout>
      {/* Welcome Section */}
      <div className="mb-3 md:mb-5">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">
            Welcome back, <span className="text-gold-600">{user?.fullName?.split(' ')[0] || "User"}</span>!
          </h2>
          <p className="text-sm md:text-base text-gray-600">Manage your EV investments and track earnings</p>
        </div>

      {/* Balance Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
        <Card className="border-l-4 border-gold-400">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Balance</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">₹{parseFloat(user?.balance || "0").toLocaleString()}</p>
                </div>
                <div className="bg-gold-100 p-2 md:p-3 rounded-full">
                  <Wallet className="text-gold-600" size={16} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-green-400">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Deposits</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">₹{parseFloat(user?.totalDeposits || "0").toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-2 md:p-3 rounded-full">
                  <ArrowDown className="text-green-600" size={16} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-blue-400">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Withdrawals</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">₹{parseFloat(user?.totalWithdrawals || "0").toLocaleString()}</p>
                </div>
                <div className="bg-blue-100 p-2 md:p-3 rounded-full">
                  <ArrowUp className="text-blue-600" size={16} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-purple-400">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Profit</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">₹{parseFloat(user?.totalProfit || "0").toLocaleString()}</p>
                </div>
                <div className="bg-purple-100 p-2 md:p-3 rounded-full">
                  <Users className="text-purple-600" size={16} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <Link href="/deposit">
            <Button className="w-full h-20 md:h-24 gold-gradient hover:from-gold-600 hover:to-gold-700 text-white font-bold transform hover:scale-105 transition-all duration-200">
              <div className="text-center">
                <PlusCircle size={20} className="mx-auto mb-1 md:mb-2" />
                <div className="text-lg md:text-xl">Deposit</div>
                <div className="text-xs md:text-sm opacity-90">Add funds</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/withdrawal">
            <Button className="w-full h-20 md:h-24 navy-gradient hover:from-navy-600 hover:to-navy-700 text-white font-bold transform hover:scale-105 transition-all duration-200">
              <div className="text-center">
                <Banknote size={20} className="mx-auto mb-1 md:mb-2" />
                <div className="text-lg md:text-xl">Withdraw</div>
                <div className="text-xs md:text-sm opacity-90">Request funds</div>
              </div>
            </Button>
          </Link>
        </div>

      {/* Active Investments */}
      <div className="mb-6 md:mb-8">
        <ActiveInvestments investments={activeInvestments} isLoading={investmentsLoading} />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
        {/* Earnings Chart */}
        <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Earnings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <EarningsChart data={earningsData} />
            </CardContent>
          </Card>
          
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                  </div>
                ) : recentTransactions.length > 0 ? (
                  <>
                    {recentTransactions.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-full mr-3">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{transaction.type.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.type === 'withdrawal' ? '-' : '+'}₹{parseFloat(transaction.amount).toLocaleString()}
                          </span>
                          <p className={`text-xs ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">No transactions yet</p>
                )}
                <Button variant="outline" className="w-full text-gold-600 border-gold-200 hover:bg-gold-50">
                  <Link href="/history">View All Transactions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Referral Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Referral Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Your Referral Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gold-50 border-2 border-dashed border-gold-300 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gold-600 mb-2">{user?.referralCode}</div>
                <p className="text-sm text-gray-600 mb-3">Share this code to earn 10% commission</p>
                <Button 
                  onClick={copyReferralCode}
                  className="gold-gradient hover:from-gold-600 hover:to-gold-700 text-white"
                >
                  <Copy size={16} className="mr-2" />
                  Copy Code
                </Button>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Level 1 Referrals:</span>
                  <span className="font-semibold">{Array.isArray(referrals) ? referrals.filter((r: any) => r.level === 1).length : 0} users</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Level 2 Referrals:</span>
                  <span className="font-semibold">{Array.isArray(referrals) ? referrals.filter((r: any) => r.level === 2).length : 0} users</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Earned:</span>
                  <span className="font-semibold text-green-600">
                    ₹{Array.isArray(referrals) ? referrals.reduce((sum: number, r: any) => sum + parseFloat(r.totalEarned || "0"), 0).toLocaleString() : "0"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Active Investments</span>
                    <span className="text-lg font-bold text-green-600">
                      {Array.isArray(investments) ? investments.filter((inv: any) => inv.status === 'active').length : 0}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Pending Transactions</span>
                    <span className="text-lg font-bold text-blue-600">
                      {Array.isArray(transactions) ? transactions.filter((t: any) => t.status === 'pending').length : 0}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-800">Account Status</span>
                    <span className="text-lg font-bold text-purple-600">
                      {user?.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Admin Panel (only visible to admin users) */}
      {isAdmin && adminStats && (
          <Card className="mb-8 border-red-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-red-600 flex items-center">
                <Shield className="mr-2" size={20} />
                Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Pending Withdrawals</h4>
                  <p className="text-2xl font-bold text-red-600">{adminStats?.pendingWithdrawals || 0}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Total Users</h4>
                  <p className="text-2xl font-bold text-blue-600">{adminStats?.totalUsers || 0}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Total Volume</h4>
                  <p className="text-2xl font-bold text-green-600">₹{parseFloat(adminStats?.totalVolume || "0").toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link href="/admin">
                  <Button className="w-full gold-gradient hover:from-gold-600 hover:to-gold-700 text-white">
                    Open Admin Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
    </AppLayout>
  );
}

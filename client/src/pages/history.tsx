import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "@/lib/auth";
import { 
  History as HistoryIcon, 
  Download, 
  Search, 
  Filter,
  Calendar,
  ArrowDown,
  ArrowUp,
  Users,
  TrendingUp,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";

export default function History() {
  const user = authService.getUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

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
      case "investment":
        return <Wallet className="text-gold-600" size={16} />;
      default:
        return <AlertCircle className="text-gray-600" size={16} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="text-green-600" size={14} />;
      case "pending":
        return <Clock className="text-yellow-600" size={14} />;
      case "rejected":
        return <XCircle className="text-red-600" size={14} />;
      default:
        return <AlertCircle className="text-gray-600" size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAmountColor = (type: string, status: string) => {
    if (status === "rejected") return "text-gray-500";
    
    switch (type) {
      case "withdrawal":
        return "text-red-600";
      case "deposit":
      case "referral":
      case "daily_return":
        return "text-green-600";
      case "investment":
        return "text-blue-600";
      default:
        return "text-gray-900";
    }
  };

  const filteredTransactions = transactions?.filter((transaction: any) => {
    const matchesSearch = 
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.includes(searchTerm) ||
      (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === "all" || transaction.type === selectedType;
    const matchesStatus = selectedStatus === "all" || transaction.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const groupedByType = {
    all: filteredTransactions,
    deposits: filteredTransactions.filter((t: any) => t.type === "deposit"),
    withdrawals: filteredTransactions.filter((t: any) => t.type === "withdrawal"),
    investments: filteredTransactions.filter((t: any) => t.type === "investment"),
    referrals: filteredTransactions.filter((t: any) => t.type === "referral"),
    daily_returns: filteredTransactions.filter((t: any) => t.type === "daily_return"),
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Type,Amount,Status,Description\n" +
      filteredTransactions.map((t: any) => 
        `${new Date(t.createdAt).toLocaleDateString()},${t.type},${t.amount},${t.status},"${t.description || ""}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transaction_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateSummary = (transactions: any[]) => {
    const summary = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalInvestments: 0,
      totalReferrals: 0,
      totalReturns: 0,
    };

    transactions.forEach((t: any) => {
      const amount = parseFloat(t.amount || "0");
      if (t.status === "completed" || t.status === "approved") {
        switch (t.type) {
          case "deposit":
            summary.totalDeposits += amount;
            break;
          case "withdrawal":
            summary.totalWithdrawals += amount;
            break;
          case "investment":
            summary.totalInvestments += amount;
            break;
          case "referral":
            summary.totalReferrals += amount;
            break;
          case "daily_return":
            summary.totalReturns += amount;
            break;
        }
      }
    });

    return summary;
  };

  const summary = calculateSummary(filteredTransactions);

  return (
    <AppLayout>
        {/* Header */}
        <div className="mb-3 md:mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 flex items-center">
            <HistoryIcon className="mr-2 text-gold-600" size={24} />
            Transaction History
          </h1>
          <p className="text-sm md:text-base text-gray-600">View and manage all your transaction records</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 md:mb-6">
          <Card className="border-l-4 border-green-400">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Total Deposits</p>
                <p className="text-lg font-bold text-green-600">₹{summary.totalDeposits.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-red-400">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Total Withdrawals</p>
                <p className="text-lg font-bold text-red-600">₹{summary.totalWithdrawals.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-400">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Total Investments</p>
                <p className="text-lg font-bold text-blue-600">₹{summary.totalInvestments.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-400">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Referral Earnings</p>
                <p className="text-lg font-bold text-purple-600">₹{summary.totalReferrals.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-gold-400">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Daily Returns</p>
                <p className="text-lg font-bold text-gold-600">₹{summary.totalReturns.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="investment">Investments</option>
                <option value="referral">Referrals</option>
                <option value="daily_return">Daily Returns</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <Button onClick={exportData} variant="outline" className="flex items-center">
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({groupedByType.all.length})</TabsTrigger>
            <TabsTrigger value="deposits">Deposits ({groupedByType.deposits.length})</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals ({groupedByType.withdrawals.length})</TabsTrigger>
            <TabsTrigger value="investments">Investments ({groupedByType.investments.length})</TabsTrigger>
            <TabsTrigger value="referrals">Referrals ({groupedByType.referrals.length})</TabsTrigger>
            <TabsTrigger value="daily_returns">Returns ({groupedByType.daily_returns.length})</TabsTrigger>
          </TabsList>

          {Object.entries(groupedByType).map(([key, transactions]) => (
            <TabsContent key={key} value={key}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 capitalize">
                    {key === "all" ? "All Transactions" : key.replace("_", " ")} ({transactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <div className="bg-white p-2 rounded-full mr-4">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900 capitalize">
                                  {transaction.type.replace("_", " ")}
                                </p>
                                <div className="flex items-center">
                                  {getStatusIcon(transaction.status)}
                                  <Badge className={`ml-1 ${getStatusColor(transaction.status)}`} variant="secondary">
                                    {transaction.status}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                {new Date(transaction.createdAt).toLocaleDateString()} at{" "}
                                {new Date(transaction.createdAt).toLocaleTimeString()}
                              </p>
                              {transaction.description && (
                                <p className="text-xs text-gray-500 mt-1">{transaction.description}</p>
                              )}
                              {transaction.adminNotes && (
                                <p className="text-xs text-blue-600 mt-1">Admin: {transaction.adminNotes}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${getAmountColor(transaction.type, transaction.status)}`}>
                              {transaction.type === "withdrawal" || transaction.type === "investment" ? "-" : "+"}
                              ₹{parseFloat(transaction.amount).toLocaleString()}
                            </p>
                            {transaction.reference && (
                              <p className="text-xs text-gray-400">
                                Ref: {transaction.reference.slice(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <HistoryIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No {key === "all" ? "" : key.replace("_", " ")} transactions found</p>
                      <p className="text-sm text-gray-400">
                        {searchTerm ? "Try adjusting your search terms" : "Your transaction history will appear here"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
    </AppLayout>
  );
}

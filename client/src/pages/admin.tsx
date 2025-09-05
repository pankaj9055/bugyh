import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Search,
  Filter,
  TrendingUp,
  Wallet,
  Calendar
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: adminStats = {} } = useQuery({
    queryKey: ["/api/admin/dashboard"],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: allTransactions = [] } = useQuery({
    queryKey: ["/api/admin/transactions"],
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const res = await apiRequest("PUT", `/api/admin/transactions/${id}`, {
        status,
        adminNotes: notes,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setSelectedTransaction(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTransactionAction = (action: "approved" | "rejected") => {
    if (!selectedTransaction) return;

    updateTransactionMutation.mutate({
      id: selectedTransaction.id,
      status: action,
      notes: adminNotes,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="text-green-600" size={16} />;
      case "pending":
        return <Clock className="text-yellow-600" size={16} />;
      case "rejected":
        return <XCircle className="text-red-600" size={16} />;
      default:
        return <Clock className="text-gray-600" size={16} />;
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

  const pendingTransactions = allTransactions?.filter((t: any) => t.status === "pending") || [];
  const deposits = allTransactions?.filter((t: any) => t.type === "deposit") || [];
  const withdrawals = allTransactions?.filter((t: any) => t.type === "withdrawal") || [];

  const filteredTransactions = allTransactions?.filter((t: any) => {
    const matchesSearch = t.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.amount.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const exportData = () => {
    // Simple CSV export
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Transaction ID,User ID,Type,Amount,Status,Date,Admin Notes\n" +
      allTransactions?.map((t: any) => 
        `${t.id},${t.userId},${t.type},${t.amount},${t.status},${t.createdAt},"${t.adminNotes || ""}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Transaction data exported successfully!",
    });
  };

  return (
    <AppLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Shield className="mr-3 text-red-600" size={32} />
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage users, transactions, and platform operations</p>
        </div>

        {/* Stats Overview */}
        {adminStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-red-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Withdrawals</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.pendingWithdrawals}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <Clock className="text-red-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.totalUsers}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="text-blue-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-green-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Volume</p>
                    <p className="text-2xl font-bold text-gray-900">₹{parseFloat(adminStats.totalVolume || "0").toLocaleString()}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="text-green-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Pending Approvals */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Pending Transaction Approvals ({pendingTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {pendingTransactions.map((transaction: any) => (
                      <div key={transaction.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="bg-white p-2 rounded-full mr-3">
                              {getStatusIcon(transaction.status)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 capitalize">
                                {transaction.type} - ₹{parseFloat(transaction.amount).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                User: {transaction.userId} | {new Date(transaction.createdAt).toLocaleString()}
                              </p>
                              {transaction.description && (
                                <p className="text-xs text-gray-500">{transaction.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            <Eye size={14} className="mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                    <p className="text-gray-500">No pending approvals</p>
                    <p className="text-sm text-gray-400">All transactions are up to date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Transactions */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    All Transactions ({allTransactions?.length || 0})
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={exportData} variant="outline" size="sm">
                      <Download size={14} className="mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </div>
                
                {/* Filters */}
                <div className="flex space-x-4 mt-4">
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-full mr-3">
                          {getStatusIcon(transaction.status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {transaction.type} - ₹{parseFloat(transaction.amount).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            User: {transaction.userId}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                          {transaction.adminNotes && (
                            <p className="text-xs text-blue-600 mt-1">Notes: {transaction.adminNotes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        {transaction.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  User Management ({allUsers?.length || 0} users)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers?.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center mr-3">
                          <Users className="text-gray-600" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Balance: ₹{parseFloat(user.balance || "0").toLocaleString()} | 
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Deposit Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Deposits:</span>
                      <span className="font-semibold">
                        ₹{deposits.reduce((sum: number, d: any) => sum + parseFloat(d.amount || "0"), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved:</span>
                      <span className="font-semibold text-green-600">
                        {deposits.filter((d: any) => d.status === "approved").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending:</span>
                      <span className="font-semibold text-yellow-600">
                        {deposits.filter((d: any) => d.status === "pending").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Withdrawal Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Withdrawals:</span>
                      <span className="font-semibold">
                        ₹{withdrawals.reduce((sum: number, w: any) => sum + parseFloat(w.amount || "0"), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved:</span>
                      <span className="font-semibold text-green-600">
                        {withdrawals.filter((w: any) => w.status === "approved").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending:</span>
                      <span className="font-semibold text-yellow-600">
                        {withdrawals.filter((w: any) => w.status === "pending").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Transaction Review Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Review Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Transaction Details</p>
                    <div className="bg-gray-50 p-3 rounded-lg mt-1">
                      <p className="font-medium">Type: {selectedTransaction.type}</p>
                      <p>Amount: ₹{parseFloat(selectedTransaction.amount).toLocaleString()}</p>
                      <p>User: {selectedTransaction.userId}</p>
                      <p>Date: {new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                      {selectedTransaction.description && (
                        <p>Description: {selectedTransaction.description}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes
                    </label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this transaction..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleTransactionAction("approved")}
                      disabled={updateTransactionMutation.isPending}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleTransactionAction("rejected")}
                      disabled={updateTransactionMutation.isPending}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      <XCircle size={16} className="mr-1" />
                      Reject
                    </Button>
                  </div>

                  <Button
                    onClick={() => setSelectedTransaction(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </AppLayout>
  );
}

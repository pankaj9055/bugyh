import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { useLocation } from "wouter";
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
  Calendar,
  Settings,
  LogOut,
  Key,
  User,
  Phone,
  Mail,
  Building2,
  Smartphone,
  MessageCircle,
  ExternalLink,
  Edit,
  Save,
  Loader2,
  ArrowUp,
  ArrowDown,
  UserPlus,
  FileText,
  CreditCard,
  BarChart3,
  Copy
} from "lucide-react";
import { AdminSupportChat } from "@/components/admin-support-chat";
import { format } from 'date-fns';

const paymentConfigSchema = z.object({
  upiId: z.string().min(1, "UPI ID is required"),
  qrCodeUrl: z.string().optional(),
  bankAccountNumber: z.string().min(1, "Bank account number is required"),
  bankIfsc: z.string().min(1, "IFSC code is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  depositInstructions: z.string().optional(),
});

const paymentMethodSchema = z.object({
  type: z.enum(["google_pay", "phone_pe", "paytm", "bank_transfer"]),
  name: z.string().min(1, "Name is required"),
  upiId: z.string().optional(),
  qrCodeUrl: z.union([z.string(), z.instanceof(File)]).optional(), // Allow both string URLs and File objects
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  instructions: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(1),
});

const telegramConfigSchema = z.object({
  telegramGroupLink: z.string().url("Valid Telegram group link is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const userUpdateSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  balance: z.string().min(0, "Balance must be positive"),
  upiId: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
});

type PaymentConfigForm = z.infer<typeof paymentConfigSchema>;
type PaymentMethodForm = z.infer<typeof paymentMethodSchema>;
type TelegramConfigForm = z.infer<typeof telegramConfigSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
type UserUpdateForm = z.infer<typeof userUpdateSchema>;

export default function AdminNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Queries
  const { data: adminStats = {} } = useQuery<any>({
    queryKey: ["/api/admin/dashboard-detailed"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/transactions"],
  });

  const { data: paymentConfig } = useQuery<any>({
    queryKey: ["/api/admin/payment-config"],
  });

  const { data: paymentMethods = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/payment-methods"],
  });

  const { data: userDetails = {} } = useQuery<any>({
    queryKey: ["/api/admin/users", selectedUser?.id],
    enabled: !!selectedUser?.id,
  });

  // Forms
  const paymentForm = useForm<PaymentConfigForm>({
    resolver: zodResolver(paymentConfigSchema),
  });

  const paymentMethodForm = useForm<PaymentMethodForm>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: "google_pay",
      name: "",
      upiId: "",
      qrCodeUrl: "",
      isActive: true,
      sortOrder: 1,
    },
  });

  const telegramForm = useForm<TelegramConfigForm>({
    resolver: zodResolver(telegramConfigSchema),
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const userUpdateForm = useForm<UserUpdateForm>({
    resolver: zodResolver(userUpdateSchema),
  });

  // Mutations
  const updatePaymentConfigMutation = useMutation({
    mutationFn: async (data: PaymentConfigForm) => {
      const res = await apiRequest("PUT", "/api/admin/payment-config", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment configuration updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-config"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTelegramMutation = useMutation({
    mutationFn: async (data: TelegramConfigForm) => {
      const res = await apiRequest("PUT", "/api/admin/config/telegram", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Telegram group link updated successfully!" });
      telegramForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const res = await apiRequest("PUT", "/api/admin/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password changed successfully!" });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const res = await apiRequest("PUT", `/api/admin/transactions/${id}`, { status, adminNotes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transaction updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-detailed"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UserUpdateForm }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const res = await apiRequest("POST", `/api/admin/add-balance`, {
        userId,
        amount
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Balance added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPaymentMethodMutation = useMutation({
    mutationFn: async (data: PaymentMethodForm) => {
      const formData = new FormData();
      let hasFile = false;
      
      Object.keys(data).forEach(key => {
        if (key === 'qrCodeUrl' && (data as any)[key] && typeof (data as any)[key] === 'object' && (data as any)[key] instanceof File) {
          formData.append('qrCode', (data as any)[key]);
          hasFile = true;
          console.log('Appending QR code file for creation:', ((data as any)[key] as File).name);
        } else if (data[key as keyof PaymentMethodForm] !== undefined && data[key as keyof PaymentMethodForm] !== null && !((data[key as keyof PaymentMethodForm] as any) instanceof File)) {
          formData.append(key, String(data[key as keyof PaymentMethodForm]));
        }
      });
      
      console.log('Creating payment method with file:', hasFile);
      const res = await apiRequest("POST", "/api/admin/payment-methods", formData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment method added successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
      setIsPaymentMethodDialogOpen(false);
      paymentMethodForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentMethodForm> }) => {
      const formData = new FormData();
      let hasNewFile = false;
      
      Object.keys(data).forEach(key => {
        if (key === 'qrCodeUrl' && (data as any)[key] && typeof (data as any)[key] === 'object' && (data as any)[key] instanceof File) {
          formData.append('qrCode', (data as any)[key]);
          hasNewFile = true;
          console.log('Appending new QR code file for update:', ((data as any)[key] as File).name);
        } else if (data[key as keyof Partial<PaymentMethodForm>] !== undefined && data[key as keyof Partial<PaymentMethodForm>] !== null && !((data[key as keyof Partial<PaymentMethodForm>] as any) instanceof File)) {
          formData.append(key, String(data[key as keyof Partial<PaymentMethodForm>]));
        }
      });
      
      console.log('Updating payment method', id, 'with new file:', hasNewFile);
      const res = await apiRequest("PUT", `/api/admin/payment-methods/${id}`, formData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment method updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
      setIsPaymentMethodDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/payment-methods/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment method deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelInvestmentMutation = useMutation({
    mutationFn: async ({id, reason}: {id: string, reason: string}) => {
      const res = await apiRequest("PUT", `/api/admin/investments/${id}/cancel`, {reason});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Investment cancelled successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetDatabaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/reset-database");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Database reset successfully! All users retained with clean slate." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Helper functions
  const handleLogout = () => {
    authService.logout();
    setLocation("/login");
  };

  const filteredUsers = users.filter((user: any) =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const pendingTransactions = transactions.filter((t: any) => t.status === "pending");
  const pendingDeposits = pendingTransactions.filter((t: any) => t.type === "deposit");
  const pendingWithdrawals = pendingTransactions.filter((t: any) => t.type === "withdrawal");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="text-green-600" size={16} />;
      case "rejected": return <XCircle className="text-red-600" size={16} />;
      case "pending": return <Clock className="text-yellow-600" size={16} />;
      default: return <Clock className="text-gray-600" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const openUserDetails = (user: any) => {
    setSelectedUser(user);
    userUpdateForm.reset({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      balance: user.balance || "0",
      upiId: user.upiId || "",
      accountNumber: user.accountNumber || "",
      ifscCode: user.ifscCode || "",
    });
    setIsUserDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="mr-3 text-gold-600" size={32} />
              Admin Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Complete platform management and control</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))()}
              variant="outline"
              size="sm"
            >
              <Key className="mr-2" size={16} />
              Change Password
            </Button>
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut className="mr-2" size={16} />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="border-l-4 border-blue-400">
            <CardContent className="p-3">
              <div className="text-center">
                <Users className="mx-auto text-blue-600 mb-1" size={20} />
                <p className="text-xs text-gray-600">Total Users</p>
                <p className="text-lg font-bold text-blue-600">{adminStats?.totalUsers || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-400">
            <CardContent className="p-3">
              <div className="text-center">
                <ArrowDown className="mx-auto text-green-600 mb-1" size={20} />
                <p className="text-xs text-gray-600">Total Deposits</p>
                <p className="text-lg font-bold text-green-600">₹{adminStats?.totalDeposits?.toLocaleString() || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-red-400">
            <CardContent className="p-3">
              <div className="text-center">
                <ArrowUp className="mx-auto text-red-600 mb-1" size={20} />
                <p className="text-xs text-gray-600">Total Withdrawals</p>
                <p className="text-lg font-bold text-red-600">₹{adminStats?.totalWithdrawals?.toLocaleString() || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-400">
            <CardContent className="p-3">
              <div className="text-center">
                <TrendingUp className="mx-auto text-purple-600 mb-1" size={20} />
                <p className="text-xs text-gray-600">Total Investments</p>
                <p className="text-lg font-bold text-purple-600">₹{adminStats?.totalInvestments?.toLocaleString() || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-yellow-400">
            <CardContent className="p-3">
              <div className="text-center">
                <Clock className="mx-auto text-yellow-600 mb-1" size={20} />
                <p className="text-xs text-gray-600">Pending Deposits</p>
                <p className="text-lg font-bold text-yellow-600">{adminStats?.pendingDeposits || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-orange-400">
            <CardContent className="p-3">
              <div className="text-center">
                <Clock className="mx-auto text-orange-600 mb-1" size={20} />
                <p className="text-xs text-gray-600">Pending Withdrawals</p>
                <p className="text-lg font-bold text-orange-600">{adminStats?.pendingWithdrawals || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-emerald-400">
            <CardContent className="p-3">
              <div className="text-center">
                <BarChart3 className="mx-auto text-emerald-600 mb-1" size={20} />
                <p className="text-xs text-gray-600">Active Investments</p>
                <p className="text-lg font-bold text-emerald-600">{adminStats?.activeInvestments || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-indigo-400">
            <CardContent className="p-3">
              <div className="text-center">
                <CheckCircle className="mx-auto text-indigo-600 mb-1" size={20} />
                <p className="text-xs text-gray-600">Completed Investments</p>
                <p className="text-lg font-bold text-indigo-600">{adminStats?.completedInvestments || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-gold-400">
            <CardContent className="p-3">
              <div className="text-center">
                <TrendingUp className="mx-auto text-gold-600 mb-1" size={20} />
                <p className="text-xs text-gray-600">Total Profits</p>
                <p className="text-lg font-bold text-gold-600">₹{adminStats?.totalProfits?.toLocaleString() || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Deposits & Withdrawals</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 text-gold-600" size={24} />
                    User Management ({users.length} total)
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">User</th>
                        <th className="text-left p-2">Contact</th>
                        <th className="text-left p-2">Balance</th>
                        <th className="text-left p-2">Total Deposits</th>
                        <th className="text-left p-2">Total Withdrawals</th>
                        <th className="text-left p-2">Joined</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user: any) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.profilePhoto} />
                                <AvatarFallback>{user.fullName?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.fullName}</p>
                                <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <p className="text-sm">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.phone}</p>
                          </td>
                          <td className="p-2">
                            <p className="font-bold text-green-600">₹{parseFloat(user.balance || "0").toLocaleString()}</p>
                          </td>
                          <td className="p-2">
                            <p className="text-blue-600">₹{parseFloat(user.totalDeposits || "0").toLocaleString()}</p>
                          </td>
                          <td className="p-2">
                            <p className="text-red-600">₹{parseFloat(user.totalWithdrawals || "0").toLocaleString()}</p>
                          </td>
                          <td className="p-2">
                            <p className="text-xs">{new Date(user.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="p-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openUserDetails(user)}
                              className="mr-2"
                            >
                              <Eye size={14} className="mr-1" />
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposits & Withdrawals */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Deposits Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowDown className="mr-2 text-green-600" size={24} />
                    Deposits ({transactions.filter((t: any) => t.type === 'deposit').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.filter((t: any) => t.type === 'deposit').map((deposit: any) => (
                    <div key={deposit.id} className={`border rounded-lg p-4 ${
                      deposit.status === 'pending' ? 'border-yellow-300 bg-yellow-50' : 
                      deposit.status === 'approved' ? 'border-green-300 bg-green-50' : 
                      'border-red-300 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="bg-white p-2 rounded-full mr-3 shadow-sm">
                            {getStatusIcon(deposit.status)}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">₹{parseFloat(deposit.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{deposit.userDetails?.fullName || 'Unknown User'}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(deposit.status)}>
                          {deposit.status}
                        </Badge>
                      </div>
                      
                      {/* User & Transaction Info */}
                      <div className="space-y-1 text-xs text-gray-600 mb-3">
                        <p>📧 {deposit.userDetails?.email}</p>
                        <p>📱 {deposit.userDetails?.phone}</p>
                        <p>🆔 {deposit.transactionNumber || 'No TXN ID'}</p>
                        <p>📅 {new Date(deposit.createdAt).toLocaleString()}</p>
                        {deposit.paymentMethod && <p>💳 {deposit.paymentMethod}</p>}
                      </div>

                      {/* Screenshot indicator */}
                      {deposit.paymentScreenshot && (
                        <div className="mb-3">
                          <p className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block">
                            📷 Screenshot uploaded
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-blue-600 border-blue-300"
                          onClick={() => {
                            setSelectedTransaction(deposit);
                            setIsTransactionDialogOpen(true);
                          }}
                        >
                          <Eye size={14} className="mr-1" />
                          Review Details
                        </Button>
                        
                        {deposit.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateTransactionMutation.mutate({
                                id: deposit.id,
                                status: "approved"
                              })}
                            >
                              ✅ Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {transactions.filter((t: any) => t.type === 'deposit').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ArrowDown className="mx-auto mb-3 text-gray-400" size={48} />
                      <p>No deposits found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Withdrawals Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowUp className="mr-2 text-red-600" size={24} />
                    Withdrawals ({transactions.filter((t: any) => t.type === 'withdrawal').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.filter((t: any) => t.type === 'withdrawal').map((withdrawal: any) => (
                    <div key={withdrawal.id} className={`border rounded-lg p-4 ${
                      withdrawal.status === 'pending' ? 'border-yellow-300 bg-yellow-50' : 
                      withdrawal.status === 'approved' ? 'border-green-300 bg-green-50' : 
                      'border-red-300 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="bg-white p-2 rounded-full mr-3 shadow-sm">
                            {getStatusIcon(withdrawal.status)}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">₹{parseFloat(withdrawal.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{withdrawal.userDetails?.fullName || 'Unknown User'}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(withdrawal.status)}>
                          {withdrawal.status}
                        </Badge>
                      </div>
                      
                      {/* User & Transaction Info */}
                      <div className="space-y-1 text-xs text-gray-600 mb-3">
                        <p>📧 {withdrawal.userDetails?.email}</p>
                        <p>📱 {withdrawal.userDetails?.phone}</p>
                        <p>🆔 {withdrawal.transactionNumber || 'No TXN ID'}</p>
                        <p>📅 {new Date(withdrawal.createdAt).toLocaleString()}</p>
                      </div>

                      {/* Payment Method Info */}
                      {withdrawal.userDetails?.upiId && (
                        <div className="mb-3 p-2 bg-blue-50 rounded border">
                          <p className="text-xs text-gray-600">UPI Payment:</p>
                          <p className="font-mono text-sm font-semibold text-blue-600">{withdrawal.userDetails.upiId}</p>
                        </div>
                      )}
                      
                      {withdrawal.userDetails?.accountNumber && (
                        <div className="mb-3 p-2 bg-purple-50 rounded border">
                          <p className="text-xs text-gray-600">Bank Transfer:</p>
                          <p className="text-sm"><strong>Account:</strong> {withdrawal.userDetails.accountNumber}</p>
                          <p className="text-sm"><strong>IFSC:</strong> {withdrawal.userDetails.ifscCode}</p>
                          <p className="text-sm"><strong>Bank:</strong> {withdrawal.userDetails.bankName}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-blue-600 border-blue-300"
                          onClick={() => {
                            setSelectedTransaction(withdrawal);
                            setIsTransactionDialogOpen(true);
                          }}
                        >
                          <Eye size={14} className="mr-1" />
                          Review Details
                        </Button>
                        
                        {withdrawal.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateTransactionMutation.mutate({
                                id: withdrawal.id,
                                status: "approved"
                              })}
                            >
                              ✅ Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {transactions.filter((t: any) => t.type === 'withdrawal').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ArrowUp className="mx-auto mb-3 text-gray-400" size={48} />
                      <p>No withdrawals found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Actions */}
          <TabsContent value="pending" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pending Deposits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowDown className="mr-2 text-green-600" size={20} />
                    Pending Deposits ({pendingDeposits.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingDeposits.map((deposit: any) => (
                    <div key={deposit.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-white p-2 rounded-full mr-3">
                            {getStatusIcon(deposit.status)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {deposit.type} - ₹{parseFloat(deposit.amount).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              User: {deposit.userDetails?.fullName || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Email: {deposit.userDetails?.email} | Phone: {deposit.userDetails?.phone}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(deposit.createdAt).toLocaleString()}
                            </p>
                            {deposit.paymentScreenshot && (
                              <p className="text-xs text-blue-600 mt-1">📷 Screenshot uploaded</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(deposit.status)}>
                            {deposit.status}
                          </Badge>
                          <Button
                            onClick={() => {
                              setSelectedTransaction(deposit);
                              setIsTransactionDialogOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Eye size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingDeposits.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No pending deposits</p>
                  )}
                </CardContent>
              </Card>

              {/* Pending Withdrawals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowUp className="mr-2 text-red-600" size={20} />
                    Pending Withdrawals ({pendingWithdrawals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingWithdrawals.map((withdrawal: any) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">₹{parseFloat(withdrawal.amount).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{withdrawal.userEmail}</p>
                        <p className="text-xs text-gray-400">{new Date(withdrawal.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600"
                          onClick={() => {
                            setSelectedTransaction(withdrawal);
                            setIsTransactionDialogOpen(true);
                          }}
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingWithdrawals.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No pending withdrawals</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Support Chat Management */}
          <TabsContent value="support" className="space-y-4">
            <AdminSupportChat />
          </TabsContent>

          {/* Payment Methods Management */}
          <TabsContent value="payment-methods" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 text-gold-600" size={24} />
                    Payment Methods Management
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedPaymentMethod(null);
                      paymentMethodForm.reset({
                        type: "google_pay",
                        name: "",
                        isActive: true,
                        sortOrder: 1,
                      });
                      setIsPaymentMethodDialogOpen(true);
                    }}
                    className="gold-gradient"
                  >
                    <UserPlus className="mr-2" size={16} />
                    Add Payment Method
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paymentMethods.map((method: any) => (
                    <Card key={method.id} className={`border-2 ${method.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {method.type === 'google_pay' && <span className="text-2xl mr-2">📱</span>}
                            {method.type === 'phone_pe' && <span className="text-2xl mr-2">💜</span>}
                            {method.type === 'paytm' && <span className="text-2xl mr-2">💙</span>}
                            {method.type === 'bank_transfer' && <span className="text-2xl mr-2">🏦</span>}
                            <div>
                              <h3 className="font-semibold">{method.name}</h3>
                              <p className="text-xs text-gray-500">{method.type.replace('_', ' ').toUpperCase()}</p>
                            </div>
                          </div>
                          <Badge className={method.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {method.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {/* Show UPI ID for UPI methods only */}
                        {method.type !== 'bank_transfer' && method.upiId && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-600">UPI ID:</p>
                            <p className="text-sm font-mono">{method.upiId}</p>
                          </div>
                        )}

                        {/* Show QR Code if available */}
                        {method.qrCodeUrl && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-600 mb-1">QR Code:</p>
                            <div className="flex justify-center">
                              <img 
                                src={method.qrCodeUrl.startsWith('http') 
                                  ? method.qrCodeUrl 
                                  : method.qrCodeUrl.startsWith('/') 
                                    ? method.qrCodeUrl 
                                    : `/uploads/${method.qrCodeUrl}`
                                } 
                                alt="Payment QR Code" 
                                className="w-full max-w-[120px] h-auto aspect-square object-contain rounded-lg border-2 border-gray-200 cursor-pointer hover:scale-105 hover:border-gold-300 transition-all duration-300 shadow-sm hover:shadow-md"
                                onClick={() => {
                                  const qrUrl = method.qrCodeUrl.startsWith('http') 
                                    ? method.qrCodeUrl 
                                    : method.qrCodeUrl.startsWith('/') 
                                      ? method.qrCodeUrl 
                                      : `/uploads/${method.qrCodeUrl}`;
                                  window.open(qrUrl, '_blank');
                                }}
                                onError={(e) => {
                                  console.error('QR Code failed to load:', method.qrCodeUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Show bank details for bank_transfer only */}
                        {method.type === 'bank_transfer' && (
                          <div className="space-y-2">
                            {method.bankAccountNumber && (
                              <div className="mb-1">
                                <p className="text-xs text-gray-600">Account:</p>
                                <p className="text-sm font-mono">{method.bankAccountNumber}</p>
                              </div>
                            )}
                            {method.bankIfsc && (
                              <div className="mb-1">
                                <p className="text-xs text-gray-600">IFSC:</p>
                                <p className="text-sm font-mono">{method.bankIfsc}</p>
                              </div>
                            )}
                            {method.bankName && (
                              <div className="mb-1">
                                <p className="text-xs text-gray-600">Bank:</p>
                                <p className="text-sm">{method.bankName}</p>
                              </div>
                            )}
                            {method.accountHolderName && (
                              <div className="mb-1">
                                <p className="text-xs text-gray-600">A/c Holder:</p>
                                <p className="text-sm">{method.accountHolderName}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPaymentMethod(method);
                              // Map API fields to form fields properly - preserve existing QR code URL
                              paymentMethodForm.reset({
                                type: method.type,
                                name: method.name,
                                upiId: method.upiId || "",
                                qrCodeUrl: method.qrCodeUrl || "", // Preserve existing QR code URL
                                bankAccountNumber: method.bankAccountNumber || "",
                                bankIfsc: method.bankIfsc || "",
                                bankName: method.bankName || "",
                                accountHolderName: method.accountHolderName || "",
                                instructions: method.instructions || "",
                                isActive: method.isActive,
                                sortOrder: method.sortOrder || 1,
                              });
                              console.log('Editing payment method with QR code:', method.qrCodeUrl);
                              setIsPaymentMethodDialogOpen(true);
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={method.isActive ? 'text-red-600' : 'text-green-600'}
                            onClick={() => updatePaymentMethodMutation.mutate({
                              id: method.id,
                              data: { isActive: !method.isActive }
                            })}
                          >
                            {method.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this payment method?')) {
                                deletePaymentMethodMutation.mutate(method.id);
                              }
                            }}
                          >
                            <XCircle size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {paymentMethods.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-500">No payment methods configured</p>
                      <p className="text-sm text-gray-400">Add your first payment method to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="mr-2 text-gold-600" size={20} />
                    Change Admin Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={changePasswordMutation.isPending}
                        className="w-full"
                      >
                        {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Key className="mr-2" size={16} />
                        Change Password
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Telegram Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="mr-2 text-blue-600" size={20} />
                    Telegram Group Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...telegramForm}>
                    <form onSubmit={telegramForm.handleSubmit((data) => updateTelegramMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={telegramForm.control}
                        name="telegramGroupLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telegram Group Link</FormLabel>
                            <FormControl>
                              <Input placeholder="https://t.me/your-group" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={updateTelegramMutation.isPending}
                        className="w-full"
                      >
                        {updateTelegramMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2" size={16} />
                        Update Telegram Link
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        {/* Payment Method Dialog */}
        <Dialog open={isPaymentMethodDialogOpen} onOpenChange={setIsPaymentMethodDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </DialogTitle>
            </DialogHeader>
            <Form {...paymentMethodForm}>
              <form 
                onSubmit={paymentMethodForm.handleSubmit((data) => {
                  const updatedData = { ...data };
                  console.log('Form submission data:', data);
                  console.log('Selected payment method:', selectedPaymentMethod);

                  // Check if qrCodeUrl contains a File object (new upload) or URL string (existing)
                  if (updatedData.qrCodeUrl && typeof updatedData.qrCodeUrl === 'object' && (updatedData.qrCodeUrl as any) instanceof File) {
                    console.log('New QR code file selected for upload:', (updatedData.qrCodeUrl as File).name);
                  } else if (selectedPaymentMethod?.qrCodeUrl && !(typeof updatedData.qrCodeUrl === 'string' && updatedData.qrCodeUrl.startsWith('blob:'))) {
                    // Keep existing QR code URL when editing without new file
                    updatedData.qrCodeUrl = selectedPaymentMethod.qrCodeUrl;
                    console.log('Keeping existing QR code URL:', updatedData.qrCodeUrl);
                  } else if (typeof updatedData.qrCodeUrl === 'string' && updatedData.qrCodeUrl.startsWith('blob:')) {
                    // Remove blob URL and let the File object handle the upload
                    delete updatedData.qrCodeUrl;
                    console.log('Removing blob URL for file upload');
                  }

                  if (selectedPaymentMethod) {
                    console.log('Updating payment method:', selectedPaymentMethod.id);
                    updatePaymentMethodMutation.mutate({ id: selectedPaymentMethod.id, data: updatedData });
                  } else {
                    console.log('Creating new payment method');
                    createPaymentMethodMutation.mutate(updatedData);
                  }
                })} 
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={paymentMethodForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method Type</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full p-2 border rounded-md">
                            <option value="google_pay">Google Pay</option>
                            <option value="phone_pe">PhonePe</option>
                            <option value="paytm">Paytm</option>
                            <option value="bank_transfer">Bank Transfer</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentMethodForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Google Pay" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Conditional fields based on payment method type */}
                {paymentMethodForm.watch("type") !== "bank_transfer" && (
                  <>
                    <FormField
                      control={paymentMethodForm.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UPI ID *</FormLabel>
                          <FormControl>
                            <Input placeholder="merchant@googlepay" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentMethodForm.control}
                      name="qrCodeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>QR Code Image</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gold-400 transition-colors">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // Validate file size (5MB limit)
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast({
                                          title: "Error",
                                          description: "File size must be less than 5MB",
                                          variant: "destructive"
                                        });
                                        e.target.value = '';
                                        return;
                                      }

                                      // Store the actual File object in the form state
                                      field.onChange(file);
                                      console.log("QR file selected:", file.name, file.type, file.size);
                                    } else {
                                      // If file selection is cancelled, reset to existing QR code if editing
                                      field.onChange(selectedPaymentMethod?.qrCodeUrl || "");
                                      console.log("QR file selection cancelled");
                                    }
                                  }}
                                  className="hidden"
                                  id="qr-upload"
                                  name="qrCode"
                                />
                                <label htmlFor="qr-upload" className="cursor-pointer">
                                  {/* Show current QR if exists (editing mode) and no new file selected */}
                                  {selectedPaymentMethod?.qrCodeUrl && !(field.value && typeof field.value === 'object' && (field.value as any) instanceof File) && (
                                    <div className="mb-4">
                                      <p className="text-sm text-gray-600 mb-2">Current QR Code:</p>
                                      <div className="flex justify-center">
                                        <img 
                                          src={selectedPaymentMethod.qrCodeUrl.startsWith('http') 
                                            ? selectedPaymentMethod.qrCodeUrl 
                                            : selectedPaymentMethod.qrCodeUrl.startsWith('/') 
                                              ? selectedPaymentMethod.qrCodeUrl 
                                              : `/uploads/${selectedPaymentMethod.qrCodeUrl}`
                                          } 
                                          alt="Current QR Code" 
                                          className="max-w-full max-h-32 w-auto h-auto object-contain rounded-lg mb-2 border-2 border-gray-200"
                                          onError={(e) => {
                                            console.error('QR Code image failed to load:', selectedPaymentMethod.qrCodeUrl);
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Show preview if new file selected */}
                                  {field.value && typeof field.value === 'object' && (field.value as any) instanceof File ? (
                                    <div>
                                      <div className="flex justify-center">
                                        <img 
                                          src={URL.createObjectURL(field.value)} 
                                          alt="QR Code Preview" 
                                          className="max-w-full max-h-32 w-auto h-auto object-contain rounded-lg mb-2 border-2 border-green-300 shadow-sm"
                                        />
                                      </div>
                                      <p className="text-green-600 font-medium">✅ New QR Code selected: {(field.value as File).name}</p>
                                      <p className="text-xs text-gray-500">Click to change</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                                        📱
                                      </div>
                                      <p className="text-gray-600">
                                        {selectedPaymentMethod?.qrCodeUrl ? 'Click to change QR Code' : 'Click to upload QR Code'}
                                      </p>
                                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                                    </div>
                                  )}
                                </label>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Bank Transfer Fields */}
                {paymentMethodForm.watch("type") === "bank_transfer" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={paymentMethodForm.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Account Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentMethodForm.control}
                        name="bankIfsc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IFSC Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="SBIN0000123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={paymentMethodForm.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="State Bank of India" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentMethodForm.control}
                        name="accountHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Holder Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="EV Investment Ltd" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <FormField
                  control={paymentMethodForm.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions for Users</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Pay using this method and upload screenshot" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={paymentMethodForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentMethodForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 pt-6">
                        <FormControl>
                          <input 
                            type="checkbox" 
                            checked={field.value}
                            onChange={field.onChange}
                            className="rounded"
                          />
                        </FormControl>
                        <FormLabel>Active (visible to users)</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending}
                    className="gold-gradient"
                  >
                    {(createPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending) && 
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    }
                    <Save className="mr-2" size={16} />
                    {selectedPaymentMethod ? 'Update' : 'Create'} Payment Method
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPaymentMethodDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <User className="mr-2" size={24} />
                User Details: {selectedUser?.fullName}
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedUser.profilePhoto} />
                          <AvatarFallback className="text-lg">{selectedUser.fullName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-lg">{selectedUser.fullName}</p>
                          <p className="text-sm text-gray-600">{selectedUser.email}</p>
                          <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Balance</p>
                          <p className="font-bold text-green-600">₹{parseFloat(selectedUser.balance || "0").toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Referral Code</p>
                          <p className="font-mono">{selectedUser.referralCode}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Deposits</p>
                          <p className="font-bold text-blue-600">₹{parseFloat(selectedUser.totalDeposits || "0").toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Withdrawals</p>
                          <p className="font-bold text-red-600">₹{parseFloat(selectedUser.totalWithdrawals || "0").toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">UPI ID</p>
                        <p className="font-medium">{selectedUser.upiId || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Account Number</p>
                        <p className="font-medium">{selectedUser.accountNumber || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">IFSC Code</p>
                        <p className="font-medium">{selectedUser.ifscCode || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Joined Date</p>
                        <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Update User Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Update User Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...userUpdateForm}>
                      <form onSubmit={userUpdateForm.handleSubmit((data) => updateUserMutation.mutate({ id: selectedUser.id, data }))} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={userUpdateForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={userUpdateForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={userUpdateForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={userUpdateForm.control}
                            name="balance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Balance</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={userUpdateForm.control}
                            name="upiId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>UPI ID</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={userUpdateForm.control}
                            name="accountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={userUpdateForm.control}
                            name="ifscCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IFSC Code</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button 
                          type="submit" 
                          disabled={updateUserMutation.isPending}
                          className="gold-gradient"
                        >
                          {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2" size={16} />
                          Update User
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Add Balance Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <DollarSign className="mr-2 text-green-600" size={20} />
                      Add Balance to User
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Enter amount to add"
                          value={balanceAmount}
                          onChange={(e) => setBalanceAmount(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          if (balanceAmount && parseFloat(balanceAmount) > 0) {
                            addBalanceMutation.mutate({
                              userId: selectedUser.id,
                              amount: parseFloat(balanceAmount)
                            });
                            setBalanceAmount("");
                          }
                        }}
                        disabled={addBalanceMutation.isPending || !balanceAmount || parseFloat(balanceAmount) <= 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {addBalanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <DollarSign className="mr-2" size={16} />
                        Add Balance
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Current Balance: ₹{parseFloat(selectedUser?.balance || "0").toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                {/* User's Transactions and Investments */}
                {userDetails && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Transactions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {userDetails.transactions?.slice(0, 10).map((transaction: any) => (
                            <div key={transaction.id} className="flex justify-between items-center p-2 border rounded">
                              <div>
                                <p className="text-sm font-medium capitalize">{transaction.type}</p>
                                <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">₹{parseFloat(transaction.amount).toLocaleString()}</p>
                                <Badge variant={transaction.status === 'approved' ? 'default' : transaction.status === 'rejected' ? 'destructive' : 'secondary'} style={{ fontSize: '10px' }}>
                                  {transaction.status}
                                </Badge>
                              </div>
                            </div>
                          )) || <p className="text-gray-500 text-center py-4">No transactions</p>}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Investments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {userDetails.investments?.map((investment: any) => (
                            <div key={investment.id} className="flex justify-between items-center p-2 border rounded">
                              <div>
                                <p className="text-sm font-medium">Plan {investment.planId}</p>
                                <p className="text-xs text-gray-500">{new Date(investment.startDate).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">₹{parseFloat(investment.amount).toLocaleString()}</p>
                                <Badge variant={investment.status === 'active' ? 'default' : 'secondary'} style={{ fontSize: '10px' }}>
                                  {investment.status}
                                </Badge>
                              </div>
                            </div>
                          )) || <p className="text-gray-500 text-center py-4">No investments</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Transaction Review Dialog */}
        {selectedTransaction && (
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <FileText className="mr-2 text-gold-600" size={24} />
                  Transaction Review: {selectedTransaction.type.toUpperCase()}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Transaction Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold text-lg">₹{parseFloat(selectedTransaction.amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={getStatusColor(selectedTransaction.status)}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{selectedTransaction.paymentMethod || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{format(new Date(selectedTransaction.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                  {selectedTransaction.transactionNumber && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Transaction ID</p>
                      <p className="font-medium font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                        {selectedTransaction.transactionNumber}
                      </p>
                    </div>
                  )}
                </div>

                {/* User Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold">{selectedTransaction.userDetails?.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="text-sm">{selectedTransaction.userDetails?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="text-sm">{selectedTransaction.userDetails?.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-semibold">₹{parseFloat(selectedTransaction.userDetails?.balance || "0").toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referral Code:</span>
                      <span className="text-sm font-mono">{selectedTransaction.userDetails?.referralCode}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* UPI/Bank Details for Withdrawals */}
                {selectedTransaction.type === "withdrawal" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center">
                        <Smartphone className="mr-2" size={16} />
                        Payment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedTransaction.userDetails?.upiId && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">UPI ID:</span>
                            <span className="font-mono font-semibold text-blue-600">{selectedTransaction.userDetails.upiId}</span>
                          </div>
                        </div>
                      )}

                      {selectedTransaction.userDetails?.accountNumber && (
                        <div className="p-3 bg-green-50 rounded-lg space-y-2">
                          <h4 className="font-medium text-green-800">Bank Details</h4>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Account Holder:</span>
                              <span className="font-semibold">{selectedTransaction.userDetails.accountHolderName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Account Number:</span>
                              <span className="font-mono">{selectedTransaction.userDetails.accountNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">IFSC Code:</span>
                              <span className="font-mono">{selectedTransaction.userDetails.ifscCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bank Name:</span>
                              <span>{selectedTransaction.userDetails.bankName}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {!selectedTransaction.userDetails?.upiId && !selectedTransaction.userDetails?.accountNumber && (
                        <div className="p-3 bg-red-50 rounded-lg">
                          <p className="text-red-600 text-sm">⚠️ No payment details available for this user</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Payment Screenshot for Deposits */}
                {selectedTransaction.type === "deposit" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center">
                        <Eye className="mr-2" size={16} />
                        Payment Screenshot
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedTransaction.paymentScreenshot ? (
                          <div className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="text-center mb-2">
                              <img 
                                src={selectedTransaction.paymentScreenshot.startsWith('http') 
                                  ? selectedTransaction.paymentScreenshot
                                  : selectedTransaction.paymentScreenshot.startsWith('/')
                                    ? selectedTransaction.paymentScreenshot
                                    : `/uploads/${selectedTransaction.paymentScreenshot}`}
                                alt="Payment Screenshot" 
                                className="w-full max-h-[400px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => {
                                  const imageUrl = selectedTransaction.paymentScreenshot.startsWith('http') 
                                    ? selectedTransaction.paymentScreenshot
                                    : selectedTransaction.paymentScreenshot.startsWith('/')
                                      ? selectedTransaction.paymentScreenshot
                                      : `/uploads/${selectedTransaction.paymentScreenshot}`;
                                  window.open(imageUrl, '_blank');
                                }}
                                onError={(e) => {
                                  console.error('Image failed to load:', selectedTransaction.paymentScreenshot);
                                  e.currentTarget.style.display = 'none';
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'text-center p-8 text-red-600';
                                  errorDiv.innerHTML = `
                                    <div class="mb-2">⚠️ Screenshot could not be loaded</div>
                                    <div class="text-xs text-gray-500">File: ${selectedTransaction.paymentScreenshot}</div>
                                  `;
                                  e.currentTarget.parentNode?.appendChild(errorDiv);
                                }}
                              />
                            </div>
                            <div className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const imageUrl = selectedTransaction.paymentScreenshot.startsWith('http') 
                                    ? selectedTransaction.paymentScreenshot
                                    : selectedTransaction.paymentScreenshot.startsWith('/')
                                      ? selectedTransaction.paymentScreenshot
                                      : `/uploads/${selectedTransaction.paymentScreenshot}`;
                                  window.open(imageUrl, '_blank');
                                }}
                                className="text-blue-600 border-blue-300"
                              >
                                🔍 View Full Size
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-red-200 rounded-lg p-6 bg-red-50">
                            <div className="text-center text-red-600">
                              <XCircle className="mx-auto mb-2" size={32} />
                              <p className="font-medium">❌ No Screenshot Uploaded</p>
                              <p className="text-sm">User did not upload payment screenshot</p>
                              <p className="text-xs mt-2 text-red-500">⚠️ This deposit should be rejected without payment proof</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Notes */}
                {selectedTransaction.adminNotes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedTransaction.adminNotes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Transaction Decision Section */}
                {selectedTransaction.status === "pending" && (
                  <Card className="border-2 border-dashed border-gray-300">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center text-gray-700">
                        ⚖️ Transaction Decision
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {/* Quick Approval */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">✅ Approve Transaction</h4>
                        <p className="text-sm text-green-700 mb-3">This will credit the amount to user's account</p>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => updateTransactionMutation.mutate({
                            id: selectedTransaction.id,
                            status: "approved",
                            adminNotes: rejectionReason.trim() || "Approved by admin"
                          })}
                          disabled={updateTransactionMutation.isPending}
                        >
                          {updateTransactionMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2" size={16} />
                          )}
                          ✅ Approve & Process Payment
                        </Button>
                      </div>

                      {/* Rejection Section */}
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-3">❌ Reject Transaction</h4>
                        
                        {/* Quick Rejection Reasons */}
                        <div className="mb-3">
                          <p className="text-sm text-red-700 mb-2">Quick Rejection Reasons:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {[
                              "Screenshot not clear/readable",
                              "Amount mismatch in screenshot", 
                              "Invalid payment method used",
                              "Screenshot appears to be fake",
                              "Payment not received in account",
                              "Wrong UPI/Account details used"
                            ].map((reason, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant="outline"
                                className="text-left justify-start text-red-600 border-red-300 hover:bg-red-100"
                                onClick={() => setRejectionReason(reason)}
                              >
                                {reason}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Rejection Reason */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-red-800">
                            Rejection Reason (Required - minimum 5 characters)
                          </label>
                          <Textarea
                            placeholder="Enter detailed reason for rejection... (e.g., Screenshot is blurry and amount cannot be verified)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[100px] border-red-300 focus:border-red-500"
                          />
                        </div>

                        <Button
                          variant="outline"
                          className="w-full border-red-600 text-red-600 hover:bg-red-100 mt-3"
                          onClick={() => {
                            if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
                              toast({
                                title: "⚠️ Rejection Reason Required",
                                description: "Please provide a detailed reason (at least 5 characters) for rejecting this transaction",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (confirm(`Are you sure you want to REJECT this transaction?\n\nReason: ${rejectionReason.trim()}\n\nThis action cannot be undone.`)) {
                              updateTransactionMutation.mutate({
                                id: selectedTransaction.id,
                                status: "rejected",
                                adminNotes: rejectionReason.trim()
                              });
                            }
                          }}
                          disabled={updateTransactionMutation.isPending || !rejectionReason.trim() || rejectionReason.trim().length < 5}
                        >
                          {updateTransactionMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2" size={16} />
                          )}
                          ❌ Reject Transaction
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

          {/* Database Management Tab */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">🗄️ Database Management</CardTitle>
                <CardDescription>
                  Database को reset करें - सिर्फ users रहेंगे, बाकी सब clear हो जाएगा
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">⚠️ Warning - यह action permanent है!</h3>
                  <div className="text-sm text-red-700 space-y-1">
                    <p>• सभी user investments/plans clear हो जाएंगे</p>
                    <p>• सभी transactions history delete हो जाएगी</p>
                    <p>• सभी balances zero हो जाएंगे</p>
                    <p>• सभी referrals और daily returns clear</p>
                    <p>• सिर्फ user accounts रह जाएंगे</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    if (confirm('क्या आप सच में database reset करना चाहते हैं? यह action undo नहीं हो सकता!')) {
                      if (confirm('Last confirmation - यह सब कुछ clear कर देगा सिवाय users के!')) {
                        resetDatabaseMutation.mutate();
                      }
                    }
                  }}
                  disabled={resetDatabaseMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {resetDatabaseMutation.isPending ? 'Resetting...' : '🗑️ Reset Database (Keep Users Only)'}
                </Button>
                
                {resetDatabaseMutation.isSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800">✅ Database successfully reset! सिर्फ users बचे हैं।</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
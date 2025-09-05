import { } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { 
  ArrowDown, 
  CreditCard, 
  Smartphone, 
  Building2, 
  AlertCircle, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  IndianRupee,
  Calculator
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const withdrawalSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 100;
    }, "Minimum withdrawal amount is ₹100"),
  paymentMethod: z.enum(["upi", "bank"], {
    required_error: "Please select a payment method",
  }),
});

type WithdrawalForm = z.infer<typeof withdrawalSchema>;

export default function Withdrawal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();

  const { data: profile } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: withdrawableBalance } = useQuery({
    queryKey: ["/api/withdrawal/balance"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const form = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "upi",
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalForm) => {
      const res = await apiRequest("POST", "/api/withdrawal", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Withdrawal Requested",
        description: `₹${data.netAmount} withdrawal request submitted (Fee: ₹${data.fee}). Processing time: ${data.processingTime}`,
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawalForm) => {
    const amount = parseFloat(data.amount);
    const availableBalance = parseFloat(withdrawableBalance?.withdrawableBalance || "0");
    
    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You can only withdraw ₹${availableBalance.toFixed(2)} from your daily returns.`,
        variant: "destructive",
      });
      return;
    }

    withdrawalMutation.mutate(data);
  };

  const calculateFeeAndNet = (amount: string) => {
    const num = parseFloat(amount || "0");
    if (isNaN(num) || num <= 0) return { fee: 0, net: 0 };
    const fee = num * 0.05;
    const net = num - fee;
    return { fee, net };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600 bg-green-100";
      case "rejected": return "text-red-600 bg-red-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      default: return "text-blue-600 bg-blue-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle size={16} />;
      case "rejected": return <XCircle size={16} />;
      case "pending": return <Clock size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const withdrawalTransactions = (transactions as any)?.filter(
    (t: any) => t.type === "withdrawal" || t.type === "withdrawal_fee"
  ) || [];

  const hasPaymentMethods = (profile as any)?.user?.upiId || ((profile as any)?.user?.accountNumber && (profile as any)?.user?.ifscCode);
  const currentAmount = form.watch("amount");
  const { fee, net } = calculateFeeAndNet(currentAmount);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="mb-3 md:mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Withdraw Funds</h1>
          <p className="text-sm md:text-base text-gray-600">Request withdrawal from your investment earnings</p>
        </div>

        {/* Withdrawable Balance Summary */}
        <Card className="border-gold-200 bg-gradient-to-r from-gold-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gold-600 font-medium">Withdrawable Balance</p>
                <p className="text-2xl font-bold text-gold-700 flex items-center">
                  <IndianRupee size={20} />
                  {parseFloat(withdrawableBalance?.withdrawableBalance || "0").toLocaleString()}
                </p>
                <p className="text-xs text-gold-600 mt-1">Daily returns only</p>
              </div>
              <div>
                <p className="text-sm text-gold-600 font-medium">Total Daily Returns</p>
                <p className="text-xl font-semibold text-gold-700 flex items-center">
                  <IndianRupee size={16} />
                  {parseFloat(withdrawableBalance?.totalDailyReturns || "0").toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gold-600 font-medium">Total Withdrawn</p>
                <p className="text-xl font-semibold text-gold-700 flex items-center">
                  <IndianRupee size={16} />
                  {parseFloat(withdrawableBalance?.totalWithdrawn || "0").toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Warning */}
        {!hasPaymentMethods && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-amber-800">Payment Methods Required</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Please configure your payment methods in your profile before requesting a withdrawal.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => window.location.href = "/profile"}
                  >
                    Configure Payment Methods
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowDown className="mr-2" size={20} />
                Request Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Withdrawal Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              type="number"
                              placeholder="Enter amount (minimum ₹100)" 
                              className="pl-10 focus:ring-gold-500 focus:border-gold-500"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fee Calculation */}
                  {currentAmount && fee > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center mb-2">
                        <Calculator className="mr-2" size={16} />
                        <span className="font-medium text-gray-700">Withdrawal Breakdown</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Requested Amount:</span>
                          <span>₹{parseFloat(currentAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Processing Fee (5%):</span>
                          <span>-₹{fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-1 border-t border-gray-200">
                          <span>Net Amount:</span>
                          <span className="text-green-600">₹{net.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Method Selection */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-gold-500 focus:border-gold-500">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(profile as any)?.user?.upiId && (
                              <SelectItem value="upi">
                                <div className="flex items-center">
                                  <Smartphone className="mr-2" size={16} />
                                  UPI - {(profile as any).user.upiId}
                                </div>
                              </SelectItem>
                            )}
                            {(profile as any)?.user?.accountNumber && (profile as any)?.user?.ifscCode && (
                              <SelectItem value="bank">
                                <div className="flex items-center">
                                  <Building2 className="mr-2" size={16} />
                                  Bank - ***{(profile as any).user.accountNumber?.slice(-4)}
                                </div>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Method Details Display */}
                  {form.watch("paymentMethod") && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          {form.watch("paymentMethod") === "upi" ? (
                            <Smartphone className="mr-2 text-blue-600" size={20} />
                          ) : (
                            <Building2 className="mr-2 text-green-600" size={20} />
                          )}
                          {form.watch("paymentMethod") === "upi" ? "UPI" : "Bank"} Payment Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {form.watch("paymentMethod") === "upi" && (profile as any)?.user?.upiId && (
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-sm text-gray-600">UPI ID</p>
                            <p className="font-mono font-semibold">{(profile as any).user.upiId}</p>
                          </div>
                        )}
                        
                        {form.watch("paymentMethod") === "bank" && (profile as any)?.user?.accountNumber && (
                          <div className="space-y-3">
                            <div className="p-3 bg-white rounded-lg">
                              <p className="text-sm text-gray-600">Account Number</p>
                              <p className="font-mono font-semibold">{(profile as any).user.accountNumber}</p>
                            </div>
                            {(profile as any)?.user?.ifscCode && (
                              <div className="p-3 bg-white rounded-lg">
                                <p className="text-sm text-gray-600">IFSC Code</p>
                                <p className="font-mono font-semibold">{(profile as any).user.ifscCode}</p>
                              </div>
                            )}
                            {(profile as any)?.user?.bankName && (
                              <div className="p-3 bg-white rounded-lg">
                                <p className="text-sm text-gray-600">Bank Name</p>
                                <p className="font-semibold">{(profile as any).user.bankName}</p>
                              </div>
                            )}
                            {(profile as any)?.user?.accountHolderName && (
                              <div className="p-3 bg-white rounded-lg">
                                <p className="text-sm text-gray-600">Account Holder Name</p>
                                <p className="font-semibold">{(profile as any).user.accountHolderName}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            <strong>✅ Withdrawal will be processed to above {form.watch("paymentMethod") === "upi" ? "UPI ID" : "bank account"}.</strong>
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Processing time: 24-48 hours after admin approval.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Fee Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="text-amber-600 mr-2 mt-0.5" size={16} />
                      <div>
                        <p className="text-sm text-amber-800 font-medium">Withdrawal Fee & Processing</p>
                        <p className="text-xs text-amber-700 mt-1">
                          5% processing fee will be deducted. Withdrawal will be processed within 24 hours.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={withdrawalMutation.isPending || !hasPaymentMethods}
                    className="w-full gold-gradient hover:from-gold-600 hover:to-gold-700 text-white font-semibold"
                  >
                    {withdrawalMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowDown className="mr-2 h-4 w-4" />
                        Request Withdrawal
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2" size={20} />
                Withdrawal History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-500" />
                  <p className="text-gray-500 mt-2">Loading transactions...</p>
                </div>
              ) : withdrawalTransactions.length > 0 ? (
                <div className="space-y-3">
                  {withdrawalTransactions
                    .filter((t: any) => t.type === "withdrawal")
                    .slice(0, 10)
                    .map((transaction: any) => (
                    <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getStatusIcon(transaction.status)}
                          <Badge 
                            className={`ml-2 text-xs ${getStatusColor(transaction.status)}`}
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                        <span className="font-semibold text-lg">₹{parseFloat(transaction.amount).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                      </p>
                      {transaction.adminNotes && (
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                          Admin Notes: {transaction.adminNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500">No withdrawal history</p>
                  <p className="text-sm text-gray-400">Your withdrawal requests will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
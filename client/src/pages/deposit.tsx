import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  PlusCircle, 
  Wallet, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Loader2
} from "lucide-react";

const depositSchema = z.object({
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0 && num >= 100;
  }, {
    message: "Amount must be at least ₹100",
  }),
});

type DepositForm = z.infer<typeof depositSchema>;

export default function Deposit() {
  const user = authService.getUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAmount, setSelectedAmount] = useState<string>("");

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
    },
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions", "deposit"],
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      const res = await apiRequest("POST", "/api/deposit", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Deposit request submitted successfully! It will be processed by admin.",
      });
      form.reset();
      setSelectedAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DepositForm) => {
    depositMutation.mutate(data);
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];

  const handleQuickAmount = (amount: number) => {
    const amountStr = amount.toString();
    setSelectedAmount(amountStr);
    form.setValue("amount", amountStr);
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
        return <AlertCircle className="text-gray-600" size={16} />;
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

  const depositTransactions = transactions?.filter((t: any) => t.type === "deposit") || [];

  return (
    <AppLayout>
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Deposit Funds</h1>
          <p className="text-sm md:text-base text-gray-600">Add money to your account to start investing</p>
          
          <div className="mt-4 p-4 bg-gold-50 rounded-lg border-l-4 border-gold-400">
            <div className="flex items-center">
              <Wallet className="text-gold-600 mr-2" size={20} />
              <span className="text-sm font-medium text-gold-800">
                Current Balance: <span className="text-lg font-bold">₹{parseFloat(user?.balance || "0").toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Deposit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <PlusCircle className="mr-2 text-gold-600" size={20} />
                Make a Deposit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Amount (₹)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              type="number"
                              placeholder="Enter amount (minimum ₹100)" 
                              className="pl-10 focus:ring-gold-500 focus:border-gold-500"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setSelectedAmount(e.target.value);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quick Amount Buttons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Quick Select Amount</label>
                    <div className="grid grid-cols-4 gap-2">
                      {quickAmounts.map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant={selectedAmount === amount.toString() ? "default" : "outline"}
                          className={`text-xs h-8 ${
                            selectedAmount === amount.toString() 
                              ? "gold-gradient text-white" 
                              : "border-gold-200 text-gold-600 hover:bg-gold-50"
                          }`}
                          onClick={() => handleQuickAmount(amount)}
                        >
                          ₹{amount >= 1000 ? `${amount/1000}K` : amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={depositMutation.isPending}
                    className="w-full gold-gradient hover:from-gold-600 hover:to-gold-700 text-white font-semibold py-3"
                  >
                    {depositMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Submit Deposit Request
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  Manual Processing
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• All deposits are manually processed by our admin team</p>
                  <p>• Processing time: 1-24 hours during business hours</p>
                  <p>• You will receive confirmation once processed</p>
                  <p>• Minimum deposit amount: ₹100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Banknote className="mr-2 text-navy-600" size={20} />
                Payment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Step 1: Submit Request</h4>
                  <p className="text-sm text-gray-600">Fill out the deposit form and submit your request.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Step 2: Admin Review</h4>
                  <p className="text-sm text-gray-600">Our admin team will review and process your request.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Step 3: Confirmation</h4>
                  <p className="text-sm text-gray-600">Once approved, funds will be added to your account balance.</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Why Manual Processing?</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Enhanced security and fraud prevention</p>
                  <p>• Personalized customer service</p>
                  <p>• Verification of all transactions</p>
                  <p>• Compliance with financial regulations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deposit History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Deposit History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
              </div>
            ) : depositTransactions.length > 0 ? (
              <div className="space-y-4">
                {depositTransactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-white p-2 rounded-full mr-4">
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          ₹{parseFloat(transaction.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleDateString()} at{" "}
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </p>
                        {transaction.description && (
                          <p className="text-xs text-gray-500">{transaction.description}</p>
                        )}
                        {transaction.adminNotes && (
                          <p className="text-xs text-blue-600 mt-1">Admin: {transaction.adminNotes}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PlusCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No deposit history yet</p>
                <p className="text-sm text-gray-400">Make your first deposit to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
    </AppLayout>
  );
}

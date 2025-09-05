import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { 
  PlusCircle, 
  Wallet, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Loader2,
  Smartphone,
  Building2,
  Copy,
  IndianRupee,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { 
  SiGooglepay, 
  SiPhonepe, 
  SiPaytm 
} from "react-icons/si";
import { formatDistanceToNow } from "date-fns";

const depositSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 100;
    }, "Minimum deposit amount is ₹100"),
  paymentMethod: z.enum(["google_pay", "phone_pe", "paytm", "bank_transfer"], {
    required_error: "Please select payment method",
  }),
  transactionNumber: z.string().min(1, "Transaction ID is required"),
  screenshot: z.any().optional(),
});

type DepositForm = z.infer<typeof depositSchema>;

export default function Deposit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: paymentMethods = [], isLoading: methodsLoading } = useQuery<any[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions", "deposit"],
  });

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "google_pay",
      transactionNumber: "",
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      const formData = new FormData();
      formData.append("amount", data.amount);
      formData.append("paymentMethod", data.paymentMethod);
      formData.append("transactionNumber", data.transactionNumber);
      if (selectedFile) {
        formData.append("screenshot", selectedFile);
      }

      const token = localStorage.getItem("ev_token");
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit deposit");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Request Submitted! 🎉",
        description: "आपका payment screenshot admin के पास भेज दिया गया है। Approval का wait करें।",
      });
      form.reset();
      setShowPaymentDetails(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
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

  const onSubmit = (data: DepositForm) => {
    if (!selectedFile) {
      toast({
        title: "Screenshot Required",
        description: "कृपया payment screenshot upload करें",
        variant: "destructive",
      });
      return;
    }
    depositMutation.mutate(data);
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];

  const handleQuickAmount = (amount: number) => {
    const amountStr = amount.toString();
    form.setValue("amount", amountStr);
    setShowPaymentDetails(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select image under 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select image file only",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied! ✅",
      description: `${label} clipboard में copy हो गया`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
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

  const getPaymentMethodInfo = (method: string) => {
    const methodData = (paymentMethods || []).find((m: any) => m.type === method);
    if (!methodData) return null;

    const icons = {
      google_pay: "📱",
      phone_pe: "💜", 
      paytm: "💙",
      bank_transfer: "🏦"
    };

    // Ensure QR code URL is properly formatted
    let qrCodeUrl = methodData.qrCodeUrl;
    if (qrCodeUrl && !qrCodeUrl.startsWith('http') && !qrCodeUrl.startsWith('/') && qrCodeUrl.trim() !== '') {
      qrCodeUrl = `/uploads/${qrCodeUrl}`;
    }

    return {
      ...methodData,
      qrCodeUrl: qrCodeUrl || null,
      icon: icons[method as keyof typeof icons] || "💳"
    };
  };

  const depositTransactions = (transactions && Array.isArray(transactions) ? transactions : []).filter(
    (t: any) => t.type === "deposit"
  );

  const currentAmount = form.watch("amount");
  const selectedPaymentMethod = form.watch("paymentMethod");
  const selectedMethodData = getPaymentMethodInfo(selectedPaymentMethod);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">💰 Deposit Funds</h1>
          <p className="text-sm md:text-base text-gray-600">अपने investment account में पैसे add करें</p>
        </div>

        {/* Balance Summary */}
        <Card className="border-gold-200 bg-gradient-to-r from-gold-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gold-600 font-medium">Current Balance</p>
                <p className="text-3xl font-bold text-gold-700 flex items-center">
                  <IndianRupee size={24} />
                  {parseFloat(user?.balance || "0").toLocaleString()}
                </p>
              </div>
              <div className="text-gold-500">
                <Wallet size={48} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deposit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PlusCircle className="mr-2" size={20} />
                Add Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Amount Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Quick Select Amount
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount)}
                      className="text-sm hover:bg-gold-50 hover:border-gold-300"
                    >
                      ₹{amount.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Amount Input */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              placeholder="Enter amount (minimum ₹100)"
                              className="pl-10 focus:ring-gold-500 focus:border-gold-500"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value && parseFloat(e.target.value) >= 100) {
                                  setShowPaymentDetails(true);
                                } else {
                                  setShowPaymentDetails(false);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Method Selection */}
                  {showPaymentDetails && currentAmount && parseFloat(currentAmount) >= 100 && (
                    <>
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Payment Method</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 gap-3">
                                {(paymentMethods || []).filter((method: any) => method.isActive).map((method: any) => {
                                  const getMethodIcon = (type: string) => {
                                    switch(type) {
                                      case 'google_pay':
                                        return <SiGooglepay className="text-blue-600" size={24} />;
                                      case 'phone_pe':
                                        return <SiPhonepe className="text-purple-600" size={24} />;
                                      case 'paytm':
                                        return <SiPaytm className="text-blue-500" size={24} />;
                                      case 'bank_transfer':
                                        return <Building2 className="text-green-600" size={24} />;
                                      default:
                                        return <CreditCard className="text-gray-600" size={24} />;
                                    }
                                  };
                                  
                                  return (
                                    <div
                                      key={method.type}
                                      onClick={() => field.onChange(method.type)}
                                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                        field.value === method.type
                                          ? "border-gold-500 bg-gold-50 shadow-md"
                                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        {getMethodIcon(method.type)}
                                        <div>
                                          <p className="font-medium">{method.name}</p>
                                          <p className="text-xs text-gray-500">Fast & Secure</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Payment Details */}
                      {selectedMethodData && (
                        <Card className="bg-blue-50 border-blue-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center">
                              {selectedPaymentMethod === 'google_pay' && <SiGooglepay className="mr-2 text-blue-600" size={20} />}
                              {selectedPaymentMethod === 'phone_pe' && <SiPhonepe className="mr-2 text-purple-600" size={20} />}
                              {selectedPaymentMethod === 'paytm' && <SiPaytm className="mr-2 text-blue-500" size={20} />}
                              {selectedPaymentMethod === 'bank_transfer' && <Building2 className="mr-2 text-green-600" size={20} />}
                              {selectedMethodData.name} Payment Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* UPI Details */}
                            {selectedPaymentMethod !== "bank_transfer" && selectedMethodData.upiId && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                  <div>
                                    <p className="text-sm text-gray-600">UPI ID</p>
                                    <p className="font-mono font-semibold">{selectedMethodData.upiId}</p>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(selectedMethodData.upiId, "UPI ID")}
                                  >
                                    <Copy size={14} className="mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                
                                {/* QR Code Display */}
                                {selectedMethodData.qrCodeUrl && !selectedMethodData.qrCodeUrl.startsWith('blob:') && (
                                  <div className="p-4 bg-white rounded-lg text-center border border-gray-200 shadow-sm">
                                    <p className="text-sm font-medium text-gray-700 mb-3">🎯 QR Code for Payment</p>
                                    <div className="flex justify-center mb-3">
                                      <img 
                                        src={selectedMethodData.qrCodeUrl.startsWith('http') 
                                          ? selectedMethodData.qrCodeUrl 
                                          : selectedMethodData.qrCodeUrl.startsWith('/') 
                                            ? selectedMethodData.qrCodeUrl 
                                            : `/uploads/${selectedMethodData.qrCodeUrl}`}
                                        alt="Payment QR Code" 
                                        className="max-w-full w-auto h-auto max-h-64 sm:max-h-72 md:max-h-80 object-contain rounded-lg border-2 border-gold-200 shadow-md hover:shadow-lg transition-shadow duration-300"
                                        style={{ aspectRatio: '1/1', maxWidth: 'min(100%, 320px)' }}
                                        onError={(e) => {
                                          console.error('QR Code failed to load:', selectedMethodData.qrCodeUrl);
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <div className="bg-gold-50 rounded-lg p-2">
                                      <p className="text-sm font-semibold text-gold-700">💰 Scan to pay ₹{currentAmount.toLocaleString()}</p>
                                      <p className="text-xs text-gray-600 mt-1">Use any UPI app to scan and pay</p>
                                    </div>
                                  </div>
                                )}
                                {selectedMethodData.qrCodeUrl && selectedMethodData.qrCodeUrl.startsWith('blob:') && (
                                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                                    <p className="text-sm text-yellow-600 mb-2">⚠️ QR Code needs to be re-uploaded by admin</p>
                                    <p className="text-xs text-gray-500">Temporary QR code detected - please contact admin</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Bank Details */}
                            {selectedPaymentMethod === "bank_transfer" && selectedMethodData.bankAccountNumber && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                    <div>
                                      <p className="text-sm text-gray-600">Account Number</p>
                                      <p className="font-mono font-semibold">{selectedMethodData.bankAccountNumber}</p>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(selectedMethodData.bankAccountNumber, "Account Number")}
                                    >
                                      <Copy size={14} className="mr-1" />
                                      Copy
                                    </Button>
                                  </div>
                                  {selectedMethodData.bankIfsc && (
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                      <div>
                                        <p className="text-sm text-gray-600">IFSC Code</p>
                                        <p className="font-mono font-semibold">{selectedMethodData.bankIfsc}</p>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(selectedMethodData.bankIfsc, "IFSC Code")}
                                      >
                                        <Copy size={14} className="mr-1" />
                                        Copy
                                      </Button>
                                    </div>
                                  )}
                                  {selectedMethodData.bankName && (
                                    <div className="p-3 bg-white rounded-lg">
                                      <p className="text-sm text-gray-600">Bank Name</p>
                                      <p className="font-semibold">{selectedMethodData.bankName}</p>
                                    </div>
                                  )}
                                  {selectedMethodData.accountHolderName && (
                                    <div className="p-3 bg-white rounded-lg">
                                      <p className="text-sm text-gray-600">Account Holder Name</p>
                                      <p className="font-semibold">{selectedMethodData.accountHolderName}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Instructions */}
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                {selectedMethodData.instructions}
                              </AlertDescription>
                            </Alert>
                          </CardContent>
                        </Card>
                      )}

                      {/* Transaction Number Field */}
                      <FormField
                        control={form.control}
                        name="transactionNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transaction ID/Reference Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter transaction ID from your payment app"
                                className="focus:ring-gold-500 focus:border-gold-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500">
                              Payment app में दिखने वाला transaction ID/reference number लिखें
                            </p>
                          </FormItem>
                        )}
                      />

                      {/* Screenshot Upload */}
                      <FormField
                        control={form.control}
                        name="screenshot"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Upload className="mr-2" size={16} />
                              Upload Payment Screenshot (Required)
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gold-400 transition-colors">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="screenshot-upload"
                                  />
                                  <label htmlFor="screenshot-upload" className="cursor-pointer">
                                    {previewUrl ? (
                                      <div>
                                        <img 
                                          src={previewUrl} 
                                          alt="Payment screenshot" 
                                          className="mx-auto max-h-32 rounded-lg mb-2"
                                        />
                                        <p className="text-green-600 font-medium">✅ Screenshot selected</p>
                                        <p className="text-xs text-gray-500">Click to change</p>
                                      </div>
                                    ) : (
                                      <div>
                                        <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-gray-600">Click here to upload payment screenshot</p>
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

                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-sm text-yellow-800">
                          <strong>Important:</strong> Payment करने के बाद screenshot upload करना जरूरी है। 
                          Admin screenshot verify करके आपका balance update करेगा।
                        </AlertDescription>
                      </Alert>

                      <Button
                        type="submit"
                        disabled={depositMutation.isPending || !selectedFile}
                        className="w-full gold-gradient hover:from-gold-600 hover:to-gold-700 text-white font-semibold"
                      >
                        {depositMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Submit Deposit Request 🚀
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2" size={20} />
                Deposit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-500" />
                  <p className="text-gray-500 mt-2">Loading transactions...</p>
                </div>
              ) : depositTransactions.length > 0 ? (
                <div className="space-y-3">
                  {depositTransactions.slice(0, 10).map((transaction: any) => (
                    <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getStatusIcon(transaction.status)}
                          <Badge className={`ml-2 text-xs ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </Badge>
                        </div>
                        <span className="font-semibold text-lg">₹{parseFloat(transaction.amount).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                      </p>
                      {transaction.paymentScreenshot && (
                        <div className="mt-2">
                          <p className="text-xs text-blue-600">📷 Screenshot uploaded</p>
                        </div>
                      )}
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
                  <p className="text-gray-500">No deposit history</p>
                  <p className="text-sm text-gray-400">आपकी deposits यहाँ दिखेंगी</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
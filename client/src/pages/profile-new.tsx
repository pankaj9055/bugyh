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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Camera, 
  Key, 
  Save,
  Loader2,
  Mail,
  Phone,
  IdCard,
  Calendar,
  CreditCard,
  Smartphone,
  Building2,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Wallet,
  DollarSign
} from "lucide-react";

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
});

const paymentMethodSchema = z.object({
  upiId: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
type PaymentMethodForm = z.infer<typeof paymentMethodSchema>;

// Telegram Join Button Component
function TelegramJoinButton() {
  const { data: telegramConfig } = useQuery({
    queryKey: ["/api/config/telegram"],
  });

  const handleJoinGroup = () => {
    const telegramLink = (telegramConfig as any)?.telegramGroupLink || "https://t.me/+YourGroupLinkHere";
    window.open(telegramLink, '_blank');
  };

  return (
    <Button
      onClick={handleJoinGroup}
      className="bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
      data-testid="button-telegram-join"
    >
      <ExternalLink className="mr-2 h-4 w-4" />
      Join Telegram Group
    </Button>
  );
}

export default function Profile() {
  const user = authService.getUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isWithdrawalDetailsOpen, setIsWithdrawalDetailsOpen] = useState(false);
  const [isTelegramGroupOpen, setIsTelegramGroupOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);

  const { data: currentUser, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const profileForm = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const paymentForm = useForm<PaymentMethodForm>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      upiId: (user as any)?.upiId || "",
      accountHolderName: (user as any)?.accountHolderName || "",
      accountNumber: (user as any)?.accountNumber || "",
      ifscCode: (user as any)?.ifscCode || "",
      bankName: (user as any)?.bankName || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileForm) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: (data) => {
      authService.setUser(data.user);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const res = await apiRequest("PUT", "/api/profile/password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentMethodForm) => {
      const res = await apiRequest("PUT", "/api/profile/payment-methods", data);
      return res.json();
    },
    onSuccess: (data) => {
      authService.setUser(data.user);
      toast({
        title: "Success",
        description: "Payment methods updated successfully!",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  

  const onUpdateProfile = (data: UpdateProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onChangePassword = (data: ChangePasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  const onUpdatePaymentMethods = (data: PaymentMethodForm) => {
    updatePaymentMutation.mutate(data);
  };

  

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Photo - Display Only */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="mr-2" size={20} />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage src={user?.profilePhoto} />
                <AvatarFallback className="text-2xl bg-gold-100 text-gold-600">
                  {getUserInitials(user?.fullName || "User")}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-gray-500">
                Profile photo display
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information - Collapsible */}
        <Card className="lg:col-span-2">
          <Collapsible open={isPersonalInfoOpen} onOpenChange={setIsPersonalInfoOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between border-gray-200 hover:bg-gray-50 h-auto p-4"
                type="button"
                data-testid="button-toggle-personal-info"
              >
                <div className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-gray-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Personal Information</div>
                    <div className="text-sm text-gray-500">Name, phone, email details</div>
                  </div>
                </div>
                {isPersonalInfoOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
                                className="focus:ring-gold-500 focus:border-gold-500"
                                data-testid="input-full-name"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            value={user?.email}
                            disabled
                            className="pl-10 bg-gray-100"
                            data-testid="input-email"
                          />
                        </div>
                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="tel"
                                  placeholder="Enter your phone number" 
                                  className="pl-10 focus:ring-gold-500 focus:border-gold-500"
                                  data-testid="input-phone"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <div className="relative">
                          <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            value={user?.username}
                            disabled
                            className="pl-10 bg-gray-100"
                            data-testid="input-username"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Referral Code</label>
                        <Input 
                          value={user?.referralCode}
                          disabled
                          className="bg-gold-50 border-gold-200 font-mono"
                          data-testid="input-referral-code"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Member Since</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                            disabled
                            className="pl-10 bg-gray-100"
                            data-testid="input-member-since"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="gold-gradient hover:from-gold-600 hover:to-gold-700 text-white"
                      data-testid="button-update-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Profile
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      {/* Withdrawal Details Section - Collapsible */}
      <Card className="mt-8">
        <Collapsible open={isWithdrawalDetailsOpen} onOpenChange={setIsWithdrawalDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between border-gray-200 hover:bg-gray-50 h-auto p-4"
              type="button"
              data-testid="button-toggle-withdrawal-details"
            >
              <div className="flex items-center">
                <Wallet className="mr-2 h-5 w-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Withdrawal Details</div>
                  <div className="text-sm text-gray-500">UPI and bank account information</div>
                </div>
                {((user as any)?.upiId || (user as any)?.accountNumber) && (
                  <DollarSign className="ml-2 h-4 w-4 text-green-600" />
                )}
              </div>
              {isWithdrawalDetailsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <CardContent>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onUpdatePaymentMethods)} className="space-y-6">
                  
                  {/* UPI Details */}
                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-green-800 flex items-center">
                        <Smartphone className="mr-2 h-4 w-4" />
                        UPI Payment Details
                      </h3>
                      {(user as any)?.upiId && (
                        <DollarSign className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <FormField
                      control={paymentForm.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-green-800">UPI ID</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Smartphone className="absolute left-3 top-3 h-4 w-4 text-green-600" />
                              <Input 
                                placeholder="yourname@paytm, yourname@phonepe, etc." 
                                className="pl-10 focus:ring-green-500 focus:border-green-500"
                                data-testid="input-upi-id"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-green-600 mt-1">
                            💡 Recommended for instant withdrawals with lower fees
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bank Account Details */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-blue-800 flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Bank Account Details
                      </h3>
                      {(user as any)?.accountNumber && (
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="accountHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-800">Account Holder Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="As per bank records" 
                                className="focus:ring-blue-500 focus:border-blue-500"
                                data-testid="input-account-holder"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-800">Account Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter account number" 
                                className="focus:ring-blue-500 focus:border-blue-500"
                                data-testid="input-account-number"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="ifscCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-800">IFSC Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. SBIN0001234" 
                                className="focus:ring-blue-500 focus:border-blue-500"
                                data-testid="input-ifsc-code"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-800">Bank Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. State Bank of India" 
                                className="focus:ring-blue-500 focus:border-blue-500"
                                data-testid="input-bank-name"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      🏦 Bank transfers may take 1-3 business days to process
                    </p>
                  </div>

                  {/* Fee Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="text-amber-600 mr-2 mt-0.5" size={16} />
                      <div>
                        <p className="text-sm text-amber-800 font-medium">Withdrawal Fee Notice</p>
                        <p className="text-xs text-amber-700 mt-1">
                          A 5% processing fee will be deducted from all withdrawal amounts using these payment methods.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={updatePaymentMutation.isPending}
                    className="gold-gradient hover:from-gold-600 hover:to-gold-700 text-white"
                    data-testid="button-update-payment-methods"
                  >
                    {updatePaymentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Payment Methods
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Telegram Group Section - Collapsible */}
      <Card className="mt-8">
        <Collapsible open={isTelegramGroupOpen} onOpenChange={setIsTelegramGroupOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between border-gray-200 hover:bg-gray-50 h-auto p-4"
              type="button"
              data-testid="button-toggle-telegram-group"
            >
              <div className="flex items-center">
                <MessageCircle className="mr-2 h-5 w-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Join Our Telegram Group</div>
                  <div className="text-sm text-gray-500">Get updates and support</div>
                </div>
              </div>
              {isTelegramGroupOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <MessageCircle className="text-blue-600 mr-3 mt-1" size={20} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-800 mb-2">Get Latest Updates & Support</h3>
                      <p className="text-sm text-blue-700 mb-4">
                        Join our official Telegram group to receive instant notifications about:
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1 mb-4">
                        <li>• Investment tips and market updates</li>
                        <li>• Platform announcements</li>
                        <li>• Customer support</li>
                        <li>• Community discussions</li>
                      </ul>
                      <TelegramJoinButton />
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" size={16} />
                    <p className="text-xs text-amber-700">
                      <strong>Note:</strong> This is our official support channel. Beware of fake groups and always verify the group link through our platform.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Change Password Section - Collapsible */}
      <Card className="mt-8">
        <Collapsible open={isPasswordChangeOpen} onOpenChange={setIsPasswordChangeOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between border-gray-200 hover:bg-gray-50 h-auto p-4"
              type="button"
              data-testid="button-toggle-password-change"
            >
              <div className="flex items-center">
                <Key className="mr-2 h-5 w-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Change Password</div>
                  <div className="text-sm text-gray-500">Update your account password</div>
                </div>
              </div>
              {isPasswordChangeOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter your current password" 
                              className="focus:ring-gold-500 focus:border-gold-500"
                              data-testid="input-current-password"
                              {...field} 
                            />
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
                            <Input 
                              type="password"
                              placeholder="Enter new password" 
                              className="focus:ring-gold-500 focus:border-gold-500"
                              data-testid="input-new-password"
                              {...field} 
                            />
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
                            <Input 
                              type="password"
                              placeholder="Confirm new password" 
                              className="focus:ring-gold-500 focus:border-gold-500"
                              data-testid="input-confirm-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="gold-gradient hover:from-gold-600 hover:to-gold-700 text-white"
                    data-testid="button-change-password"
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </AppLayout>
  );
}
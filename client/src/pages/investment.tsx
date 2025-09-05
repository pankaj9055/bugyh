import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, DollarSign, Calendar, Target } from "lucide-react";

export default function Investment() {
  const user = authService.getUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/investment-plans"],
  });

  const { data: userInvestments = [], isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/investments"],
  });

  const investMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("POST", "/api/investments", { planId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Investment failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Investment Successful!",
        description: "Your investment plan has been activated successfully. Daily returns will start today!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Investment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInvest = (planId: number, amount: string) => {
    const currentBalance = parseFloat(user?.balance || "0");
    const planAmount = parseFloat(amount);

    if (currentBalance < planAmount) {
      toast({
        title: "Insufficient Balance",
        description: "Please deposit funds to continue with this investment.",
        variant: "destructive",
      });
      return;
    }

    investMutation.mutate(planId);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-3 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Investment Plans</h1>
        <p className="text-sm md:text-base text-gray-600">Choose the perfect investment plan to grow your wealth</p>
        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gold-50 rounded-lg border-l-4 border-gold-400">
          <p className="text-sm font-medium text-gold-800">
            Current Balance: <span className="text-base md:text-lg font-bold">₹{parseFloat(user?.balance || "0").toLocaleString()}</span>
          </p>
        </div>
      </div>

        {/* Active Investments */}
        {userInvestments && userInvestments.length > 0 && (
          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Your Active Investments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {userInvestments.map((investment: any) => (
                <Card key={investment.id} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Plan {investment.planId}</h3>
                      <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                        {investment.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-semibold">₹{parseFloat(investment.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Return:</span>
                        <span className="font-semibold text-green-600">₹{parseFloat(investment.dailyReturn).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Returned:</span>
                        <span className="font-semibold text-green-600">₹{parseFloat(investment.totalReturned || "0").toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Start Date:</span>
                        <span>{new Date(investment.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Investment Plans */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Available Investment Plans</h2>
          
          {plansLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {plans?.map((plan: any) => {
                return (
                  <Card 
                    key={plan.id} 
                    className="transition-all cursor-pointer border-gold-200 hover:border-gold-300 hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-center text-lg font-semibold text-gray-900 flex items-center justify-center">
                        {plan.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center space-y-3">
                        <div className="text-3xl font-bold text-gold-600">
                          ₹{parseFloat(plan.amount).toLocaleString()}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-center text-green-600">
                            <TrendingUp size={14} className="mr-1" />
                            Daily: ₹{parseFloat(plan.dailyReturn).toLocaleString()}
                          </div>
                          <div className="flex items-center justify-center text-blue-600">
                            <DollarSign size={14} className="mr-1" />
                            Max/day: ₹{parseFloat(plan.maxWithdrawalPerDay).toLocaleString()}
                          </div>
                          <div className="flex items-center justify-center text-purple-600">
                            <Calendar size={14} className="mr-1" />
                            Duration: {plan.durationDays} days
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="text-xs text-gray-500 mb-2">
                            ROI: {((parseFloat(plan.dailyReturn) / parseFloat(plan.amount)) * 100).toFixed(1)}%/day
                          </div>
                          <Button 
                            onClick={() => handleInvest(plan.id, plan.amount)}
                            className="w-full gold-gradient hover:from-gold-600 hover:to-gold-700 text-white font-medium transition-colors"
                            disabled={investMutation.isPending || parseFloat(user?.balance || "0") < parseFloat(plan.amount)}
                          >
                            {investMutation.isPending ? "Investing..." : "Invest Now"}
                          </Button>
                          {parseFloat(user?.balance || "0") < parseFloat(plan.amount) && (
                            <p className="text-xs text-red-500 mt-1">Insufficient balance</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Investment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <Target className="text-blue-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">How It Works</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Choose any investment plan (unlimited times)</li>
                <li>• Receive daily returns for 20 days</li>
                <li>• Withdraw daily returns anytime</li>
                <li>• Reinvest completed plans anytime</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-3">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Benefits</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Guaranteed daily returns</li>
                <li>• Flexible withdrawal options</li>
                <li>• No hidden fees</li>
                <li>• 24/7 support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full mr-3">
                  <DollarSign className="text-purple-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Risk & Returns</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Higher investment = Higher returns</li>
                <li>• All investments are secured</li>
                <li>• Regular monitoring & updates</li>
                <li>• Transparent fee structure</li>
              </ul>
            </CardContent>
          </Card>
        </div>
    </AppLayout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Copy, 
  Share2, 
  Crown, 
  TrendingUp,
  Gift,
  Award,
  Target
} from "lucide-react";

export default function Refer() {
  const user = authService.getUser();
  const { toast } = useToast();

  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ["/api/referrals"],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: false, // We'll simulate leaderboard data
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

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Success", 
      description: "Referral link copied to clipboard!",
    });
  };

  const shareOnWhatsApp = () => {
    const message = `Join EV Investment and start earning daily returns! Use my referral code: ${user?.referralCode}. Register here: ${window.location.origin}/register?ref=${user?.referralCode}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const level1Referrals = referrals?.filter((r: any) => r.level === 1) || [];
  const level2Referrals = referrals?.filter((r: any) => r.level === 2) || [];
  const totalEarnings = referrals?.reduce((sum: number, r: any) => sum + parseFloat(r.totalEarned || "0"), 0) || 0;

  // Mock leaderboard data for demonstration
  const mockLeaderboard = [
    { name: "Amit Sharma", referrals: 25, earnings: 12500 },
    { name: "Priya Singh", referrals: 18, earnings: 9000 },
    { name: user?.fullName || "You", referrals: level1Referrals.length, earnings: totalEarnings },
    { name: "Rahul Gupta", referrals: 15, earnings: 7500 },
    { name: "Neha Patel", referrals: 12, earnings: 6000 }
  ].sort((a, b) => b.earnings - a.earnings);

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-3 md:mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Referral Program</h1>
          <p className="text-sm md:text-base text-gray-600">Earn rewards by inviting friends to join EV Investment</p>
        </div>

        {/* Referral Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-purple-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Level 1 Referrals</p>
                  <p className="text-2xl font-bold text-gray-900">{level1Referrals.length}</p>
                  <p className="text-xs text-green-600">10% commission</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="text-purple-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Level 2 Referrals</p>
                  <p className="text-2xl font-bold text-gray-900">{level2Referrals.length}</p>
                  <p className="text-xs text-green-600">2% commission</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Target className="text-blue-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-gold-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalEarnings.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
                <div className="bg-gold-100 p-3 rounded-full">
                  <Gift className="text-gold-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Referral Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Your Referral Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gold-50 border-2 border-dashed border-gold-300 rounded-lg p-6 text-center mb-4">
                <div className="text-3xl font-bold text-gold-600 mb-3">{user?.referralCode}</div>
                <p className="text-sm text-gray-600 mb-4">Share this code to earn commission on referrals</p>
                
                <div className="space-y-3">
                  <Button 
                    onClick={copyReferralCode}
                    className="w-full gold-gradient hover:from-gold-600 hover:to-gold-700 text-white"
                  >
                    <Copy size={16} className="mr-2" />
                    Copy Referral Code
                  </Button>
                  
                  <Button 
                    onClick={copyReferralLink}
                    variant="outline"
                    className="w-full border-gold-300 text-gold-600 hover:bg-gold-50"
                  >
                    <Share2 size={16} className="mr-2" />
                    Copy Referral Link
                  </Button>
                  
                  <Button 
                    onClick={shareOnWhatsApp}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Share2 size={16} className="mr-2" />
                    Share on WhatsApp
                  </Button>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">Referral Link:</p>
                <Input 
                  value={`${window.location.origin}/register?ref=${user?.referralCode}`}
                  readOnly
                  className="text-center text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Commission Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Commission Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-purple-800">Level 1 - Direct Referrals</h4>
                    <span className="text-2xl font-bold text-purple-600">10%</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Earn 10% commission on the first deposit of users you directly refer
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-800">Level 2 - Sub Referrals</h4>
                    <span className="text-2xl font-bold text-blue-600">2%</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Earn 2% commission when your referrals refer new users
                  </p>
                </div>

                <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
                  <div className="flex items-center justify-center">
                    <Crown className="text-gold-600 mr-2" size={20} />
                    <span className="font-semibold text-gold-800">Unlimited Earning Potential</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Award className="mr-2 text-gold-600" size={20} />
              Referral Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockLeaderboard.map((user, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    user.name === authService.getUser()?.fullName 
                      ? 'bg-gold-50 border-2 border-gold-200' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                      index === 0 ? 'bg-gold-100 text-gold-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.referrals} referrals</p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">₹{user.earnings.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How to Refer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">How to Refer & Earn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="text-blue-600" size={24} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Share Your Code</h4>
                <p className="text-sm text-gray-600">Share your unique referral code with friends and family</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-green-600" size={24} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">2. They Sign Up</h4>
                <p className="text-sm text-gray-600">Your friends register using your referral code</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">3. They Invest</h4>
                <p className="text-sm text-gray-600">When they make their first deposit and start investing</p>
              </div>

              <div className="text-center">
                <div className="bg-gold-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="text-gold-600" size={24} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">4. You Earn</h4>
                <p className="text-sm text-gray-600">Receive instant commission credited to your account</p>
              </div>
            </div>
          </CardContent>
        </Card>
    </AppLayout>
  );
}

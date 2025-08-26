import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, DollarSign, Timer, RefreshCw } from "lucide-react";

interface ActiveInvestment {
  id: string;
  planName: string;
  amount: string;
  dailyReturn: string;
  totalReturned: string;
  status: string;
  startDate: string;
  endDate?: string;
  daysRemaining: number;
  totalDays: number;
}

interface ActiveInvestmentsProps {
  investments: ActiveInvestment[];
  isLoading: boolean;
  onReinvest?: (investment: ActiveInvestment) => void;
}

export function ActiveInvestments({ investments, isLoading, onReinvest }: ActiveInvestmentsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Active Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (investments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Active Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Investments</h3>
            <p className="text-gray-600 mb-4">Start investing to see your active plans here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="mr-2 text-gold-600" size={20} />
          Active Investments ({investments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {investments.map((investment) => {
            const progressPercentage = ((investment.totalDays - investment.daysRemaining) / investment.totalDays) * 100;
            const dailyProfit = parseFloat(investment.dailyReturn);
            const totalReturned = parseFloat(investment.totalReturned);
            
            return (
              <div
                key={investment.id}
                className="bg-gradient-to-r from-gold-50 to-gold-100 border border-gold-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{investment.planName}</h4>
                    <p className="text-sm text-gray-600">
                      Investment: ₹{parseFloat(investment.amount).toLocaleString()}
                    </p>
                  </div>
                  <Badge 
                    className={`${
                      investment.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {investment.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-green-600 mb-1">
                      <DollarSign size={14} className="mr-1" />
                      <span className="text-xs font-medium">Daily Return</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      ₹{dailyProfit.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center text-blue-600 mb-1">
                      <TrendingUp size={14} className="mr-1" />
                      <span className="text-xs font-medium">Total Earned</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      ₹{totalReturned.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center text-orange-600 mb-1">
                      <Timer size={14} className="mr-1" />
                      <span className="text-xs font-medium">Days Left</span>
                    </div>
                    <p className="text-lg font-bold text-orange-600">
                      {investment.daysRemaining}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center text-purple-600 mb-1">
                      <Calendar size={14} className="mr-1" />
                      <span className="text-xs font-medium">Total Days</span>
                    </div>
                    <p className="text-lg font-bold text-purple-600">
                      {investment.totalDays}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}% Complete</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* Reinvest Button for Completed Plans */}
                {investment.status === 'completed' && onReinvest && (
                  <div className="mt-3 pt-3 border-t border-gold-300">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Plan completed! You earned ₹{totalReturned.toLocaleString()}</p>
                        <p className="text-xs">Available to reinvest with profits</p>
                      </div>
                      <Button
                        onClick={() => onReinvest(investment)}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
                        size="sm"
                      >
                        <RefreshCw size={14} className="mr-1" />
                        Reinvest
                      </Button>
                    </div>
                  </div>
                )}

                {/* Investment Period */}
                <div className="text-xs text-gray-600 text-center">
                  Started: {new Date(investment.startDate).toLocaleDateString()} 
                  {investment.endDate && (
                    <span> • Ends: {new Date(investment.endDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
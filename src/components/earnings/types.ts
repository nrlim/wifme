export interface MuthawifAnalytics {
  role: "MUTHAWIF";
  period: string;
  summary: {
    availableBalance: number;
    pendingBalance: number;
    grossEarnings: number;
    netIncome: number;
    platformFeeTotal: number;
    feeRate: number;
    totalCompleted: number;
    totalPending: number;
    rating: number;
    totalReviews: number;
  };
  chartData: { month: string; gross: number; net: number; count: number }[];
  weeklyTrend: { week: string; amount: number }[];
  transactions: {
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string | null;
    createdAt: string;
  }[];
  payouts: {
    id: string;
    amount: number;
    status: string;
    bankName: string;
    accountHolderName: string;
    createdAt: string;
  }[];
}

export interface AmirAnalytics {
  role: "AMIR";
  period: string;
  summary: {
    gmv: number;
    periodGmv: number;
    totalCommission: number;
    periodCommission: number;
    feeRate: number;
    totalBookings: number;
    periodBookings: number;
    totalMuthawifs: number;
    verifiedMuthawifs: number;
    pendingPayoutsCount: number;
    pendingPayoutsAmount: number;
    statusDistribution: {
      PENDING: number;
      CONFIRMED: number;
      COMPLETED: number;
      CANCELLED: number;
    };
  };
  gmvChartData: { month: string; gmv: number; commission: number; count: number }[];
  topEarners: { id: string; name: string; total: number; count: number }[];
  pendingPayouts: {
    id: string;
    amount: number;
    bankName: string;
    accountHolderName: string;
    userName: string;
    userEmail: string;
    createdAt: string;
  }[];
  recentTransactions: {
    id: string;
    muthawifName: string;
    jamaahName: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

export type AnalyticsData = MuthawifAnalytics | AmirAnalytics;

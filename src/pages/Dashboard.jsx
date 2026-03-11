import {
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  MoreHorizontal,
  Calendar,
  UserPlus,
  Loader
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

const API_URL = "http://localhost:5000/api";

function Dashboard() {
  const [timeframe, setTimeframe] = useState("week");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentLoans, setRecentLoans] = useState([]);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch stats overview
      const statsRes = await axios.get(`${API_URL}/loans/stats/overview`, { headers });
      
      // Fetch recent loans (last 5)
      const loansRes = await axios.get(`${API_URL}/loans?limit=5&sortBy=createdAt&sortOrder=desc`, { headers });
      
      // Fetch all loans for calculations
      const allLoansRes = await axios.get(`${API_URL}/loans?limit=1000`, { headers });
      
      // Fetch users for user metrics
      const usersRes = await axios.get(`${API_URL}/users?limit=1000`, { headers });

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      
      if (loansRes.data.success) {
        setRecentLoans(loansRes.data.data);
      }
      
      if (allLoansRes.data.success) {
        setLoans(allLoansRes.data.data);
      }
      
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics from data
  const calculateMetrics = () => {
    if (!loans.length || !stats || !users.length) return null;

    // Get stats from API
    const byStatus = stats.byStatus || [];
    const byRisk = stats.byRisk || [];

    // Calculate totals
    const totalPortfolio = byStatus.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalPaid = byStatus.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    
    // Loan counts by status
    const activeLoans = byStatus.find(s => s._id === 'active')?.count || 0;
    const overdueLoans = byStatus.find(s => s._id === 'overdue')?.count || 0;
    const completedLoans = byStatus.find(s => s._id === 'completed')?.count || 0;
    const pendingLoans = byStatus.find(s => s._id === 'pending')?.count || 0;
    const approvedLoans = byStatus.find(s => s._id === 'approved')?.count || 0;

    // Calculate amounts
    const activeAmount = byStatus.find(s => s._id === 'active')?.totalAmount || 0;
    const overdueAmount = byStatus.find(s => s._id === 'overdue')?.totalAmount || 0;
    const completedAmount = byStatus.find(s => s._id === 'completed')?.totalAmount || 0;

    // User counts
    const totalUsers = users.length;
    const newUsersThisWeek = users.filter(u => {
      const created = new Date(u.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created >= weekAgo;
    }).length;

    // Calculate average loan size
    const avgLoanSize = loans.length > 0 
      ? loans.reduce((sum, l) => sum + l.amount, 0) / loans.length 
      : 0;

    // Calculate approval rate
    const totalProcessed = approvedLoans + (byStatus.find(s => s._id === 'rejected')?.count || 0);
    const approvalRate = totalProcessed > 0 
      ? (approvedLoans / totalProcessed) * 100 
      : 0;

    // Weekly chart data
    const weeklyData = generateWeeklyData();

    return {
      totalUsers,
      newUsersThisWeek,
      totalPortfolio,
      totalPaid,
      activeLoans,
      activeAmount,
      overdueLoans,
      overdueAmount,
      completedLoans,
      completedAmount,
      pendingLoans,
      approvedLoans,
      avgLoanSize,
      approvalRate,
      weeklyData
    };
  };

  // Generate weekly chart data
  const generateWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    return days.map((day, index) => {
      // Simulate data based on actual loans (you can make this more sophisticated)
      const dayLoans = loans.filter(l => {
        const loanDate = new Date(l.createdAt);
        return loanDate.getDay() === index;
      });
      
      const disbursed = dayLoans.reduce((sum, l) => sum + l.amount, 0);
      const collected = dayLoans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
      
      // Scale for visualization (normalize to max height)
      const maxAmount = Math.max(...loans.map(l => l.amount)) || 1000;
      
      return {
        day,
        disbursed: (disbursed / maxAmount) * 100,
        collected: (collected / maxAmount) * 100,
        actualDisbursed: disbursed,
        actualCollected: collected
      };
    });
  };

  const metrics = calculateMetrics();

  // Handle export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Dashboard Summary Sheet
      const summaryData = [
        ['Dashboard Summary', new Date().toLocaleDateString()],
        ['Metric', 'Value'],
        ['Total Users', metrics?.totalUsers || 0],
        ['New Users (This Week)', metrics?.newUsersThisWeek || 0],
        ['Total Portfolio', `$${metrics?.totalPortfolio?.toLocaleString() || 0}`],
        ['Active Loans', `${metrics?.activeLoans || 0} ($${metrics?.activeAmount?.toLocaleString()})`],
        ['Overdue Loans', `${metrics?.overdueLoans || 0} ($${metrics?.overdueAmount?.toLocaleString()})`],
        ['Completed Loans', `${metrics?.completedLoans || 0} ($${metrics?.completedAmount?.toLocaleString()})`],
        ['Average Loan Size', `$${metrics?.avgLoanSize?.toFixed(0) || 0}`],
        ['Approval Rate', `${metrics?.approvalRate?.toFixed(1) || 0}%`]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws, "Dashboard Summary");
      
      // Recent Loans Sheet
      const loansData = recentLoans.map(l => ({
        'Loan ID': l.loanId,
        'Borrower': l.borrower?.name,
        'Amount': l.amount,
        'Status': l.status,
        'Due Date': new Date(l.endDate).toLocaleDateString(),
        'Progress': `${((l.paidAmount / l.amount) * 100).toFixed(0)}%`
      }));
      
      const ws2 = XLSX.utils.json_to_sheet(loansData);
      XLSX.utils.book_append_sheet(wb, ws2, "Recent Loans");
      
      // Save file
      XLSX.writeFile(wb, `dashboard_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Dashboard exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export dashboard');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header Section with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Real-time loan performance and system metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            {["day", "week", "month"].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  timeframe === period
                    ? "bg-green-600 text-white shadow-sm shadow-green-600/30"
                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          
          {/* Export Button */}
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all shadow-sm disabled:opacity-50"
          >
            {exporting ? <Loader className="animate-spin" size={18} /> : <Download size={18} />}
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={metrics?.totalUsers?.toLocaleString() || "0"}
          trend={`+${metrics?.newUsersThisWeek || 0} this week`}
          trendUp={true}
          icon={<Users size={22} />}
          color="green"
        />
        <StatCard
          title="Active Loans"
          value={`$${metrics?.activeAmount?.toLocaleString() || '0'}`}
          subtitle={`${metrics?.activeLoans || 0} loans`}
          trend={`+${metrics?.activeLoans || 0} active`}
          trendUp={true}
          icon={<CreditCard size={22} />}
          color="emerald"
        />
        <StatCard
          title="Overdue Loans"
          value={`$${metrics?.overdueAmount?.toLocaleString() || '0'}`}
          subtitle={`${metrics?.overdueLoans || 0} loans`}
          trend={metrics?.overdueLoans > 0 ? `${metrics.overdueLoans} overdue` : "0 overdue"}
          trendUp={false}
          icon={<AlertTriangle size={22} />}
          color="orange"
        />
        <StatCard
          title="Completed Loans"
          value={`$${metrics?.completedAmount?.toLocaleString() || '0'}`}
          subtitle={`${metrics?.completedLoans || 0} loans`}
          trend={`+${metrics?.completedLoans || 0} completed`}
          trendUp={true}
          icon={<CheckCircle size={22} />}
          color="green"
        />
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                Loan Performance
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Weekly disbursement vs collection
              </p>
            </div>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2">
            {metrics?.weeklyData?.map((data, i) => (
              <div key={data.day} className="flex flex-col items-center gap-2 w-full">
                <div className="w-full flex justify-center gap-1">
                  <div 
                    className="w-3 bg-green-500 rounded-t-sm transition-all duration-500" 
                    style={{ height: `${Math.max(data.disbursed, 5)}px` }}
                    title={`Disbursed: $${data.actualDisbursed.toLocaleString()}`}
                  />
                  <div 
                    className="w-3 bg-green-200 rounded-t-sm transition-all duration-500" 
                    style={{ height: `${Math.max(data.collected, 5)}px` }}
                    title={`Collected: $${data.actualCollected.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs text-gray-500">{data.day}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span className="text-xs text-gray-600">Disbursed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
              <span className="text-xs text-gray-600">Collected</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-green-600" />
            Quick Overview
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <DollarSign size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg. Loan Size</p>
                  <p className="font-semibold text-gray-800">${metrics?.avgLoanSize?.toFixed(0) || '0'}</p>
                </div>
              </div>
              <span className="text-xs text-green-600 bg-white px-2 py-1 rounded-full">
                +{((metrics?.avgLoanSize || 0) / 1000).toFixed(1)}k
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Users size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Users</p>
                  <p className="font-semibold text-gray-800">+{metrics?.newUsersThisWeek || 0} this week</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/users')}
                className="text-green-600 hover:text-green-700"
              >
                <UserPlus size={18} />
              </button>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <CreditCard size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approval Rate</p>
                  <p className="font-semibold text-gray-800">{metrics?.approvalRate?.toFixed(1) || '0'}%</p>
                </div>
              </div>
              <span className="text-xs text-green-600">
                +{((metrics?.approvalRate || 0) / 20).toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <AlertTriangle size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Loans</p>
                  <p className="font-semibold text-gray-800">{metrics?.pendingLoans || 0} waiting</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/loans?status=pending')}
                className="text-orange-600 hover:text-orange-700 text-xs"
              >
                Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loans Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CreditCard size={20} className="text-green-600" />
                Recent Loans Activity
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Latest loan applications and status updates
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/loans')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
              >
                <Filter size={16} />
                View All
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                <Calendar size={16} />
                {timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : 'Today'}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-6 py-4">Borrower</th>
                <th className="px-6 py-4">Loan ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentLoans.map((loan) => (
                <LoanRow 
                  key={loan._id}
                  borrower={loan.borrower?.name || 'N/A'}
                  loanId={loan.loanId}
                  amount={`$${loan.amount?.toLocaleString()}`}
                  status={loan.status}
                  dueDate={new Date(loan.endDate).toLocaleDateString('en-US', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                  progress={Math.round((loan.paidAmount / loan.amount) * 100) || 0}
                  onClick={() => navigate(`/loans/${loan._id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {recentLoans.length} of {loans.length} loans
          </p>
          <button 
            onClick={() => navigate('/loans')}
            className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            View All Loans
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced StatCard Component
function StatCard({ title, value, subtitle, trend, trendUp, icon, color = "green" }) {
  const colorVariants = {
    green: "bg-green-50 text-green-700 border-green-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl ${colorVariants[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
            trendUp 
              ? "bg-green-50 text-green-700" 
              : "bg-orange-50 text-orange-700"
          }`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-800">
            {value}
          </h3>
          {subtitle && (
            <span className="text-xs text-gray-500">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Loan Row Component
function LoanRow({ borrower, loanId, amount, status, dueDate, progress, onClick }) {
  const statusConfig = {
    active: {
      color: "bg-green-100 text-green-700 border-green-200",
      label: "Active",
      progressColor: "bg-green-500"
    },
    overdue: {
      color: "bg-orange-100 text-orange-700 border-orange-200",
      label: "Overdue",
      progressColor: "bg-orange-500"
    },
    pending: {
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      label: "Pending",
      progressColor: "bg-yellow-500"
    },
    approved: {
      color: "bg-blue-100 text-blue-700 border-blue-200",
      label: "Approved",
      progressColor: "bg-blue-500"
    },
    completed: {
      color: "bg-gray-100 text-gray-700 border-gray-200",
      label: "Completed",
      progressColor: "bg-green-600"
    },
    rejected: {
      color: "bg-red-100 text-red-700 border-red-200",
      label: "Rejected",
      progressColor: "bg-red-500"
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <tr 
      className="hover:bg-gray-50/80 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <td className="px-6 py-4">
        <div className="font-medium text-gray-800">{borrower}</div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{loanId}</td>
      <td className="px-6 py-4 font-medium text-gray-800">{amount}</td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${config.color}`}>
          {config.label}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{dueDate}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className={`${config.progressColor} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{progress}%</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <MoreHorizontal size={16} className="text-gray-500" />
        </button>
      </td>
    </tr>
  );
}

export default Dashboard;
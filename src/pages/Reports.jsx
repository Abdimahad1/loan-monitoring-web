import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard,
  Download,
  Calendar,
  FileText,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Loader,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = "http://localhost:5000/api";

function Reports() {
  const [reportType, setReportType] = useState("performance");
  const [dateRange, setDateRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Date range calculations
  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      week: new Date(now.setDate(now.getDate() - 7)),
      month: new Date(now.setMonth(now.getMonth() - 1)),
      quarter: new Date(now.setMonth(now.getMonth() - 3)),
      year: new Date(now.setFullYear(now.getFullYear() - 1))
    };
    return ranges[dateRange];
  };

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch stats overview
      const statsRes = await axios.get(`${API_URL}/loans/stats/overview`, { headers });
      
      // Fetch all loans for calculations
      const loansRes = await axios.get(`${API_URL}/loans?limit=1000`, { headers });
      
      // Fetch users for growth metrics
      const usersRes = await axios.get(`${API_URL}/users?role=borrower&limit=1000`, { headers });

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      
      if (loansRes.data.success) {
        setLoans(loansRes.data.data);
      }
      
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics from loans data
  const calculateMetrics = () => {
    if (!loans.length || !stats) return null;

    const totalPortfolio = stats.byStatus?.reduce((sum, s) => sum + (s.totalAmount || 0), 0) || 0;
    const totalPaid = stats.byStatus?.reduce((sum, s) => sum + (s.paidAmount || 0), 0) || 0;
    
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const completedLoans = loans.filter(l => l.status === 'completed').length;
    const overdueLoans = loans.filter(l => l.status === 'overdue').length;
    const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;

    const avgLoanSize = loans.length > 0 
      ? loans.reduce((sum, l) => sum + l.amount, 0) / loans.length 
      : 0;

    const defaultRate = loans.length > 0 
      ? (defaultedLoans / loans.length) * 100 
      : 0;

    const collectionRate = totalPortfolio > 0 
      ? (totalPaid / totalPortfolio) * 100 
      : 0;

    const activeBorrowers = users.length;

    // Calculate repayment time (average days to repay completed loans)
    const completedWithRepayment = loans.filter(l => 
      l.status === 'completed' && l.payments?.length > 0
    );
    
    const avgRepaymentTime = completedWithRepayment.length > 0
      ? completedWithRepayment.reduce((sum, l) => {
          const firstPayment = l.payments[0]?.date;
          if (firstPayment) {
            const days = Math.ceil((new Date(firstPayment) - new Date(l.startDate)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }
          return sum;
        }, 0) / completedWithRepayment.length
      : 24; // Default fallback

    return {
      totalPortfolio,
      totalPaid,
      collectionRate,
      avgLoanSize,
      defaultRate,
      activeLoans,
      completedLoans,
      overdueLoans,
      defaultedLoans,
      activeBorrowers,
      avgRepaymentTime: Math.round(avgRepaymentTime)
    };
  };

  const metrics = calculateMetrics();

  // Prepare chart data based on report type
  const getChartData = () => {
    if (!stats || !loans.length) return [];

    switch(reportType) {
      case 'performance':
        return stats.byStatus?.map(s => ({
          name: s._id,
          value: s.totalAmount || 0
        })) || [];
      
      case 'collection':
        return stats.byStatus?.map(s => ({
          name: s._id,
          value: s.paidAmount || 0
        })) || [];
      
      case 'risk':
        return stats.byRisk?.map(r => ({
          name: r._id,
          value: r.count || 0,
          avgScore: r.avgScore
        })) || [];
      
      case 'users':
        return [
          { name: 'Borrowers', value: users.length },
          { name: 'Guarantors', value: users.filter(u => u.role === 'guarantor').length },
          { name: 'Active', value: users.filter(u => u.isActive).length }
        ];
      
      default:
        return [];
    }
  };

  const chartData = getChartData();

  // Handle report export
  const handleExportReport = async (reportTitle, reportData) => {
    setExporting(true);
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Convert data to worksheet
      let ws;
      if (reportType === 'performance' && stats?.byStatus) {
        ws = XLSX.utils.json_to_sheet(stats.byStatus);
      } else if (reportType === 'risk' && stats?.byRisk) {
        ws = XLSX.utils.json_to_sheet(stats.byRisk);
      } else if (loans.length) {
        const exportLoans = loans.map(l => ({
          'Loan ID': l.loanId,
          'Borrower': l.borrower?.name,
          'Amount': l.amount,
          'Status': l.status,
          'Paid Amount': l.paidAmount,
          'Remaining': l.remainingAmount,
          'Start Date': new Date(l.startDate).toLocaleDateString(),
          'End Date': new Date(l.endDate).toLocaleDateString(),
          'Risk Level': l.risk?.level,
          'Created': new Date(l.createdAt).toLocaleDateString()
        }));
        ws = XLSX.utils.json_to_sheet(exportLoans);
      }

      if (ws) {
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        
        // Generate filename
        const filename = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Export
        XLSX.writeFile(wb, filename);
        toast.success('Report downloaded successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Available reports list
  const availableReports = [
    {
      id: 'loan-performance',
      title: 'Monthly Loan Performance',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: '2.4 MB',
      icon: <BarChart3 size={20} />,
      type: 'performance',
      data: stats?.byStatus
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment Report',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: '1.8 MB',
      icon: <Activity size={20} />,
      type: 'risk',
      data: stats?.byRisk
    },
    {
      id: 'collection-efficiency',
      title: 'Collection Efficiency',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: '1.2 MB',
      icon: <TrendingUp size={20} />,
      type: 'collection',
      data: {
        collectionRate: metrics?.collectionRate,
        totalPaid: metrics?.totalPaid,
        totalPortfolio: metrics?.totalPortfolio
      }
    },
    {
      id: 'user-acquisition',
      title: 'User Acquisition Report',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: '1.5 MB',
      icon: <Users size={20} />,
      type: 'users',
      data: {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        borrowers: users.filter(u => u.role === 'borrower').length,
        guarantors: users.filter(u => u.role === 'guarantor').length
      }
    },
    {
      id: 'financial-summary',
      title: 'Financial Summary',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: '2.1 MB',
      icon: <DollarSign size={20} />,
      type: 'financial',
      data: metrics
    },
    {
      id: 'compliance-report',
      title: 'Compliance Report',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      size: '1.3 MB',
      icon: <FileText size={20} />,
      type: 'compliance',
      data: {
        totalLoans: loans.length,
        activeLoans: metrics?.activeLoans,
        completedLoans: metrics?.completedLoans,
        overdueLoans: metrics?.overdueLoans,
        defaultedLoans: metrics?.defaultedLoans
      }
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            Comprehensive insights into loan performance and system metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            {["week", "month", "quarter", "year"].map((period) => (
              <button
                key={period}
                onClick={() => setDateRange(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  dateRange === period
                    ? "bg-green-600 text-white shadow-sm shadow-green-600/30"
                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => handleExportReport('Complete_Report', { stats, loans, users })}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg shadow-green-600/30 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader className="animate-spin" size={18} /> : <Download size={18} />}
            Export Report
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportTypeCard
          title="Loan Performance"
          value={`$${metrics?.totalPortfolio?.toLocaleString() || '0'}`}
          change={`+${((metrics?.collectionRate || 0) - 80).toFixed(1)}%`}
          trendUp={metrics?.collectionRate > 80}
          icon={<BarChart3 size={24} />}
          active={reportType === "performance"}
          onClick={() => setReportType("performance")}
        />
        <ReportTypeCard
          title="Collection Rate"
          value={`${metrics?.collectionRate?.toFixed(1) || '0'}%`}
          change={`${metrics?.collectionRate > 90 ? '+' : '-'}${Math.abs((metrics?.collectionRate || 0) - 90).toFixed(1)}%`}
          trendUp={metrics?.collectionRate > 90}
          icon={<TrendingUp size={24} />}
          active={reportType === "collection"}
          onClick={() => setReportType("collection")}
        />
        <ReportTypeCard
          title="Risk Analysis"
          value={`${metrics?.defaultRate?.toFixed(1) || '0'}%`}
          change={`${metrics?.defaultRate > 5 ? '+' : '-'}${Math.abs((metrics?.defaultRate || 0) - 5).toFixed(1)}%`}
          trendUp={metrics?.defaultRate < 5}
          icon={<Activity size={24} />}
          active={reportType === "risk"}
          onClick={() => setReportType("risk")}
        />
        <ReportTypeCard
          title="User Growth"
          value={`+${metrics?.activeBorrowers || 0}`}
          change={`+${((metrics?.activeBorrowers || 0) / 10).toFixed(1)}%`}
          trendUp={true}
          icon={<Users size={24} />}
          active={reportType === "users"}
          onClick={() => setReportType("users")}
        />
      </div>

      {/* Main Report Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PieChart size={20} className="text-green-600" />
              {reportType === "performance" && "Loan Performance Overview"}
              {reportType === "collection" && "Collection Rate Summary"}
              {reportType === "risk" && "Risk Distribution Analysis"}
              {reportType === "users" && "User Growth Metrics"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {dateRange === "week" && "Last 7 days"}
              {dateRange === "month" && "Last 30 days"}
              {dateRange === "quarter" && "Last 90 days"}
              {dateRange === "year" && "Last 12 months"}
            </p>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Value</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800 capitalize">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-800 text-right">
                    {item.name.includes('Risk') ? item.value : `$${item.value?.toLocaleString() || 0}`}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      item.name === 'low' || item.name === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : item.name === 'medium' || item.name === 'active'
                        ? 'bg-yellow-100 text-yellow-700'
                        : item.name === 'high' || item.name === 'overdue'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.avgScore 
                        ? `${((item.value / loans.length) * 100).toFixed(1)}% (Score: ${item.avgScore.toFixed(0)})`
                        : `${((item.value / (reportType === 'users' ? users.length : loans.length)) * 100).toFixed(1)}%`
                      }
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Reports Grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={20} className="text-green-600" />
              Available Reports
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Download detailed reports for offline analysis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableReports.map((report) => (
            <ReportDownloadCard
              key={report.id}
              report={report}
              onView={() => {
                setSelectedReport(report);
                setShowReportModal(true);
              }}
              onDownload={() => handleExportReport(report.title, report.data)}
              exporting={exporting}
            />
          ))}
        </div>
      </div>

      {/* Report Preview Modal */}
      {showReportModal && selectedReport && (
        <ReportPreviewModal
          report={selectedReport}
          onClose={() => {
            setShowReportModal(false);
            setSelectedReport(null);
          }}
          onDownload={() => handleExportReport(selectedReport.title, selectedReport.data)}
          exporting={exporting}
        />
      )}
    </div>
  );
}

function ReportTypeCard({ title, value, change, trendUp, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        p-6 rounded-xl border transition-all text-left
        ${active 
          ? "bg-gradient-to-br from-green-600 to-emerald-600 border-green-700 shadow-lg shadow-green-600/30" 
          : "bg-white border-gray-100 hover:border-green-300 hover:shadow-md"
        }
      `}
    >
      <div className={`p-3 rounded-xl w-fit mb-4 ${
        active ? "bg-white/20" : "bg-green-50"
      }`}>
        <div className={active ? "text-white" : "text-green-600"}>
          {icon}
        </div>
      </div>
      <div>
        <p className={`text-sm mb-1 ${active ? "text-green-100" : "text-gray-600"}`}>
          {title}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${
            active ? "text-white" : "text-gray-800"
          }`}>
            {value}
          </span>
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
            active 
              ? "bg-white/20 text-white" 
              : trendUp 
                ? "bg-green-100 text-green-700" 
                : "bg-orange-100 text-orange-700"
          }`}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </span>
        </div>
      </div>
    </button>
  );
}

function ReportDownloadCard({ report, onView, onDownload, exporting }) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-green-300 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition">
          <div className="text-green-600">
            {report.icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{report.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{report.date} • {report.size}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={onView}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Preview Report"
        >
          <Eye size={16} className="text-blue-600" />
        </button>
        <button 
          onClick={onDownload}
          disabled={exporting}
          className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          title="Download Report"
        >
          <Download size={16} className="text-green-600" />
        </button>
      </div>
    </div>
  );
}

function ReportPreviewModal({ report, onClose, onDownload, exporting }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="text-green-600">
                {report.icon}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{report.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{report.date}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Report Preview</h3>
            
            {report.type === 'performance' && report.data && (
              <div className="bg-gray-50 rounded-lg p-4">
                {report.data.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{item._id}</span>
                    <span className="text-sm font-medium text-gray-800">${item.totalAmount?.toLocaleString() || 0}</span>
                  </div>
                ))}
              </div>
            )}

            {report.type === 'risk' && report.data && (
              <div className="bg-gray-50 rounded-lg p-4">
                {report.data.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{item._id} Risk</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-800 block">{item.count} loans</span>
                      <span className="text-xs text-gray-500">Avg Score: {item.avgScore?.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {report.type === 'users' && report.data && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800">{report.data.total}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{report.data.active}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Borrowers</p>
                    <p className="text-lg font-semibold text-gray-800">{report.data.borrowers}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Guarantors</p>
                    <p className="text-lg font-semibold text-gray-800">{report.data.guarantors}</p>
                  </div>
                </div>
              </div>
            )}

            {report.type === 'financial' && report.data && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Portfolio</span>
                    <span className="text-sm font-medium text-gray-800">${report.data.totalPortfolio?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Collection Rate</span>
                    <span className="text-sm font-medium text-green-600">{report.data.collectionRate?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Loan Size</span>
                    <span className="text-sm font-medium text-gray-800">${report.data.avgLoanSize?.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Default Rate</span>
                    <span className="text-sm font-medium text-orange-600">{report.data.defaultRate?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {report.type === 'compliance' && report.data && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Loans</span>
                    <span className="text-sm font-medium text-gray-800">{report.data.totalLoans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Loans</span>
                    <span className="text-sm font-medium text-green-600">{report.data.activeLoans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-blue-600">{report.data.completedLoans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overdue</span>
                    <span className="text-sm font-medium text-orange-600">{report.data.overdueLoans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Defaulted</span>
                    <span className="text-sm font-medium text-red-600">{report.data.defaultedLoans}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={onDownload}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader className="animate-spin" size={16} /> : <Download size={16} />}
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;
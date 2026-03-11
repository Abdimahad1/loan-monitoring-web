import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Calendar,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Receipt,
  Ban,
  Mail,
  Phone
} from "lucide-react";
import { useState } from "react";

function Repayments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
          Repayment Monitoring
        </h1>
        <p className="text-gray-600 mt-1.5 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
          Track repayments, overdue accounts, and collection performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <RepaymentSummaryCard
          title="Total Collected"
          value="$124,500"
          subtitle="This month"
          trend="+8.2%"
          trendUp={true}
          icon={<DollarSign size={22} />}
          color="green"
        />
        <RepaymentSummaryCard
          title="On-Time Payments"
          value="38"
          subtitle="This week"
          trend="+12%"
          trendUp={true}
          icon={<CheckCircle size={22} />}
          color="emerald"
        />
        <RepaymentSummaryCard
          title="Overdue Payments"
          value="6"
          subtitle="$38,200"
          trend="-5%"
          trendUp={false}
          icon={<AlertTriangle size={22} />}
          color="orange"
        />
        <RepaymentSummaryCard
          title="Collection Rate"
          value="94.2%"
          subtitle="Target: 95%"
          trend="-0.8%"
          trendUp={false}
          icon={<TrendingUp size={22} />}
          color="blue"
        />
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by borrower or loan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Filters:</span>
            </div>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white text-gray-700 text-sm"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="defaulted">Defaulted</option>
              <option value="pending">Pending</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all">
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Repayment Schedule Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Payments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock size={20} className="text-green-600" />
                  Upcoming Payments
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Next 7 days schedule
                </p>
              </div>
              <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                12 payments due
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            <UpcomingPaymentRow 
              borrower="Ahmed Ali"
              amount="$500"
              dueDate="18 Feb 2026"
              daysLeft={3}
              avatar="AA"
            />
            <UpcomingPaymentRow 
              borrower="Fatima Noor"
              amount="$350"
              dueDate="19 Feb 2026"
              daysLeft={4}
              avatar="FN"
            />
            <UpcomingPaymentRow 
              borrower="Mohamed Hassan"
              amount="$450"
              dueDate="20 Feb 2026"
              daysLeft={5}
              avatar="MH"
            />
            <UpcomingPaymentRow 
              borrower="Aisha Ibrahim"
              amount="$280"
              dueDate="21 Feb 2026"
              daysLeft={6}
              avatar="AI"
            />
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
              View Full Schedule
              <TrendingUp size={16} />
            </button>
          </div>
        </div>

        {/* Risk Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            At-Risk Overview
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Clock size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue 1-30 days</p>
                  <p className="font-semibold text-gray-800">4 loans</p>
                </div>
              </div>
              <span className="text-sm font-medium text-orange-600">$24,500</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue 31-60 days</p>
                  <p className="font-semibold text-gray-800">2 loans</p>
                </div>
              </div>
              <span className="text-sm font-medium text-red-600">$13,700</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Ban size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Defaulted</p>
                  <p className="font-semibold text-gray-800">1 loan</p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600">$7,000</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total at risk</span>
              <span className="font-bold text-gray-800">$45,200</span>
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 transition shadow-lg shadow-green-600/30">
              Contact At-Risk Borrowers
            </button>
          </div>
        </div>
      </div>

      {/* Repayment Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Repayment Activity
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                <th className="px-6 py-4">Borrower</th>
                <th className="px-6 py-4">Loan ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Installment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Days Late</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <RepaymentRow 
                borrower="Ahmed Ali"
                borrowerAvatar="AA"
                loanId="LN-2026-001"
                amount="$5,000"
                installment="$500"
                status="paid"
                dueDate="15 Feb 2026"
                daysLate={0}
                risk="low"
              />
              <RepaymentRow 
                borrower="Mohamed Hassan"
                borrowerAvatar="MH"
                loanId="LN-2026-002"
                amount="$3,500"
                installment="$350"
                status="overdue"
                dueDate="10 Feb 2026"
                daysLate={5}
                risk="medium"
              />
              <RepaymentRow 
                borrower="Khalid Omar"
                borrowerAvatar="KO"
                loanId="LN-2026-003"
                amount="$7,000"
                installment="$700"
                status="defaulted"
                dueDate="05 Jan 2026"
                daysLate={20}
                risk="high"
              />
              <RepaymentRow 
                borrower="Aisha Ibrahim"
                borrowerAvatar="AI"
                loanId="LN-2026-004"
                amount="$2,800"
                installment="$280"
                status="pending"
                dueDate="15 Mar 2026"
                daysLate={0}
                risk="low"
              />
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing 1 to 4 of 38 payments
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              Previous
            </button>
            <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
              1
            </button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              2
            </button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              3
            </button>
            <span className="px-2 text-gray-500">...</span>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              8
            </button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepaymentSummaryCard({ title, value, subtitle, trend, trendUp, icon, color }) {
  const colorVariants = {
    green: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
    emerald: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200",
    orange: "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200",
    blue: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
  };

  return (
    <div className={`p-6 rounded-xl border ${colorVariants[color]} shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl bg-white text-${color}-600`}>
          {icon}
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
          trendUp ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
        }`}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          <span className="text-xs text-gray-500">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

function UpcomingPaymentRow({ borrower, amount, dueDate, daysLeft, avatar }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
          {avatar}
        </div>
        <div>
          <p className="font-medium text-gray-800">{borrower}</p>
          <p className="text-xs text-gray-500">Due: {dueDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-semibold text-gray-800">{amount}</span>
        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
          {daysLeft} days left
        </span>
        <button className="p-1.5 hover:bg-gray-200 rounded-lg transition">
          <MoreHorizontal size={16} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
}

function RepaymentRow({ borrower, borrowerAvatar, loanId, amount, installment, status, dueDate, daysLate, risk }) {
  const statusConfig = {
    paid: { color: "bg-green-100 text-green-700 border-green-200", label: "Paid" },
    overdue: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "Overdue" },
    defaulted: { color: "bg-red-100 text-red-700 border-red-200", label: "Defaulted" },
    pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Pending" }
  };

  const riskConfig = {
    low: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    high: "bg-red-100 text-red-700 border-red-200"
  };

  return (
    <tr className="hover:bg-gray-50/80 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs">
            {borrowerAvatar}
          </div>
          <span className="text-sm font-medium text-gray-800">{borrower}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="font-mono text-sm text-gray-600">{loanId}</span>
      </td>
      <td className="px-6 py-4">
        <span className="font-semibold text-gray-800">{amount}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-gray-600">{installment}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusConfig[status].color}`}>
          {statusConfig[status].label}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-sm">{dueDate}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        {daysLate > 0 ? (
          <span className="font-medium text-orange-600">{daysLate} days</span>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${riskConfig[risk]}`}>
          {risk.charAt(0).toUpperCase() + risk.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <Mail size={16} className="text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <Phone size={16} className="text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <Receipt size={16} className="text-gray-600" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default Repayments;
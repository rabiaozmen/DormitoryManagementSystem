import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { advanceRequestStatus, getAdminDashboard, getAllStudents, getPendingPayments, getRooms, getStaffRequests, markPaymentPaid } from "../../api/auth";
import { Button } from "../../components/ui/Button";
import { Activity, ArrowUpRight, BadgeAlert, CheckCircle2, CircleDollarSign, CreditCard, TrendingUp, Users, Wrench } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const formatTimeAgo = (isoDate) => {
  if (!isoDate) return "Time unknown";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Time unknown";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const value = Math.floor(seconds / interval.seconds);
    if (value >= 1) {
      return `${value} ${interval.label}${value > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
};

const formatTlCurrency = (value) => {
  const amount = Number(value) || 0;
  return `₺${amount.toLocaleString("en-US")}`;
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedChartRange, setSelectedChartRange] = useState("12");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const [dashResult, paymentsResult, studentsResult, requestsResult, roomsResult] = await Promise.allSettled([
        getAdminDashboard(),
        getPendingPayments(),
        getAllStudents(),
        getStaffRequests(),
        getRooms(),
      ]);

      if (dashResult.status === "fulfilled") {
        setDashboard(dashResult.value);
      } else {
        setDashboard(null);
        const dashboardMessage =
          dashResult.reason?.response?.data?.message ||
          dashResult.reason?.response?.data?.Message ||
          "Dashboard data could not be loaded.";
        setLoadError(dashboardMessage);
      }

      if (paymentsResult.status === "fulfilled") {
        setPendingPayments(paymentsResult.value);
      }

      if (studentsResult.status === "fulfilled") {
        setStudents(studentsResult.value);
      }

      if (requestsResult.status === "fulfilled") {
        setMaintenanceRequests(requestsResult.value);
      }

      if (roomsResult.status === "fulfilled") {
        setRooms(roomsResult.value);
      }
    } catch (e) {
      console.error("Dashboard load error", e);
      setLoadError("Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkPaid = async (id) => {
    try {
      await markPaymentPaid(id);
      setPendingPayments((prev) => prev.filter((payment) => payment.id !== id));
      const dashData = await getAdminDashboard();
      setDashboard(dashData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdvanceRequest = async (request) => {
    const nextStatus = request.status === 0 ? 1 : request.status === 1 ? 2 : request.status === 2 ? 3 : 3;

    try {
      await advanceRequestStatus(request.id, nextStatus);
      setMaintenanceRequests((prev) => prev.filter((item) => item.id !== request.id));
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const occupancyMetrics = useMemo(() => {
    if (rooms.length > 0) {
      const totals = rooms.reduce(
        (acc, room) => {
          acc.capacity += room.capacity || 0;
          acc.occupied += room.occupancy || 0;
          return acc;
        },
        { occupied: 0, capacity: 0 },
      );

      const available = Math.max(0, totals.capacity - totals.occupied);
      const rate = totals.capacity === 0 ? 0 : Number(((totals.occupied / totals.capacity) * 100).toFixed(2));

      return {
        occupied: totals.occupied,
        available,
        capacity: totals.capacity,
        rate,
      };
    }

    if (!dashboard) {
      return { occupied: 0, available: 0, capacity: 0, rate: 0 };
    }

    const estimatedCapacity =
      dashboard.occupancyRate > 0
        ? Math.round((dashboard.totalStudents * 100) / Number(dashboard.occupancyRate))
        : dashboard.totalStudents;

    const available = Math.max(0, estimatedCapacity - dashboard.totalStudents);

    return {
      occupied: dashboard.totalStudents,
      available,
      capacity: estimatedCapacity,
      rate: Number(dashboard.occupancyRate || 0),
    };
  }, [dashboard, rooms]);

  const occupancyData = useMemo(
    () => [
      { name: "Occupied", value: occupancyMetrics.occupied, color: "#0ea5e9" },
      { name: "Vacant", value: occupancyMetrics.available, color: "#22c55e" },
    ],
    [occupancyMetrics],
  );

  const monthlyStats = useMemo(() => {
    const stats = dashboard?.monthlyStats || [];

    if (selectedChartRange === "all") {
      return stats;
    }

    const limit = Number(selectedChartRange);
    if (!Number.isFinite(limit) || limit <= 0) {
      return stats;
    }

    return stats.slice(Math.max(0, stats.length - limit));
  }, [dashboard, selectedChartRange]);

  const chartRangeOptions = [
    { key: "6", label: "6 Months" },
    { key: "12", label: "12 Months" },
    { key: "all", label: "All Time" },
  ];

  const financialDateRangeLabel = useMemo(() => {
    if (monthlyStats.length === 0) {
      return "No data range";
    }

    if (monthlyStats.length === 1) {
      return String(monthlyStats[0].month || "Single month");
    }

    const first = String(monthlyStats[0].month || "").trim();
    const last = String(monthlyStats[monthlyStats.length - 1].month || "").trim();

    if (!first && !last) {
      return "No data range";
    }

    if (!first || !last || first === last) {
      return first || last;
    }

    return `${first} - ${last}`;
  }, [monthlyStats]);

  const urgentRequests = useMemo(
    () =>
      maintenanceRequests
        .filter((request) => {
          const priority = String(request.priority || "").toLowerCase();
          const status = String(request.status || "").toLowerCase();
          return priority.includes("critical") || priority.includes("high") || priority.includes("urgent") || priority === "3" || status.includes("open");
        })
        .slice(0, 5),
    [maintenanceRequests],
  );

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Students",
        value: dashboard?.totalStudents ?? 0,
        icon: Users,
        accent: "from-sky-500/30 to-cyan-400/10",
        action: () => navigate("/admin/students"),
        actionLabel: "Open students",
      },
      {
        label: "Occupancy Rate",
        value: `${occupancyMetrics.rate}%`,
        icon: TrendingUp,
        accent: "from-emerald-500/30 to-emerald-400/10",
        action: () => navigate("/admin/rooms"),
        actionLabel: "Open rooms",
      },
      {
        label: "Pending Payments",
        value: pendingPayments.length,
        icon: CreditCard,
        accent: "from-amber-500/30 to-amber-400/10",
        action: () => navigate("/admin/payments"),
        actionLabel: "Open payments",
      },
      {
        label: "Urgent Maintenance",
        value: urgentRequests.length,
        icon: BadgeAlert,
        accent: "from-rose-500/30 to-rose-400/10",
        action: () => {
          document.getElementById("quick-actions")?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        actionLabel: "Jump to quick actions",
      },
    ],
    [dashboard, occupancyMetrics.rate, pendingPayments.length, urgentRequests.length],
  );

  const recentActivities = useMemo(() => {
    const studentActivities = students.slice(0, 5).map((student) => ({
      id: `student-${student.id}`,
      type: "student",
      title: `New student: ${student.fullName}`,
      subtitle: `No ${student.studentNumber} | Room ${student.roomNumber || "N/A"}`,
      createdAtUtc: student.createdAtUtc,
    }));

    const maintenanceActivities = maintenanceRequests.slice(0, 5).map((request) => ({
      id: `maintenance-${request.id}`,
      type: "maintenance",
      title: `Maintenance request: ${request.ticketCode || `#${request.id}`}`,
      subtitle: `Priority ${request.priority} | Status ${request.status}`,
      createdAtUtc: request.createdAtUtc,
    }));

    return [...studentActivities, ...maintenanceActivities]
      .sort((a, b) => new Date(b.createdAtUtc || 0).getTime() - new Date(a.createdAtUtc || 0).getTime())
      .slice(0, 10);
  }, [students, maintenanceRequests]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
  if (!dashboard) {
    return (
      <div className="p-8 text-center text-red-500">
        {loadError || "Dashboard could not be loaded. Please refresh or login again."}
      </div>
    );
  }

  const expenseColors = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#64748b"];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 space-y-6">

      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-indigo-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Control Center</h1>
        <p className="mt-2 text-slate-600">Manage finance, occupancy, and urgent tasks from one screen.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
          Live operational overview
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.label}
              type="button"
              onClick={card.action}
              className={`text-left rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm bg-gradient-to-br transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 ${card.accent}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{card.label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 text-slate-700 shadow-sm">
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <ArrowUpRight size={14} />
                {card.actionLabel}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Financial Analysis</h2>
              <p className="mt-1 text-sm text-slate-500">Monthly income and expense trends ({financialDateRangeLabel}).</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-500 shadow-sm">
              {chartRangeOptions.map((option) => {
                const isActive = selectedChartRange === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedChartRange(option.key)}
                    className={`rounded-full px-3 py-1.5 transition ${isActive ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-white hover:text-slate-700"}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(value) => formatTlCurrency(value)}
                  width={90}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const metricName = name === "revenue" ? "Revenue" : name === "expenses" ? "Expenses" : String(name);
                    return [formatTlCurrency(value), metricName];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 20px -5px rgb(15 23 42 / 0.12)" }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Income"
                  stroke="#16DB93"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#16DB93" }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#FF5A5F"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#FF5A5F" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <aside id="quick-actions" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
              <p className="mt-1 text-sm text-slate-500">Handle payment approvals and urgent maintenance requests.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CircleDollarSign className="text-emerald-600" size={18} /> Payment Approval
              </div>
              {pendingPayments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No payments are waiting for approval.
                </div>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-auto pr-1">
                  {pendingPayments.slice(0, 4).map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-bold text-slate-900">{payment.studentFullName || "Unknown Student"}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>Invoice #{payment.id}</span>
                          </div>
                        </div>
                        <span className="shrink-0 text-base font-bold text-slate-900">TL {payment.amount}</span>
                      </div>
                      <Button onClick={() => handleMarkPaid(payment.id)} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700">
                        Approve Payment
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Wrench className="text-rose-600" size={18} /> Urgent Maintenance Requests
              </div>
              {urgentRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No urgent maintenance requests.
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-auto pr-1">
                  {urgentRequests.map((request) => (
                    <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{request.ticketCode || `#${request.id}`}</p>
                          <p className="mt-1 text-xs text-slate-500">Priority: {request.priority} | Status: {request.status}</p>
                        </div>
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          Urgent
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button onClick={() => handleAdvanceRequest(request)} className="flex-1 bg-rose-600 hover:bg-rose-700">
                          Advance Status
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Room Occupancy Breakdown</h2>
              <p className="mt-1 text-sm text-slate-500">Current capacity and occupied/vacant split.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancyData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95} paddingAngle={4}>
                    {occupancyData.map((entry) => (
                      <Cell key={`occupancy-cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <p className="text-sm text-slate-500">Current occupancy</p>
                <p className="text-4xl font-black text-slate-900">{occupancyMetrics.rate}%</p>
              </div>

              <div className="space-y-2">
                {occupancyData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.name}
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Activity className="text-indigo-600" size={18} /> Recent Activity
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-slate-500">No recent activity found.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivities.map((activity) => {
                const isStudent = activity.type === "student";

                return (
                  <li key={activity.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 shadow-sm flex items-start justify-between gap-4 hover:bg-slate-100/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-2 ${isStudent ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>
                        {isStudent ? <Users size={14} /> : <Wrench size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{activity.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{formatTimeAgo(activity.createdAtUtc)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pending Payments</h2>
            <p className="mt-1 text-sm text-slate-500">Clear waiting payment records quickly.</p>
          </div>
          <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
            {pendingPayments.length} records
          </span>
        </div>

        {pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
            <CheckCircle2 size={48} className="mb-3 text-emerald-400" />
            All payments are complete.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pendingPayments.map((payment) => (
              <li key={payment.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900">{payment.studentFullName || "Unknown Student"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span>Invoice #{payment.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-slate-700">TL {payment.amount}</span>
                  <Button onClick={() => handleMarkPaid(payment.id)} className="bg-emerald-600 hover:bg-emerald-700">
                    Approve Payment
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

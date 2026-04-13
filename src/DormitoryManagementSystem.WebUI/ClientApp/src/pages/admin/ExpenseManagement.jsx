import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Save, Search, Users, Wallet } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  createExpense,
  getAdminStaff,
  getExpenses,
  updateStaffMonthlySalary,
} from "../../api/auth";
import { EmptyState } from "../../components/ui/EmptyState";
import { emitErrorToast } from "../../utils/toastEvents";

const TAB_SALARIES = "salaries";
const TAB_INVOICES = "invoices";
const TAB_EXPENSES = "expenses";

const OTHER_EXPENSE_LABELS = {
  1: "Kitchen",
  2: "Faturalar",
  3: "Maintenance",
  4: "Other",
};

const toMonthKey = (dateValue) => {
  const date = new Date(dateValue);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
};

const getMonthStartDate = (monthKey) => `${monthKey}-01`;

export default function ExpenseManagement() {
  const [activeTab, setActiveTab] = useState(TAB_SALARIES);

  const [expenses, setExpenses] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salaryDrafts, setSalaryDrafts] = useState({});
  const [savingSalaryStaffId, setSavingSalaryStaffId] = useState(null);
  const [payingSalaryStaffId, setPayingSalaryStaffId] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState({
    title: "",
    amount: "",
    invoiceMonth: new Date().toISOString().slice(0, 7),
  });
  const [creatingInvoiceExpense, setCreatingInvoiceExpense] = useState(false);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
  const [invoiceMonthFilter, setInvoiceMonthFilter] = useState("All");

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: 4,
    date: new Date().toISOString().split("T")[0],
  });
  const [creatingOtherExpense, setCreatingOtherExpense] = useState(false);
  const [expenseSearchTerm, setExpenseSearchTerm] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("All");

  const loadData = async () => {
    try {
      setLoading(true);
      const [expenseData, staffData] = await Promise.all([getExpenses(), getAdminStaff()]);
      setExpenses(expenseData);
      setStaffMembers(staffData);

      const drafts = {};
      staffData.forEach((staff) => {
        drafts[staff.id] = String(staff.monthlySalary || "");
      });
      setSalaryDrafts(drafts);
    } catch (e) {
      console.error(e);
      emitErrorToast("Expense data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const salaryExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.category === 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses],
  );

  const salaryExpenseIndex = useMemo(() => {
    const index = new Set();
    salaryExpenses.forEach((expense) => {
      if (expense.staffId) {
        index.add(`${expense.staffId}-${toMonthKey(expense.date)}`);
      }
    });
    return index;
  }, [salaryExpenses]);

  const otherExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.category !== 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses],
  );

  const invoiceExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.category === 2)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses],
  );

  const nonInvoiceExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.category !== 0 && expense.category !== 2)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses],
  );

  const filteredInvoiceExpenses = useMemo(() => {
    return invoiceExpenses.filter((expense) => {
      const monthKey = toMonthKey(expense.date);
      const matchesSearch =
        expense.description.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
        String(expense.amount).includes(invoiceSearchTerm);
      const matchesMonth = invoiceMonthFilter === "All" || invoiceMonthFilter === monthKey;
      return matchesSearch && matchesMonth;
    });
  }, [invoiceExpenses, invoiceSearchTerm, invoiceMonthFilter]);

  const filteredOtherExpenses = useMemo(() => {
    return nonInvoiceExpenses.filter((expense) => {
      const categoryLabel = OTHER_EXPENSE_LABELS[expense.category] || "Other";
      const matchesSearch =
        expense.description.toLowerCase().includes(expenseSearchTerm.toLowerCase()) ||
        categoryLabel.toLowerCase().includes(expenseSearchTerm.toLowerCase()) ||
        String(expense.amount).includes(expenseSearchTerm);

      const matchesCategory =
        expenseCategoryFilter === "All" || Number(expenseCategoryFilter) === Number(expense.category);

      return matchesSearch && matchesCategory;
    });
  }, [nonInvoiceExpenses, expenseSearchTerm, expenseCategoryFilter]);

  const handleSaveSalary = async (staffId) => {
    const amount = Number.parseFloat(salaryDrafts[staffId]);
    if (!Number.isFinite(amount) || amount < 0) {
      emitErrorToast("Please enter a valid salary amount.");
      return;
    }

    try {
      setSavingSalaryStaffId(staffId);
      await updateStaffMonthlySalary(staffId, amount);
      await loadData();
    } catch (error) {
      console.error(error);
      emitErrorToast("Salary could not be updated.");
    } finally {
      setSavingSalaryStaffId(null);
    }
  };

  const handlePaySalary = async (staff) => {
    const monthlySalary = Number.parseFloat(salaryDrafts[staff.id] || staff.monthlySalary || 0);

    if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) {
      emitErrorToast("Please save a valid monthly salary first.");
      return;
    }

    const salaryKey = `${staff.id}-${salaryMonth}`;
    if (salaryExpenseIndex.has(salaryKey)) {
      emitErrorToast("This staff salary is already paid for the selected month.");
      return;
    }

    const monthLabel = new Date(`${salaryMonth}-01T00:00:00`).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });

    try {
      setPayingSalaryStaffId(staff.id);
      await createExpense({
        description: `Salary - ${staff.fullName} (${monthLabel})`,
        amount: monthlySalary,
        category: 0,
        date: getMonthStartDate(salaryMonth),
        staffId: staff.id,
      });
      await loadData();
    } catch (error) {
      console.error(error);
      emitErrorToast("Salary payment could not be recorded.");
    } finally {
      setPayingSalaryStaffId(null);
    }
  };

  const handleCreateOtherExpense = async (e) => {
    e.preventDefault();

    const amount = Number.parseFloat(expenseForm.amount);
    const category = Number.parseInt(expenseForm.category, 10);

    if (!expenseForm.description.trim() || !Number.isFinite(amount) || amount <= 0 || !expenseForm.date) {
      emitErrorToast("Please fill all expense fields correctly.");
      return;
    }

    if (![1, 2, 3, 4].includes(category)) {
      emitErrorToast("Please select a valid expense category.");
      return;
    }

    try {
      setCreatingOtherExpense(true);
      await createExpense({
        description: expenseForm.description.trim(),
        amount,
        category,
        date: expenseForm.date,
      });

      setExpenseForm({
        description: "",
        amount: "",
        category: 4,
        date: new Date().toISOString().split("T")[0],
      });
      await loadData();
    } catch (error) {
      console.error(error);
      emitErrorToast("Expense record could not be created.");
    } finally {
      setCreatingOtherExpense(false);
    }
  };

  const handleCreateInvoiceExpense = async (e) => {
    e.preventDefault();

    const amount = Number.parseFloat(invoiceForm.amount);
    if (!invoiceForm.title.trim() || !Number.isFinite(amount) || amount <= 0 || !invoiceForm.invoiceMonth) {
      emitErrorToast("Please fill all invoice fields correctly.");
      return;
    }

    try {
      setCreatingInvoiceExpense(true);
      await createExpense({
        description: invoiceForm.title.trim(),
        amount,
        category: 2,
        date: getMonthStartDate(invoiceForm.invoiceMonth),
      });

      setInvoiceForm({
        title: "",
        amount: "",
        invoiceMonth: new Date().toISOString().slice(0, 7),
      });
      await loadData();
    } catch (error) {
      console.error(error);
      emitErrorToast("Invoice expense could not be created.");
    } finally {
      setCreatingInvoiceExpense(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 space-y-6 animate-in fade-in duration-500">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expense Center</h1>
            <p className="text-slate-600 mt-2">Manage personnel salaries and all non-student expense records from one screen.</p>
          </div>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start">
            <button
              onClick={() => setActiveTab(TAB_SALARIES)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === TAB_SALARIES ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Personel Maaslari
            </button>
            <button
              onClick={() => setActiveTab(TAB_INVOICES)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === TAB_INVOICES ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Faturalar
            </button>
            <button
              onClick={() => setActiveTab(TAB_EXPENSES)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === TAB_EXPENSES ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Diger Giderler
            </button>
          </div>
        </div>
      </div>

      {activeTab === TAB_SALARIES && (
        <>
          <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="text-indigo-600" size={20} /> Personel Maaslari
                </h2>
                <p className="text-sm text-slate-600 mt-1">Set monthly salary and record salary payments by month.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Month</label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Staff</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Position</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Monthly Salary</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffMembers.map((staff) => {
                    const isPaidForMonth = salaryExpenseIndex.has(`${staff.id}-${salaryMonth}`);
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{staff.fullName}</div>
                          <div className="text-xs text-slate-500">{staff.staffNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{staff.position}</td>
                        <td className="px-6 py-4">
                          <div className="relative max-w-[220px]">
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={salaryDrafts[staff.id] ?? ""}
                              onChange={(e) => setSalaryDrafts((prev) => ({ ...prev, [staff.id]: e.target.value }))}
                              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              loading={savingSalaryStaffId === staff.id}
                              onClick={() => handleSaveSalary(staff.id)}
                              className="bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Save size={14} className="mr-1" /> Maas Kaydet
                            </Button>
                            <Button
                              size="sm"
                              loading={payingSalaryStaffId === staff.id}
                              disabled={isPaidForMonth}
                              onClick={() => handlePaySalary(staff)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {isPaidForMonth ? "Odendi" : "Maas Ode"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CircleDollarSign className="text-emerald-600" size={18} /> Aylik Maas Gecmisi
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Staff</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Month</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salaryExpenses.map((expense) => {
                    const staff = staffMembers.find((item) => item.id === expense.staffId);
                    const monthLabel = new Date(expense.date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
                    return (
                      <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{staff?.fullName || "Unknown Staff"}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{monthLabel}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-700">TL {Number(expense.amount).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{expense.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {salaryExpenses.length === 0 && !loading && (
                <div className="p-6">
                  <EmptyState title="No salary payment history" description="Paid salaries will be listed here." />
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {activeTab === TAB_INVOICES && (
        <>
          <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CircleDollarSign className="text-indigo-600" size={20} /> Faturalar
              </h2>
              <p className="text-sm text-slate-600 mt-1">Electricity, water, internet and other invoice-based operational costs.</p>
            </div>
            <form onSubmit={handleCreateInvoiceExpense} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Invoice Title</label>
                <input
                  required
                  value={invoiceForm.title}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                  placeholder="Electricity bill - April"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Month</label>
                <input
                  required
                  type="month"
                  value={invoiceForm.invoiceMonth}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoiceMonth: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button type="submit" loading={creatingInvoiceExpense} className="bg-indigo-600 hover:bg-indigo-700">
                  <Save size={14} className="mr-1" /> Faturayi Kaydet
                </Button>
              </div>
            </form>
          </Card>

          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search invoice title or amount..."
                value={invoiceSearchTerm}
                onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white shadow-sm text-slate-900"
              />
            </div>
            <div className="w-full md:w-48">
              <input
                type="month"
                value={invoiceMonthFilter === "All" ? "" : invoiceMonthFilter}
                onChange={(e) => setInvoiceMonthFilter(e.target.value || "All")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Invoice</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Month</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoiceExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{expense.description}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(expense.date).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">TL {Number(expense.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(expense.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredInvoiceExpenses.length === 0 && !loading && (
                <div className="p-6">
                  <EmptyState title="No invoice records" description="Create invoice expenses to track them here." />
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {activeTab === TAB_EXPENSES && (
        <>
          <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="text-indigo-600" size={20} /> Diger Gider Ekle
              </h2>
              <p className="text-sm text-slate-600 mt-1">Kitchen, utilities, maintenance ve diger operasyonel giderleri buradan ekleyin.</p>
            </div>
            <form onSubmit={handleCreateOtherExpense} className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <input
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                  placeholder="Electricity bill - April"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: Number(e.target.value) }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  {Object.entries(OTHER_EXPENSE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                <input
                  required
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="md:col-span-5 flex justify-end">
                <Button type="submit" loading={creatingOtherExpense} className="bg-indigo-600 hover:bg-indigo-700">
                  <Save size={14} className="mr-1" /> Gideri Kaydet
                </Button>
              </div>
            </form>
          </Card>

          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by description, category, or amount..."
                value={expenseSearchTerm}
                onChange={(e) => setExpenseSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white shadow-sm text-slate-900"
              />
            </div>

            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start w-max">
              <button
                onClick={() => setExpenseCategoryFilter("All")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  expenseCategoryFilter === "All" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>
              {Object.entries(OTHER_EXPENSE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setExpenseCategoryFilter(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    expenseCategoryFilter === key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOtherExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{expense.description}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{OTHER_EXPENSE_LABELS[expense.category] || "Other"}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">TL {Number(expense.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(expense.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOtherExpenses.length === 0 && !loading && (
                <div className="p-6">
                  <EmptyState title="No other expense records" description="Create an expense record to start tracking." />
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

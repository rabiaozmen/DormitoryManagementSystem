import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Plus,
  Save,
  Search,
  User,
  X,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  createPayment,
  getAllPayments,
  getAllStudents,
  getRooms,
  markPaymentPaid,
} from "../../api/auth";
import { emitErrorToast, emitSuccessToast } from "../../utils/toastEvents";
import { EmptyState } from "../../components/ui/EmptyState";

const toMonthKey = (dateValue) => {
  const date = new Date(dateValue);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
};

const getMonthStartIso = (monthKey) => `${monthKey}-01T00:00:00Z`;

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [creatingMonthlyInvoices, setCreatingMonthlyInvoices] = useState(false);
  const [markingPaymentId, setMarkingPaymentId] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState({
    studentId: "",
    amount: "",
    dueDate: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentData, studentData, roomData] = await Promise.all([
        getAllPayments(),
        getAllStudents(),
        getRooms(),
      ]);

      setPayments(paymentData);
      setStudents(studentData);
      setRooms(roomData);
    } catch (error) {
      console.error(error);
      emitErrorToast("Data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const studentMap = useMemo(
    () =>
      new Map(
        students.map((student) => [
          student.id,
          {
            fullName: student.fullName,
            roomNumber: student.roomNumber,
            isActive: student.isActive,
          },
        ]),
      ),
    [students],
  );

  const roomRateByNumber = useMemo(
    () =>
      new Map(
        rooms
          .filter((room) => room.roomNumber)
          .map((room) => [String(room.roomNumber).trim(), Number(room.monthlyRate || 0)]),
      ),
    [rooms],
  );

  const monthlyInvoiceIndex = useMemo(() => {
    const index = new Set();
    payments.forEach((payment) => {
      index.add(`${payment.studentId}-${toMonthKey(payment.dueDateUtc)}`);
    });
    return index;
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const studentInfo = studentMap.get(payment.studentId);
      const studentName = studentInfo?.fullName || "Unknown";
      const roomNumber = studentInfo?.roomNumber || "N/A";

      const matchesSearch =
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(payment.amount).includes(searchTerm);

      const matchesFilter =
        filterStatus === "All" ||
        (filterStatus === "Paid" && payment.status === 1) ||
        (filterStatus === "Pending" && payment.status === 0);

      return matchesSearch && matchesFilter;
    });
  }, [payments, searchTerm, filterStatus, studentMap]);

  const selectedInvoice = useMemo(() => {
    if (filteredPayments.length === 0) {
      return null;
    }

    const existing = filteredPayments.find((payment) => payment.id === selectedInvoiceId);
    return existing || filteredPayments[0];
  }, [filteredPayments, selectedInvoiceId]);

  const invoiceHistoryRows = useMemo(() => {
    const buckets = new Map();

    payments.forEach((payment) => {
      const monthKey = toMonthKey(payment.dueDateUtc);
      const current = buckets.get(monthKey) || { monthKey, invoiceCount: 0, paidCount: 0, pendingCount: 0, totalAmount: 0 };

      current.invoiceCount += 1;
      current.totalAmount += Number(payment.amount || 0);
      if (payment.status === 1) {
        current.paidCount += 1;
      } else {
        current.pendingCount += 1;
      }

      buckets.set(monthKey, current);
    });

    return Array.from(buckets.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [payments]);

  const handleMarkPaid = async (id) => {
    try {
      setMarkingPaymentId(id);
      await markPaymentPaid(id);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setMarkingPaymentId(null);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();

    const amountNumber = Number.parseFloat(invoiceForm.amount);
    if (!invoiceForm.studentId || !Number.isFinite(amountNumber) || amountNumber <= 0 || !invoiceForm.dueDate) {
      emitErrorToast("Please fill all invoice fields correctly.");
      return;
    }

    const monthKey = toMonthKey(`${invoiceForm.dueDate}T00:00:00Z`);
    if (monthlyInvoiceIndex.has(`${invoiceForm.studentId}-${monthKey}`)) {
      emitErrorToast("Bu ay faturasi zaten olusturuldu");
      return;
    }

    try {
      setCreatingInvoice(true);
      await createPayment({
        studentId: invoiceForm.studentId,
        amount: amountNumber,
        dueDate: `${invoiceForm.dueDate}T00:00:00Z`,
      });

      setShowInvoiceModal(false);
      setInvoiceForm({ studentId: "", amount: "", dueDate: "" });
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleCreateMonthlyInvoices = async () => {
    try {
      setCreatingMonthlyInvoices(true);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const activeStudents = students.filter((student) => student.isActive);

      if (activeStudents.length === 0) {
        emitErrorToast("No active students found.");
        return;
      }

      const invoicePayloads = activeStudents
        .map((student) => {
          const roomNumber = String(student.roomNumber || "").trim();
          const amount = Number(roomRateByNumber.get(roomNumber));
          const alreadyExists = monthlyInvoiceIndex.has(`${student.id}-${currentMonth}`);

          if (alreadyExists || !Number.isFinite(amount) || amount <= 0 || roomNumber === "N/A") {
            return null;
          }

          return {
            studentId: student.id,
            amount,
            dueDate: getMonthStartIso(currentMonth),
          };
        })
        .filter(Boolean);

      if (invoicePayloads.length === 0) {
        emitErrorToast("Bu ay faturasi zaten olusturuldu");
        return;
      }

      const results = await Promise.allSettled(
        invoicePayloads.map((payload) =>
          createPayment(payload, {
            silentSuccessToast: true,
            silentErrorToast: true,
          }),
        ),
      );

      const succeeded = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        emitSuccessToast(`Monthly invoices created for ${succeeded} students.`);
      }

      if (failed > 0) {
        emitErrorToast(`${failed} invoices could not be created.`);
      }

      await loadData();
    } catch (error) {
      console.error(error);
      emitErrorToast("Monthly invoice generation failed.");
    } finally {
      setCreatingMonthlyInvoices(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 space-y-6 animate-in fade-in duration-500">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Payments</h1>
            <p className="text-slate-600 mt-2">Manage only student invoices and payment statuses from this screen.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by student, room, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white shadow-sm text-slate-900"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCreateMonthlyInvoices}
            loading={creatingMonthlyInvoices}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus size={18} /> Aylik Fatura Olustur
          </Button>
          <Button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus size={18} /> Yeni Fatura
          </Button>
        </div>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start w-max">
        {["All", "Pending", "Paid"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatus === status ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredPayments.map((payment) => {
                  const student = studentMap.get(payment.studentId);
                  return (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={payment.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedInvoiceId(payment.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">{student?.fullName || "Unknown Student"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{student?.roomNumber || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-slate-900">TL {Number(payment.amount).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar size={16} />
                          {new Date(payment.dueDateUtc).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {payment.status === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            <CheckCircle2 size={14} /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                            <AlertCircle size={14} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {payment.status === 0 && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkPaid(payment.id);
                            }}
                            size="sm"
                            loading={markingPaymentId === payment.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Mark Paid
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredPayments.length === 0 && !loading && (
            <div className="p-6">
              <EmptyState title="No student invoices" description="No records match your current filters." />
            </div>
          )}
        </div>
      </Card>

      <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Fatura Detayi</h3>
          <p className="text-sm text-slate-600 mt-1">Listeden bir fatura secerek detaylarini gorebilirsin.</p>
        </div>
        <div className="p-6">
          {selectedInvoice ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase">Ogrenci</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {studentMap.get(selectedInvoice.studentId)?.fullName || "Unknown Student"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Oda: {studentMap.get(selectedInvoice.studentId)?.roomNumber || "N/A"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase">Tutar ve Vade</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">TL {Number(selectedInvoice.amount).toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(selectedInvoice.dueDateUtc).toLocaleDateString()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 md:col-span-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Durum</p>
                <p className="mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {selectedInvoice.status === 1 ? "Paid" : "Pending"}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState title="No invoice selected" description="Create or select an invoice to view details." />
          )}
        </div>
      </Card>

      <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CircleDollarSign className="text-indigo-600" size={18} /> Aylik Fatura Gecmisi
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Month</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Invoice Count</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Paid</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pending</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoiceHistoryRows.map((row) => (
                <tr key={row.monthKey} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {new Date(`${row.monthKey}-01T00:00:00`).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.invoiceCount}</td>
                  <td className="px-6 py-4 text-sm text-emerald-700 font-semibold">{row.paidCount}</td>
                  <td className="px-6 py-4 text-sm text-amber-700 font-semibold">{row.pendingCount}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">TL {row.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoiceHistoryRows.length === 0 && !loading && (
            <div className="p-6">
              <EmptyState title="No invoice history" description="Monthly invoice summaries will appear here." />
            </div>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {showInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInvoiceModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="text-indigo-600" /> New Invoice
                </h3>
                <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Student</label>
                  <select
                    required
                    value={invoiceForm.studentId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName} ({student.studentNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Amount (TRY)</label>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={invoiceForm.amount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="3500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                    <input
                      required
                      type="date"
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => setShowInvoiceModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={creatingInvoice} className="bg-indigo-600 hover:bg-indigo-700">
                    <Save size={18} className="mr-2" /> Create Invoice
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

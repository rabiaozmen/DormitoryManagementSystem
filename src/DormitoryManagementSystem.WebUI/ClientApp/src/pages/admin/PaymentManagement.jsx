import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, CircleDollarSign, Calendar, User, CheckCircle2, AlertCircle, X, Save } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getAllPayments, markPaymentPaid, createPayment, getAllStudents } from "../../api/auth";
import { emitErrorToast } from "../../utils/toastEvents";
import { EmptyState } from "../../components/ui/EmptyState";

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // All, Pending, Paid
  const [students, setStudents] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [markingPaymentId, setMarkingPaymentId] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: "",
    amount: "",
    dueDate: ""
  });

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [paymentData, studentData] = await Promise.all([getAllPayments(), getAllStudents()]);
      setPayments(paymentData);
      setStudents(studentData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleMarkPaid = async (id) => {
    try {
      setMarkingPaymentId(id);
      await markPaymentPaid(id);
      loadPayments();
    } catch (err) {
      console.error(err);
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

    try {
      setCreatingInvoice(true);
      await createPayment({
        studentId: invoiceForm.studentId,
        amount: amountNumber,
        dueDate: `${invoiceForm.dueDate}T00:00:00Z`
      });

      setShowInvoiceModal(false);
      setInvoiceForm({ studentId: "", amount: "", dueDate: "" });
      await loadPayments();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.studentId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.amount.toString().includes(searchTerm);
    const matchesFilter = filterStatus === "All" || 
                          (filterStatus === "Paid" && p.status === 1) || 
                          (filterStatus === "Pending" && p.status === 0);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 space-y-6 animate-in fade-in duration-500">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Records</h1>
            <p className="text-slate-600 mt-2">Track payments, issue invoices, and monitor dormitory revenue.</p>
          </div>
          <Button onClick={() => setShowInvoiceModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus size={18} /> New Invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by Student ID or Amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white shadow-sm text-slate-900"
          />
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start">
          {["All", "Pending", "Paid"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterStatus === status 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredPayments.map(p => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={p.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign size={16} className="text-slate-400" />
                        <span className="font-mono text-xs font-bold text-slate-500">#INV-{p.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{p.studentId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-slate-900">TL {p.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={16} />
                        {new Date(p.dueDateUtc).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 1 ? (
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
                      {p.status === 0 && (
                        <Button 
                          onClick={() => handleMarkPaid(p.id)}
                          size="sm" 
                          loading={markingPaymentId === p.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredPayments.length === 0 && !loading && (
            <div className="p-6">
              <EmptyState title="No payment records" description="No records match your current search and filters." />
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
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentNumber})
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

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Plus, Filter, CircleDollarSign, Calendar, Tag, Search, PieChart, TrendingDown } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getExpenses, createExpense } from "../../api/auth";
import { EmptyState } from "../../components/ui/EmptyState";
import { emitErrorToast } from "../../utils/toastEvents";

const CATEGORIES = {
  0: { label: "Salaries", color: "bg-purple-100 text-purple-700", icon: Filter },
  1: { label: "Kitchen", color: "bg-orange-100 text-orange-700", icon: Filter },
  2: { label: "Utilities", color: "bg-blue-100 text-blue-700", icon: Filter },
  3: { label: "Maintenance", color: "bg-amber-100 text-amber-700", icon: Filter },
  4: { label: "Other", color: "bg-slate-100 text-slate-700", icon: Filter }
};

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [creatingExpense, setCreatingExpense] = useState(false);
  const [formData, setFormData] = useState({ description: "", amount: "", category: 4, date: new Date().toISOString().split('T')[0] });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getExpenses();
      setExpenses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreatingExpense(true);
      await createExpense({ ...formData, amount: parseFloat(formData.amount), category: parseInt(formData.category) });
      setShowAdd(false);
      setFormData({ description: "", amount: "", category: 4, date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err) {
      emitErrorToast("Expense could not be saved.");
    } finally {
      setCreatingExpense(false);
    }
  };

  const totalMonthly = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expense Tracking</h1>
          <p className="text-slate-500 mt-1">Manage dormitory costs, salaries, and operational expenditures.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-6 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <TrendingDown className="text-red-500" size={20} />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Outflow</p>
                <p className="text-lg font-bold text-slate-900">₺{totalMonthly.toLocaleString()}</p>
              </div>
           </div>
           <Button onClick={() => setShowAdd(true)} className="bg-red-600 hover:bg-red-700 text-white">
             <Plus size={18} className="mr-2" /> Record Expense
           </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
             <Card className="p-8 border-red-100 bg-red-50/20">
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                   <div className="space-y-2 col-span-1 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                      <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="e.g. Electricity Bill Jan" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Amount (₺)</label>
                      <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="0.00" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white">
                        {Object.entries(CATEGORIES).map(([val, cat]) => <option key={val} value={val}>{cat.label}</option>)}
                      </select>
                   </div>
                   <div className="flex gap-2">
                      <Button type="submit" loading={creatingExpense} className="flex-1 bg-red-600 h-12">Save Record</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="h-12"><X size={18} /></Button>
                   </div>
                </form>
             </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-slate-200 overflow-hidden shadow-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{exp.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${CATEGORIES[exp.category]?.color || 'bg-slate-100'}`}>
                      {CATEGORIES[exp.category]?.label || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-red-600 font-bold">-₺{exp.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm text-slate-500">
                    {new Date(exp.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && !loading && (
            <div className="p-6">
              <EmptyState title="No expenses recorded" description="Create your first expense record to start tracking outflow." />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

const X = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

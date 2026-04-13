import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Calendar, CheckCircle2, AlertCircle, X, Lock, ShieldCheck } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getStudentPayments } from "../../api/auth";
import { EmptyState } from "../../components/ui/EmptyState";

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getStudentPayments();
      setPayments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = (p) => {
    setSelectedPayment(p);
    setShowModal(true);
    setSuccess(false);
  };

  const processPayment = (e) => {
    e.preventDefault();
    setPaying(true);
    // Simulate API call
    setTimeout(() => {
      setPaying(false);
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        loadData(); // "Reload" to show updated status simulation
      }, 2000);
    }, 2500);
  };

  if (loading) return <div className="text-slate-500 p-8">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">My Payment History</h1>
        <p className="text-slate-500">View and manage your dormitory fees and invoices.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {payments.length === 0 && (
          <EmptyState title="No payments yet" description="When invoices are issued, you will see them here." />
        )}
        {payments.map(p => (
          <Card key={p.id} className="p-6 border-slate-200 bg-white hover:shadow-lg transition-shadow">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${p.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <div className="text-sm font-mono text-slate-400">#INV-{p.id}</div>
                  <div className="text-xl font-bold text-slate-900">₺{p.amount.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="hidden sm:block">
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Due Date</div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Calendar size={16} />
                    {new Date(p.dueDateUtc).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  {p.status === 1 ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold px-4 py-2 bg-emerald-50 rounded-lg">
                      <CheckCircle2 size={18} />
                      Paid
                    </div>
                  ) : (
                    <Button onClick={() => handlePayClick(p)} className="bg-indigo-600 hover:bg-indigo-700">
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !paying && setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              {success ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
                  >
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
                  <p className="text-slate-500">Your transaction has been processed.</p>
                </div>
              ) : (
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Secure Payment</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="mb-6 bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                    <span className="text-slate-500">Amount to pay:</span>
                    <span className="text-xl font-bold text-indigo-600">₺{selectedPayment?.amount.toLocaleString()}</span>
                  </div>

                  {/* Visual Card Card */}
                  <div className="mb-8 p-6 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl shadow-xl text-white relative overflow-hidden h-44 flex flex-col justify-between">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-brandGold/20 rounded-full blur-2xl"></div>
                    
                    <div className="flex justify-between items-start italic font-bold opacity-50">DORMSYNC</div>
                    <div className="text-2xl tracking-[0.2em] font-mono whitespace-pre">{cardNumber.padEnd(16, "•").replace(/(.{4})/g, "$1 ")}</div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs">
                        <div className="opacity-50 uppercase mb-1">Card Holder</div>
                        <div className="font-medium tracking-widest">STUDENT USER</div>
                      </div>
                      <div className="text-xs text-right">
                        <div className="opacity-50 uppercase mb-1">Expires</div>
                        <div className="font-medium">{expiry || "MM/YY"}</div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={processPayment} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Card Number</label>
                      <input 
                        required 
                        maxLength={16}
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Expiry Date</label>
                        <input 
                          required 
                          placeholder="MM/YY" 
                          value={expiry}
                          onChange={e => setExpiry(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">CVV</label>
                        <input 
                          required 
                          placeholder="***" 
                          type="password" 
                          maxLength={3}
                          value={cvv}
                          onChange={e => setCvv(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      loading={paying}
                      className="w-full h-12 mt-4 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                      <>
                        <Lock size={18} />
                        Securely Pay ₺{selectedPayment?.amount.toLocaleString()}
                      </>
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      SSL Encrypted & PCI DSS Compliant
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

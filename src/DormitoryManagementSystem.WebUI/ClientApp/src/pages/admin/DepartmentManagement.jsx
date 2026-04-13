import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Save, X, Hash, Layers } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getDepartments, createDepartment } from "../../api/auth";
import { EmptyState } from "../../components/ui/EmptyState";
import { emitErrorToast } from "../../utils/toastEvents";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDepartments();
      setDepartments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreatingDepartment(true);
      await createDepartment({ name: newName, code: newCode });
      setNewName("");
      setNewCode("");
      setShowAdd(false);
      loadData();
    } catch (err) {
      emitErrorToast("Department could not be created.");
    } finally {
      setCreatingDepartment(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-slate-500 mt-1">Manage academic departments for student categorisation.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={18} className="mr-2" /> Add Department
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
             <Card className="p-6 border-indigo-100 bg-indigo-50/30">
                <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
                   <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Department Name</label>
                      <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Computer Engineering" />
                   </div>
                   <div className="w-full md:w-32 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
                      <input required value={newCode} onChange={e => setNewCode(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="CE" />
                   </div>
                   <div className="flex gap-2">
                      <Button type="submit" loading={creatingDepartment} className="bg-indigo-600"><Save size={18} /></Button>
                      <Button type="button" variant="outline" onClick={() => setShowAdd(false)}><X size={18} /></Button>
                   </div>
                </form>
             </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <Card key={dept.id} className="p-6 bg-white border-slate-200 hover:border-indigo-300 transition-colors shadow-sm group">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                   <BookOpen size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-900">{dept.name}</h3>
                   <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <Hash size={12} /> {dept.code}
                   </div>
                </div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
                 <Layers size={18} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {departments.length === 0 && !loading && (
        <EmptyState title="No departments yet" description="Add your first academic department to get started." />
      )}
    </div>
  );
}

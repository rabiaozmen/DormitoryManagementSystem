import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Utensils, Coffee, Moon, ChevronLeft, ChevronRight, Save, CalendarDays } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getMonthlyMenu, upsertDiningMenu } from "../../api/auth";
import { emitErrorToast } from "../../utils/toastEvents";

export default function DiningManagement() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingMenu, setEditingMenu] = useState({ breakfast: "", lunch: "", dinner: "", imageUrl: "" });
  const [savingMenu, setSavingMenu] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMonthlyMenu(`${selectedMonth}-01`);
      setMenu(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedMonth]);

  useEffect(() => {
    const current = menu.find((item) => item.date.startsWith(selectedDate));
    if (current) {
      setEditingMenu({ breakfast: current.breakfast, lunch: current.lunch, dinner: current.dinner, imageUrl: current.imageUrl || "" });
    } else {
      setEditingMenu({ breakfast: "", lunch: "", dinner: "", imageUrl: "" });
    }
  }, [menu, selectedDate]);

  const handleSave = async () => {
    try {
      setSavingMenu(true);
      await upsertDiningMenu({ ...editingMenu, date: `${selectedDate}T00:00:00Z` });
      loadData();
    } catch (err) {
      emitErrorToast("Menu could not be saved.");
    } finally {
      setSavingMenu(false);
    }
  };

  const firstDay = new Date(`${selectedMonth}-01T00:00:00Z`);
  const daysInMonth = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth() + 1, 0)).getUTCDate();
  const menuByDate = new Map(menu.map((item) => [item.date.slice(0, 10), item]));
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth(), index + 1));
    const isoDate = date.toISOString().slice(0, 10);
    return {
      isoDate,
      label: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
      item: menuByDate.get(isoDate)
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Monthly Dining Planner</h1>
          <p className="text-slate-500 mt-1">Plan meals once for the whole month and edit each day from the calendar.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
           <Button variant="outline" size="sm" onClick={() => {
              const d = new Date(`${selectedMonth}-01T00:00:00Z`); d.setMonth(d.getMonth() - 1); setSelectedMonth(d.toISOString().slice(0, 7));
           }}>
             <ChevronLeft size={20} />
           </Button>
           <div className="font-bold text-slate-700 w-48 text-center inline-flex items-center justify-center gap-2">
              <CalendarDays size={16} />
              {firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
           </div>
           <Button variant="outline" size="sm" onClick={() => {
              const d = new Date(`${selectedMonth}-01T00:00:00Z`); d.setMonth(d.getMonth() + 1); setSelectedMonth(d.toISOString().slice(0, 7));
           }}>
             <ChevronRight size={20} />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card className="p-4 border-slate-200 bg-white shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {monthDays.map(({ isoDate, label, weekday, item }) => {
                const isSelected = isoDate === selectedDate;
                return (
                  <button
                    key={isoDate}
                    type="button"
                    onClick={() => setSelectedDate(isoDate)}
                    className={`text-left rounded-xl border p-3 transition-all ${isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"}`}
                  >
                    <div className="text-xs uppercase tracking-wide text-slate-500">{weekday}</div>
                    <div className="font-bold text-slate-900">{label}</div>
                    <div className="mt-2 text-xs text-slate-500 line-clamp-2">
                      {item?.lunch || item?.breakfast || item?.dinner || "No menu yet"}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-5 bg-white border-slate-200 shadow-xl">
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">Editing</div>
            <div className="text-xl font-bold text-slate-900">{new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase">Breakfast</label>
              <textarea 
                value={editingMenu.breakfast} 
                onChange={e => setEditingMenu({...editingMenu, breakfast: e.target.value})}
                className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:ring-2 focus:ring-amber-500" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase">Lunch</label>
              <textarea 
                value={editingMenu.lunch} 
                onChange={e => setEditingMenu({...editingMenu, lunch: e.target.value})}
                className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase">Dinner</label>
              <textarea 
                value={editingMenu.dinner} 
                onChange={e => setEditingMenu({...editingMenu, dinner: e.target.value})}
                className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-900" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase">Image URL</label>
              <input
                type="text"
                value={editingMenu.imageUrl || ""}
                onChange={e => setEditingMenu({...editingMenu, imageUrl: e.target.value})}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button onClick={handleSave} loading={savingMenu} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 gap-2">
                <Save size={20} /> Save Menu
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-slate-50 border-slate-200 shadow-sm">
            <div className="text-sm font-semibold text-slate-700 mb-2">Selected day preview</div>
            <div className="space-y-2 text-sm text-slate-600">
              <div><span className="font-semibold">Breakfast:</span> {editingMenu.breakfast || "-"}</div>
              <div><span className="font-semibold">Lunch:</span> {editingMenu.lunch || "-"}</div>
              <div><span className="font-semibold">Dinner:</span> {editingMenu.dinner || "-"}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

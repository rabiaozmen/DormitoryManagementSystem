import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Utensils, Coffee, Moon, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { getMonthlyMenu } from "../../api/auth";

export default function DiningBoard() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Monthly Menu</h1>
          <p className="text-slate-500 mt-1">Browse the full meal plan for the selected month.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
           <button onClick={() => {
              const d = new Date(`${selectedMonth}-01T00:00:00Z`); d.setMonth(d.getMonth() - 1); setSelectedMonth(d.toISOString().slice(0, 7));
           }} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
           <div className="font-bold text-slate-700 px-4 inline-flex items-center gap-2">
              <CalendarDays size={16} />
              {firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
           </div>
           <button onClick={() => {
              const d = new Date(`${selectedMonth}-01T00:00:00Z`); d.setMonth(d.getMonth() + 1); setSelectedMonth(d.toISOString().slice(0, 7));
           }} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {monthDays.map(({ isoDate, label, weekday, item }) => (
          <Card key={isoDate} className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{weekday}</div>
                <div className="text-lg font-bold text-slate-900">{label}</div>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {isoDate}
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-1">
                  <Coffee size={16} /> Breakfast
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line min-h-12">{item?.breakfast || "No breakfast planned."}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
                  <Utensils size={16} /> Lunch
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line min-h-12">{item?.lunch || "No lunch planned."}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-1">
                  <Moon size={16} /> Dinner
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line min-h-12">{item?.dinner || "No dinner planned."}</p>
              </div>

              {item?.imageUrl ? (
                <img src={item.imageUrl} className="h-36 w-full rounded-xl object-cover" alt={`${label} menu`} />
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

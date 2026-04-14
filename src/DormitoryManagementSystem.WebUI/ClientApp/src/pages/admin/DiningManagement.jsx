import { useState, useEffect } from "react";
import { Utensils, Coffee, Moon, ChevronLeft, ChevronRight, Save, CalendarDays, CalendarClock, Image as ImageIcon } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getMonthlyMenu, upsertDiningMenu } from "../../api/auth";
import { emitErrorToast } from "../../utils/toastEvents";

const formatSelectedDate = (dateValue) =>
  new Date(`${dateValue}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const getMainMealSummary = (item) => item?.lunch || item?.dinner || item?.breakfast || "No menu yet";

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
    if (!selectedDate.startsWith(selectedMonth)) {
      setSelectedDate(`${selectedMonth}-01`);
    }
  }, [selectedMonth, selectedDate]);

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

  const changeMonth = (offset) => {
    const d = new Date(`${selectedMonth}-01T00:00:00Z`);
    d.setMonth(d.getMonth() + offset);
    setSelectedMonth(d.toISOString().slice(0, 7));
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

  const selectedDay = monthDays.find((day) => day.isoDate === selectedDate) || monthDays[0];
  const selectedDayMenu = menuByDate.get(selectedDate);
  const selectedDayTitle = formatSelectedDate(selectedDay?.isoDate || selectedDate);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Monthly Dining Planner</h1>
          <p className="text-slate-500 mt-1">Plan meals once for the whole month and edit each day from the calendar.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
             <ChevronLeft size={20} />
           </Button>
           <div className="font-bold text-slate-700 w-48 text-center inline-flex items-center justify-center gap-2">
              <CalendarDays size={16} />
              {firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
           </div>
           <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
             <ChevronRight size={20} />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
        <Card className="border-slate-200 bg-white shadow-lg overflow-hidden xl:sticky xl:top-6">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Timeline</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{firstDay.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {monthDays.length} days
              </div>
            </div>
          </div>

          <div className="max-h-[calc(100vh-240px)] overflow-y-auto px-4 py-4">
            <div className="space-y-3 pr-1">
              {monthDays.map(({ isoDate, label, weekday, item }) => {
                const isSelected = isoDate === selectedDate;
                return (
                  <button
                    key={isoDate}
                    type="button"
                    onClick={() => setSelectedDate(isoDate)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{weekday}</div>
                        <div className="mt-1 text-sm font-bold text-slate-900">{label}</div>
                      </div>
                      {isSelected ? (
                        <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Active</span>
                      ) : null}
                    </div>

                    <div className="mt-3 text-sm text-slate-600 leading-5 line-clamp-2">
                      <span className="font-semibold text-slate-800">Main meal:</span> {getMainMealSummary(item)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Selected day</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{selectedDayTitle}</div>
                  <p className="mt-2 text-sm text-slate-500">Edit the full menu for this day from the panel below.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <CalendarClock size={14} /> Day Summary
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <div><span className="font-semibold text-slate-800">Main meal:</span> {getMainMealSummary(selectedDayMenu)}</div>
                    <div><span className="font-semibold text-slate-800">Status:</span> {selectedDayMenu ? "Has content" : "Empty"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-0">
              <div className="p-6 space-y-5 border-b xl:border-b-0 xl:border-r border-slate-100">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                    <Coffee size={16} /> Breakfast
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line min-h-16">{selectedDayMenu?.breakfast || "No breakfast planned."}</p>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <Utensils size={16} /> Lunch
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line min-h-16">{selectedDayMenu?.lunch || "No lunch planned."}</p>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                    <Moon size={16} /> Dinner
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line min-h-16">{selectedDayMenu?.dinner || "No dinner planned."}</p>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                    <ImageIcon size={16} /> Image
                  </div>
                  {selectedDayMenu?.imageUrl ? (
                    <img
                      src={selectedDayMenu.imageUrl}
                      className="h-56 w-full rounded-xl object-cover border border-slate-200"
                      alt={`${selectedDayTitle} menu`}
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                      No image added for this day.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-white">
                <div className="text-sm uppercase tracking-[0.25em] text-slate-500">Editing</div>
                <div className="mt-1 text-xl font-bold text-slate-900">Update menu details</div>

                <div className="mt-6 space-y-5">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">Breakfast</label>
                    <textarea
                      value={editingMenu.breakfast}
                      onChange={(event) => setEditingMenu({ ...editingMenu, breakfast: event.target.value })}
                      className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">Lunch</label>
                    <textarea
                      value={editingMenu.lunch}
                      onChange={(event) => setEditingMenu({ ...editingMenu, lunch: event.target.value })}
                      className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">Dinner</label>
                    <textarea
                      value={editingMenu.dinner}
                      onChange={(event) => setEditingMenu({ ...editingMenu, dinner: event.target.value })}
                      className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-900 resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">Image URL</label>
                    <input
                      type="text"
                      value={editingMenu.imageUrl || ""}
                      onChange={(event) => setEditingMenu({ ...editingMenu, imageUrl: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Button onClick={handleSave} loading={savingMenu} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 gap-2">
                      <Save size={20} /> Save Menu
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

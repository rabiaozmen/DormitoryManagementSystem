import { useEffect, useMemo, useState } from "react";
import { Clock3, Filter, ListChecks, UserRound, Wrench, CheckCircle2, ArrowRightCircle, Search } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { advanceRequestStatus, getMaintenanceTickets } from "../../api/auth";
import { emitErrorToast } from "../../utils/toastEvents";

const STATUS_LABELS = {
  0: "Acik",
  1: "Atandi",
  2: "Devam Ediyor",
  3: "Cozuldu",
};

const PRIORITY_LABELS = {
  0: "Dusuk",
  1: "Orta",
  2: "Yuksek",
  3: "Acil",
};

const PRIORITY_BADGES = {
  0: "bg-emerald-100 text-emerald-700",
  1: "bg-yellow-100 text-yellow-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-red-100 text-red-700",
};

const STATUS_FILTERS = [
  { key: "all", label: "Tum" },
  { key: 0, label: "Acik" },
  { key: 1, label: "Atandi" },
  { key: 2, label: "Devam Ediyor" },
  { key: 3, label: "Cozuldu" },
];

const PRIORITY_FILTERS = [
  { key: "all", label: "Tum Oncelikler" },
  { key: 3, label: "Acil" },
  { key: 2, label: "Yuksek" },
  { key: 1, label: "Orta" },
  { key: 0, label: "Dusuk" },
];

const getNextStatus = (status) => {
  if (status === 0) return 1;
  if (status === 1) return 2;
  if (status === 2) return 3;
  return 3;
};

const buildActivityLog = (ticket) => {
  const logs = [
    {
      id: `${ticket.id}-created`,
      title: "Ticket olusturuldu",
      time: ticket.createdAtUtc,
    },
  ];

  if (ticket.status >= 1) {
    logs.push({
      id: `${ticket.id}-assigned`,
      title: "Ticket atandi",
      time: ticket.createdAtUtc,
    });
  }

  if (ticket.status >= 2) {
    logs.push({
      id: `${ticket.id}-progress`,
      title: "Calisma basladi",
      time: ticket.createdAtUtc,
    });
  }

  if (ticket.status >= 3) {
    logs.push({
      id: `${ticket.id}-resolved`,
      title: "Ticket cozuldu",
      time: ticket.resolvedAtUtc || ticket.createdAtUtc,
    });
  }

  return logs;
};

export default function MaintenanceTicketing() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await getMaintenanceTickets();
      setTickets(data);
      setSelectedTicketId((current) => current ?? data[0]?.id ?? null);
    } catch (error) {
      console.error(error);
      emitErrorToast("Ticket listesi yuklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      const normalizedSearch = searchTerm.trim().toLowerCase();

      if (!normalizedSearch) {
        return matchesStatus && matchesPriority;
      }

      const haystack = [
        ticket.ticketCode,
        ticket.studentName,
        ticket.roomNumber,
        ticket.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesPriority && haystack.includes(normalizedSearch);
    });
  }, [tickets, statusFilter, priorityFilter, searchTerm]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? filteredTickets[0] ?? null,
    [tickets, selectedTicketId, filteredTickets],
  );

  const advanceStatus = async (ticket, explicitStatus = null) => {
    const nextStatus = explicitStatus ?? getNextStatus(ticket.status);

    if (ticket.status === 3 || nextStatus === ticket.status) {
      return;
    }

    try {
      setUpdatingTicketId(ticket.id);
      await advanceRequestStatus(ticket.id, nextStatus);
      await loadTickets();
      setSelectedTicketId(ticket.id);
    } catch (error) {
      console.error(error);
      emitErrorToast("Ticket durumu guncellenemedi.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Maintenance ve Ticketing</h1>
        <p className="text-slate-500 mt-1">Ariza taleplerini yonetin, durumlarini takip edin ve cozum surecini hizlandirin.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-5 border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks size={18} className="text-indigo-600" />
              <h2 className="font-bold text-slate-900">Ticket Listesi</h2>
            </div>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ticket, ogrenci, oda ara..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={String(filter.key)}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === filter.key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {PRIORITY_FILTERS.map((filter) => (
                <button
                  key={String(filter.key)}
                  onClick={() => setPriorityFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    priorityFilter === filter.key
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[620px] overflow-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-sm text-slate-500">Yukleniyor...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-6">
                <EmptyState title="Ticket bulunamadi" description="Secili filtrede kayitli ticket yok." />
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selectedTicket?.id === ticket.id ? "bg-indigo-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm font-bold text-slate-700">{ticket.ticketCode || `TKT-${String(ticket.id).padStart(4, "0")}`}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${PRIORITY_BADGES[ticket.priority]}`}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{ticket.studentName}</p>
                  <p className="text-xs text-slate-500">Oda: {ticket.roomNumber || "N/A"}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">{STATUS_LABELS[ticket.status]}</span>
                    <span className="text-xs text-slate-400">{new Date(ticket.createdAtUtc).toLocaleString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="xl:col-span-7 border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Ticket Detayi</h2>
              <p className="text-sm text-slate-500">Secilen ticketin aciklamasi, ogrenci bilgileri ve aktivite gecmisi</p>
            </div>
            <Filter size={18} className="text-slate-400" />
          </div>

          {!selectedTicket ? (
            <div className="p-6">
              <EmptyState title="Ticket secilmedi" description="Sol taraftan bir ticket secerek detaylarini goruntuleyin." />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Ticket</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{selectedTicket.ticketCode || `TKT-${String(selectedTicket.id).padStart(4, "0")}`}</p>
                  <p className="text-sm text-slate-500 mt-1">Durum: {STATUS_LABELS[selectedTicket.status]}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Oncelik</p>
                  <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-bold ${PRIORITY_BADGES[selectedTicket.priority]}`}>
                    {PRIORITY_LABELS[selectedTicket.priority]}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Ticket Aciklamasi</h3>
                <p className="text-slate-800 leading-relaxed">{selectedTicket.description || "Aciklama girilmemis."}</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Ogrenci Bilgileri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <UserRound size={16} className="text-indigo-500" />
                    {selectedTicket.studentName}
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Wrench size={16} className="text-indigo-500" />
                    Oda No: {selectedTicket.roomNumber || "N/A"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Aktivite Logu</h3>
                <div className="space-y-3">
                  {buildActivityLog(selectedTicket).map((logItem) => (
                    <div key={logItem.id} className="flex items-start gap-3">
                      <Clock3 size={14} className="text-slate-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{logItem.title}</p>
                        <p className="text-xs text-slate-500">{new Date(logItem.time).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  loading={updatingTicketId === selectedTicket.id}
                  onClick={() => advanceStatus(selectedTicket)}
                  disabled={selectedTicket.status === 3}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <ArrowRightCircle size={16} className="mr-2" /> Durumu Ilerlet
                </Button>
                <Button
                  loading={updatingTicketId === selectedTicket.id}
                  onClick={() => advanceStatus(selectedTicket, 3)}
                  disabled={selectedTicket.status === 3}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 size={16} className="mr-2" /> Cozuldu Isaretle
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

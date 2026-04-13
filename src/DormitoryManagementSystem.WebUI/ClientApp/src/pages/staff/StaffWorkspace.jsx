import { useEffect, useState } from "react";
import { getStaffRequests, advanceRequestStatus } from "../../api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { AlertCircle, Clock, CheckCircle, Wrench, ArrowRightCircle } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";

export const StaffWorkspace = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [advancingId, setAdvancingId] = useState(null);

    const loadParams = async () => {
        setLoading(true);
        try {
            const data = await getStaffRequests();
            setRequests(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadParams();
    }, []);

    const advance = async (req) => {
        const next = req.status === 0 ? 1 : req.status === 1 ? 2 : req.status === 2 ? 3 : 3;
        try {
            setAdvancingId(req.id);
            await advanceRequestStatus(req.id, next);
            await loadParams();
        } catch (e) {
            console.error(e);
        } finally {
            setAdvancingId(null);
        }
    };

    const StatusBadge = ({ status }) => {
        const conf = {
            0: { label: "Open", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
            1: { label: "Assigned", color: "bg-indigo-100 text-indigo-800", icon: Clock },
            2: { label: "In Progress", color: "bg-amber-100 text-amber-800", icon: Wrench },
            3: { label: "Resolved", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle }
        };
        const c = conf[status] || conf[0];
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.color}`}>
                <Icon size={14} />
                {c.label}
            </span>
        );
    };

    const PriorityBadge = ({ priority }) => {
        const P = priority === 3 ? "Urgent" : priority === 2 ? "High" : priority === 1 ? "Medium" : "Low";
        const c = priority === 3 ? "text-red-700 bg-red-100" : priority === 2 ? "text-amber-700 bg-amber-100" : "text-slate-700 bg-slate-100";
        return <span className={`px-2 py-0.5 rounded text-xs font-bold ${c}`}>{P}</span>;
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading tickets...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Maintenance Issues</h1>
                <p className="text-slate-500 mt-1">Manage and track dormitory repair requests.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle>Active Tickets</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {requests.length === 0 ? (
                        <div className="p-6">
                            <EmptyState title="All caught up" description="There are no open maintenance requests." />
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {requests.map(r => (
                                <div key={r.id} className="p-4 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm font-bold text-slate-400">#{r.ticketCode}</span>
                                            <PriorityBadge priority={r.priority} />
                                        </div>
                                        <p className="text-slate-900 font-medium">{r.description || "No description provided."}</p>
                                        <div className="text-sm text-slate-500 flex gap-4">
                                            <span>Room ID: {r.roomId || 'N/A'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between md:flex-col md:items-end gap-3 min-w-[140px]">
                                        <StatusBadge status={r.status} />
                                        {r.status < 3 && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                loading={advancingId === r.id}
                                                className="w-full justify-between"
                                                onClick={() => advance(r)}
                                            >
                                                Advance Status
                                                <ArrowRightCircle size={16} className="ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

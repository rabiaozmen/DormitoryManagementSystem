import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getEntryExitLogs, getPendingLeaveRequests, reviewLeaveRequest } from "../../api/auth";
import { EmptyState } from "../../components/ui/EmptyState";
import { emitErrorToast } from "../../utils/toastEvents";

export default function StaffOperations() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reviewingId, setReviewingId] = useState(null);

  const loadData = async () => {
    try {
      const [pending, recentLogs] = await Promise.all([getPendingLeaveRequests(), getEntryExitLogs(100)]);
      setPendingRequests(pending);
      setLogs(recentLogs);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const review = async (leaveRequestId, approve) => {
    try {
      setReviewingId(leaveRequestId);
      await reviewLeaveRequest({ leaveRequestId, approve, staffNote: approve ? "Onaylandı" : "Reddedildi" });
      await loadData();
    } catch (error) {
      console.error(error);
      emitErrorToast("Islem basarisiz.");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Leave and Entry/Exit Ops</h1>
        <p className="text-slate-500 mt-1">İzin taleplerini yönet ve giriş-çıkış hareketlerini izle.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Leave Requests</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingRequests.length === 0 ? <EmptyState compact title="No pending requests" description="All leave requests are already reviewed." /> : pendingRequests.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{item.studentName}</div>
                    <div className="text-xs text-slate-500">{item.type === 1 ? "Overnight" : "Day"} | {new Date(item.startAtUtc).toLocaleString()} - {new Date(item.endAtUtc).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button loading={reviewingId === item.id} onClick={() => review(item.id, true)} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                    <Button loading={reviewingId === item.id} onClick={() => review(item.id, false)} className="bg-rose-600 hover:bg-rose-700">Reject</Button>
                  </div>
                </div>
                <div className="text-sm mt-2">{item.reason}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Entry/Exit Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {logs.length === 0 ? <EmptyState compact title="No logs found" description="Recent student movement logs will be listed here." /> : logs.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-slate-900">{item.studentName}</div>
                  <div className="text-xs text-slate-500">{item.eventType === 0 ? "Check-In" : "Check-Out"}</div>
                </div>
                <div className="text-xs text-slate-500">{new Date(item.eventAtUtc).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

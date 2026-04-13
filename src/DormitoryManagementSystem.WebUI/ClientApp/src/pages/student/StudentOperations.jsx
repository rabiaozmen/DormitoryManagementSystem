import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { createEntryExitLog, createLeaveRequest, getMyEntryExitLogs, getMyLeaveRequests } from "../../api/auth";
import { Clock3, DoorClosed, DoorOpen, Send } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";
import { emitErrorToast } from "../../utils/toastEvents";

export default function StudentOperations() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ type: 0, startAtUtc: "", endAtUtc: "", reason: "" });
  const [status, setStatus] = useState("");
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [loggingType, setLoggingType] = useState(null);

  const loadData = async () => {
    try {
      const [leaveData, logData] = await Promise.all([getMyLeaveRequests(), getMyEntryExitLogs()]);
      setLeaveRequests(leaveData);
      setLogs(logData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitLeave = async (event) => {
    event.preventDefault();
    setStatus("Submitting...");

    try {
      setLeaveSubmitting(true);
      await createLeaveRequest({
        type: Number(form.type),
        startAtUtc: new Date(form.startAtUtc).toISOString(),
        endAtUtc: new Date(form.endAtUtc).toISOString(),
        reason: form.reason,
      });

      setForm({ type: 0, startAtUtc: "", endAtUtc: "", reason: "" });
      setStatus("Leave request created.");
      await loadData();
    } catch (error) {
      setStatus(error?.response?.data?.message || "Request could not be created.");
      emitErrorToast(error?.response?.data?.message || error?.response?.data?.Message || "Request could not be created.");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const addLog = async (eventType) => {
    try {
      setLoggingType(eventType);
      await createEntryExitLog({ eventType });
      await loadData();
    } catch (error) {
      console.error(error);
      emitErrorToast("Action could not be recorded.");
    } finally {
      setLoggingType(null);
    }
  };

  const statusText = (value) => {
    if (value === 1) return "Approved";
    if (value === 2) return "Rejected";
    return "Pending";
  };

  const typeText = (value) => (value === 1 ? "Overnight" : "Day");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Leave and Entry/Exit</h1>
        <p className="text-slate-500 mt-1">Submit leave requests and manage your entry/exit records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock3 size={18} /> Leave Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitLeave} className="space-y-3">
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value={0}>Day Leave</option>
                <option value={1}>Overnight Leave</option>
              </select>
              <input
                type="datetime-local"
                value={form.startAtUtc}
                onChange={(event) => setForm((prev) => ({ ...prev, startAtUtc: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                required
              />
              <input
                type="datetime-local"
                value={form.endAtUtc}
                onChange={(event) => setForm((prev) => ({ ...prev, endAtUtc: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                required
              />
              <textarea
                value={form.reason}
                onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 h-24"
                placeholder="Reason for leave"
                required
              />
              <Button type="submit" loading={leaveSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Send size={14} className="mr-2" /> Submit Request
              </Button>
              {status ? <p className="text-sm text-slate-600">{status}</p> : null}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Entry/Exit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => addLog(1)} loading={loggingType === 1} className="w-full bg-amber-600 hover:bg-amber-700">
              <DoorOpen size={14} className="mr-2" /> Check-Out
            </Button>
            <Button onClick={() => addLog(0)} loading={loggingType === 0} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <DoorClosed size={14} className="mr-2" /> Check-In
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>My Leave Requests</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaveRequests.length === 0 ? <EmptyState compact title="No leave requests" description="You have not created any leave request yet." /> : leaveRequests.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{typeText(item.type)} Leave</span>
                  <span className="text-xs rounded-full px-2 py-1 bg-slate-100">{statusText(item.status)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{new Date(item.startAtUtc).toLocaleString()} - {new Date(item.endAtUtc).toLocaleString()}</div>
                <div className="text-sm mt-2">{item.reason}</div>
                {item.staffNote ? <div className="text-xs text-indigo-700 mt-2">Not: {item.staffNote}</div> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Entry/Exit Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 ? <EmptyState compact title="No logs yet" description="Your entry and exit actions will appear here." /> : logs.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3 flex justify-between">
                <span className="font-medium">{item.eventType === 0 ? "Check-In" : "Check-Out"}</span>
                <span className="text-xs text-slate-500">{new Date(item.eventAtUtc).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

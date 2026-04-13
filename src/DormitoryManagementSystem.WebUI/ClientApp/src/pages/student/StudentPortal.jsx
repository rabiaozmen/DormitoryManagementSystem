import { useEffect, useState } from "react";
import { getStudentMe, getStudentProfile, getStudentPayments, createMaintenanceTicket } from "../../api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { User, CreditCard, Wrench, Send } from "lucide-react";
import { AnnouncementsBoard } from "../../components/ui/AnnouncementsBoard";
import { EmptyState } from "../../components/ui/EmptyState";

export const StudentPortal = () => {
    const [profile, setProfile] = useState({});
    const [payments, setPayments] = useState([]);
    const [studentId, setStudentId] = useState("");
    
    // Ticket form
    const [desc, setDesc] = useState("");
    const [roomId, setRoomId] = useState("");
    const [submitStatus, setSubmitStatus] = useState("");
    const [submittingTicket, setSubmittingTicket] = useState(false);

    const loadData = async () => {
        try {
            const me = await getStudentMe();
            setStudentId(me.userId);
            const p = await getStudentProfile();
            setProfile(p);
            const pay = await getStudentPayments();
            setPayments(pay);
        } catch (e) {
            console.error("Error loading student data", e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleTicket = async (e) => {
        e.preventDefault();
        setSubmitStatus("Submitting...");
        try {
            setSubmittingTicket(true);
            await createMaintenanceTicket({ studentId, roomId: Number(roomId), description: desc, priority: 1 });
            setSubmitStatus("Ticket created successfully!");
            setDesc("");
        } catch (e) {
            setSubmitStatus("Failed to create ticket.");
        } finally {
            setSubmittingTicket(false);
        }
        setTimeout(() => setSubmitStatus(""), 3000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Portal</h1>
                <p className="text-slate-500 mt-1">Manage your stay and keep track of payments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <User size={24} />
                        </div>
                        <CardTitle>My Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-slate-500">System ID</p>
                                <p className="font-mono text-slate-900 bg-slate-50 p-2 rounded border border-slate-100">{studentId || "Loading..."}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Status</p>
                                <p className="text-slate-900">{profile.message || "Active"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <CreditCard size={24} />
                        </div>
                        <CardTitle>My Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <EmptyState compact title="No payment history" description="Invoices and payments will appear here." />
                        ) : (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {payments.map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <p className="font-mono text-xs text-slate-500">INV-{p.id}</p>
                                            <p className="font-medium text-slate-900">${p.amount}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${p.status === 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {p.status === 0 ? 'Pending' : 'Paid'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-md md:w-1/2">
                <CardHeader className="flex flex-row items-center gap-3">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                        <Wrench size={24} />
                    </div>
                    <CardTitle>Report an Issue</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleTicket} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                            <Input 
                                value={roomId} 
                                onChange={e => setRoomId(e.target.value)} 
                                placeholder="e.g. 101" 
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea 
                                className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brandNavy transition-all resize-none h-24"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Describe the maintenance issue..."
                                required
                            />
                        </div>
                        <Button type="submit" loading={submittingTicket} className="w-full flex items-center justify-center gap-2">
                            <Send size={16} />
                            Submit Request
                        </Button>
                        {submitStatus && (
                            <p className={`text-sm text-center font-medium ${submitStatus.includes("success") ? "text-emerald-600" : "text-amber-600"}`}>
                                {submitStatus}
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>

            <div className="mt-8 mb-8 pb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Campus Announcements</h2>
                <div className="bg-slate-900 rounded-xl p-6">
                    <AnnouncementsBoard />
                </div>
            </div>
        </div>
    );
};

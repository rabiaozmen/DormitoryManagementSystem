import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Megaphone, Trash2, Send } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";
import { EmptyState } from "./EmptyState";
import { emitErrorToast } from "../../utils/toastEvents";

export function AnnouncementsBoard() {
  const { role } = useAuth();
  const isAdminOrStaff = role === "Admin" || role === "Staff";
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("All");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      setPosting(true);
      await createAnnouncement({ title, content, targetAudience });
      setTitle("");
      setContent("");
      loadAnnouncements();
    } catch (err) {
      emitErrorToast(err?.response?.data?.message ?? err?.response?.data?.Message ?? "Announcement could not be posted.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err) {
      emitErrorToast("Announcement could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {isAdminOrStaff && (
        <Card className="p-6 bg-indigo-950/20 border-indigo-500/20">
          <form onSubmit={handleCreate} className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-400" />
              Post New Announcement
            </h3>
            <input 
              type="text" 
              placeholder="Announcement Title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500" 
              required
            />
            <textarea 
              placeholder="What do you want to say?" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 min-h-[100px]" 
              required
            />
            <div className="flex gap-4 items-center">
              <select 
                value={targetAudience} 
                onChange={(e) => setTargetAudience(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Audiences</option>
                <option value="Students">Students Only</option>
                <option value="Staff">Staff Only</option>
              </select>
              <Button type="submit" loading={posting} className="flex-1">
                <Send className="w-4 h-4 mr-2" /> Post
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-zinc-400">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <EmptyState title="No active announcements" description="New announcements will appear here for this audience." className="bg-zinc-900/20 border-zinc-700 text-zinc-300" />
        ) : (
          announcements.map((ann) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={ann.id}
            >
              <Card className="p-5 border-zinc-800 bg-zinc-900/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">{ann.title}</h4>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{ann.content}</p>
                    <div className="mt-4 flex gap-4 text-xs text-zinc-500">
                      <span>{new Date(ann.createdAtUtc).toLocaleDateString()}</span>
                      <span className="uppercase tracking-wider px-2 rounded-full bg-zinc-800">{ann.targetAudience}</span>
                    </div>
                  </div>
                  {isAdminOrStaff && (
                    <button 
                      onClick={() => handleDelete(ann.id)}
                      disabled={deletingId === ann.id}
                      className="text-zinc-500 hover:text-red-400 p-2 rounded-full hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Deactivate"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

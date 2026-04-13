import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bed, Plus, Trash2, Search, X } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getRooms, getUnassignedStudents, assignStudent, removeStudent } from "../../api/auth";
import { emitErrorToast } from "../../utils/toastEvents";
import { EmptyState } from "../../components/ui/EmptyState";

const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function Allocations() {
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetRoom, setTargetRoom] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState(null);

  const fetchData = async () => {
    try {
      const [roomData, studentData] = await Promise.all([getRooms(), getUnassignedStudents()]);
      setRooms(roomData);
      setStudents(studentData);
    } catch (error) {
      console.error("Failed to load allocations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students;

    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(term) ||
        student.studentNumber.toLowerCase().includes(term) ||
        student.id.toLowerCase().includes(term),
    );
  }, [students, studentSearch]);

  const openAssignModal = (room) => {
    setTargetRoom(room);
    setSelectedStudentId("");
    setStudentSearch("");
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setTargetRoom(null);
    setSelectedStudentId("");
    setStudentSearch("");
  };

  const handleAssignSubmit = async () => {
    if (!targetRoom) return;

    if (!selectedStudentId) {
      emitErrorToast("Please select a student to assign.");
      return;
    }

    if (!guidRegex.test(selectedStudentId)) {
      emitErrorToast("Selected student ID format is invalid (UUID/Guid expected).");
      return;
    }

    try {
      setIsAssigning(true);
      await assignStudent(selectedStudentId, targetRoom.id);
      closeAssignModal();
      await fetchData();
    } catch {
      emitErrorToast("Student could not be assigned. The room may be full.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (studentId) => {
    if (!confirm("Are you sure you want to remove this student from the room?")) return;
    try {
      setRemovingStudentId(studentId);
      await removeStudent(studentId);
      await fetchData();
    } catch {
      emitErrorToast("Student could not be removed from the room.");
    } finally {
      setRemovingStudentId(null);
    }
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Room Allocation Grid</h1>
        <p className="text-zinc-400">Assign students to rooms through the quick search modal.</p>
      </div>

      <Card className="p-4 bg-white/5 border-white/10 text-zinc-300 text-sm">
        Students waiting for assignment: <span className="font-semibold text-indigo-300">{students.length}</span>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const isFull = room.occupancy >= room.capacity;

          return (
            <Card
              key={room.id}
              className={`group p-6 border-white/5 bg-gradient-to-br ${
                isFull ? "from-amber-900/20 to-red-900/10" : "from-zinc-900/50 to-zinc-800/30"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Bed className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Room {room.roomNumber}</h3>
                    <div className="text-xs text-zinc-400">
                      {room.genderPolicy} • {room.monthlyRate} TL / month
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-bold ${isFull ? "text-amber-500" : "text-emerald-400"}`}>
                    {room.occupancy} / {room.capacity}
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Occupancy</div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase">Current Residents</div>
                {room.currentStudents.length === 0 ? (
                  <div className="text-sm text-zinc-600 italic py-2">Empty Room</div>
                ) : (
                  <div className="space-y-2">
                    {room.currentStudents.map((student) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={student.id}
                        className="flex justify-between items-center bg-zinc-900/50 rounded p-2 text-sm text-zinc-300"
                      >
                        <span className="truncate pr-4">{student.fullName}</span>
                        <button
                          onClick={() => handleRemove(student.id)}
                          disabled={removingStudentId === student.id}
                          className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/10 rounded transition-colors"
                          title="Remove from room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {!isFull && (
                <div className="mt-6 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  <Button
                    onClick={() => openAssignModal(room)}
                    className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Assign Student
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {assignModalOpen && targetRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/55"
              onClick={closeAssignModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative z-10 w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Room {targetRoom.roomNumber} - Assign Student</h3>
                  <p className="text-xs text-zinc-400">Find a student using name, number, or UUID and assign instantly.</p>
                </div>
                <button onClick={closeAssignModal} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search by student name, number, or UUID"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="max-h-64 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/70">
                {filteredStudents.length === 0 ? (
                  <div className="p-4">
                    <EmptyState compact title="No students found" description="Try a different search keyword." className="border-zinc-700 bg-zinc-900/40" />
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className={`flex cursor-pointer items-start gap-3 border-b border-zinc-800 p-3 text-sm last:border-b-0 ${
                        selectedStudentId === student.id ? "bg-indigo-500/15" : "hover:bg-zinc-900"
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedStudent"
                        value={student.id}
                        checked={selectedStudentId === student.id}
                        onChange={(event) => setSelectedStudentId(event.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-zinc-100">{student.fullName}</div>
                        <div className="text-xs text-zinc-500">{student.studentNumber} - {student.id}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={closeAssignModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignSubmit}
                  loading={isAssigning}
                  disabled={!selectedStudentId || isAssigning}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                >
                  Assign
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

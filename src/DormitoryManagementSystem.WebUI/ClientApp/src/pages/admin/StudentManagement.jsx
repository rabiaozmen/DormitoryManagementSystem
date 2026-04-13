import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Search, UserPlus, Mail, ShieldCheck, ShieldX, X, Save, AlertTriangle, PhoneCall } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getAllStudents, createStudent, toggleStudentActive, getDepartments, getRooms } from "../../api/auth";
import { emitErrorToast } from "../../utils/toastEvents";
import { EmptyState } from "../../components/ui/EmptyState";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"];

const buildInitialFormValues = () => ({
  studentGuid: crypto.randomUUID(),
  firstName: "",
  lastName: "",
  email: "",
  password: "P@ssw0rd123!",
  phone: "",
  tcIdentityNumber: "",
  bloodType: "",
  healthStatus: "",
  allergenFoodInfo: "",
  departmentId: "",
  roomId: "",
  birthDate: "",
});

const validationSchema = Yup.object({
  studentGuid: Yup.string().uuid("Geçerli bir UUID/Guid değeri gerekli").required("UUID/Guid zorunludur"),
  firstName: Yup.string().trim().required("Ad zorunludur"),
  lastName: Yup.string().trim().required("Soyad zorunludur"),
  email: Yup.string().email("Geçerli bir e-posta girin").required("E-posta zorunludur"),
  password: Yup.string().min(8, "Şifre en az 8 karakter olmalıdır").required("Şifre zorunludur"),
  phone: Yup.string().trim().required("Telefon zorunludur"),
  tcIdentityNumber: Yup.string()
    .matches(/^\d{11}$/, "TC Kimlik No 11 haneli olmalıdır")
    .required("TC Kimlik No zorunludur"),
  birthDate: Yup.string().required("Doğum tarihi zorunludur"),
  departmentId: Yup.string().required("Bölüm seçimi zorunludur"),
  roomId: Yup.string(),
  bloodType: Yup.string(),
});

const statusBadge = (isActive) => {
  if (isActive) {
    return "inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700";
  }

  return "inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700";
};

const toTelHref = (phone) => {
  const normalized = (phone || "").replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "";
};

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [togglingStudentId, setTogglingStudentId] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [bloodFilter, setBloodFilter] = useState("all");
  const [roomStatusFilter, setRoomStatusFilter] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentData, departmentData, roomData] = await Promise.all([getAllStudents(), getDepartments(), getRooms()]);
      setStudents(studentData);
      setDepartments(departmentData);
      setRooms(roomData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formik = useFormik({
    initialValues: buildInitialFormValues(),
    validationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        await createStudent({
          id: values.studentGuid,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          password: values.password,
          phone: values.phone.trim(),
          studentNumber: values.tcIdentityNumber.trim(),
          tcIdentityNumber: values.tcIdentityNumber.trim(),
          departmentId: Number(values.departmentId),
          roomId: values.roomId ? Number(values.roomId) : null,
          birthDate: values.birthDate,
          bloodType: values.bloodType || null,
          healthStatus: values.healthStatus?.trim() || null,
          allergenFoodInfo: values.allergenFoodInfo?.trim() || null,
        });

        setShowAddModal(false);
        resetForm({ values: buildInitialFormValues() });
        await loadData();
      } catch (error) {
        emitErrorToast(error?.response?.data?.message ?? error?.response?.data?.Message ?? "Ogrenci olusturulurken hata olustu.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const normalizedStudents = useMemo(
    () =>
      students.map((student) => ({
        ...student,
        bloodType: student.bloodType || "Belirtilmedi",
        roomStatus: student.roomNumber && student.roomNumber !== "N/A" ? "Dolu" : "Boş",
      })),
    [students],
  );

  const bloodTypeOptions = useMemo(() => {
    const unique = new Set(normalizedStudents.map((student) => student.bloodType).filter(Boolean));
    return Array.from(unique).sort((left, right) => left.localeCompare(right));
  }, [normalizedStudents]);

  const filteredStudents = useMemo(() => {
    return normalizedStudents.filter((student) => {
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        term.length === 0 ||
        student.fullName.toLowerCase().includes(term) ||
        student.studentNumber.toLowerCase().includes(term);

      const matchDepartment = departmentFilter === "all" || student.departmentName === departmentFilter;
      const matchBlood = bloodFilter === "all" || student.bloodType === bloodFilter;
      const matchRoom = roomStatusFilter === "all" || student.roomStatus === roomStatusFilter;

      return matchSearch && matchDepartment && matchBlood && matchRoom;
    });
  }, [normalizedStudents, searchTerm, departmentFilter, bloodFilter, roomStatusFilter]);

  const handleToggle = async (id) => {
    try {
      setTogglingStudentId(id);
      await toggleStudentActive(id);
      await loadData();
    } catch {
      emitErrorToast("Durum guncellenemedi.");
    } finally {
      setTogglingStudentId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Öğrenci listesi yükleniyor...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Records</h1>
          <p className="text-slate-500 mt-1">Öğrencileri filtreleyin, durumlarını takip edin ve yeni kayıt ekleyin.</p>
        </div>
        <Button
          onClick={() => {
            formik.resetForm({ values: buildInitialFormValues() });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <UserPlus size={18} /> New Registration
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Ad veya No ara..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Bölüm: Tümü</option>
          {departments.map((department) => (
            <option key={department.id} value={department.name}>
              {department.name}
            </option>
          ))}
        </select>

        <select
          value={bloodFilter}
          onChange={(event) => setBloodFilter(event.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Kan Grubu: Tümü</option>
          {bloodTypeOptions.map((bloodType) => (
            <option key={bloodType} value={bloodType}>
              {bloodType}
            </option>
          ))}
        </select>

        <select
          value={roomStatusFilter}
          onChange={(event) => setRoomStatusFilter(event.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Oda Durumu: Tümü</option>
          <option value="Dolu">Dolu</option>
          <option value="Boş">Boş</option>
        </select>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bölüm</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kan Grubu</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Oda</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Veli/Vasi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredStudents.map((student) => (
                  <motion.tr
                    layout
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
                          <span>{student.fullName}</span>
                          {student.hasOverduePayment ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700" title="Odemesi gecikmis">
                              <AlertTriangle size={12} /> Gecikme
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs font-mono text-slate-500">#{student.studentNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={12} /> {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{student.departmentName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{student.bloodType}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          student.roomStatus === "Dolu" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {student.roomStatus === "Dolu" ? `Room ${student.roomNumber}` : "Unassigned"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusBadge(student.isActive)}>
                        {student.isActive ? <ShieldCheck size={14} className="mr-1.5" /> : <ShieldX size={14} className="mr-1.5" />}
                        {student.isActive ? "Aktif" : "Mezun"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.guardianPhone ? (
                        <a
                          href={toTelHref(student.guardianPhone)}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          title={`${student.guardianFullName || "Veli"} - ${student.guardianPhone}`}
                        >
                          <PhoneCall size={13} /> Hemen Ara
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Veli bilgisi yok</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleToggle(student.id)}
                        loading={togglingStudentId === student.id}
                        variant="outline"
                        size="sm"
                        className={student.isActive ? "text-amber-600 border-amber-100 hover:bg-amber-50" : "text-emerald-600 border-emerald-100 hover:bg-emerald-50"}
                      >
                        {student.isActive ? "Pasifleştir" : "Aktifleştir"}
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-6">
              <EmptyState title="No students found" description="Try changing filters or add a new student registration." />
            </div>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="text-indigo-600" /> PostgreSQL Student Registration
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X />
                </button>
              </div>

              <form onSubmit={formik.handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">UUID / Guid</label>
                    <input
                      name="studentGuid"
                      value={formik.values.studentGuid}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 font-mono text-sm"
                    />
                    {formik.touched.studentGuid && formik.errors.studentGuid ? (
                      <p className="mt-1 text-xs text-rose-600">{formik.errors.studentGuid}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">TC Kimlik No</label>
                    <input
                      name="tcIdentityNumber"
                      value={formik.values.tcIdentityNumber}
                      onChange={(event) => {
                        const onlyDigits = event.target.value.replace(/\D/g, "").slice(0, 11);
                        formik.setFieldValue("tcIdentityNumber", onlyDigits);
                      }}
                      onBlur={formik.handleBlur}
                      placeholder="11 hane"
                      inputMode="numeric"
                      maxLength={11}
                      className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200"
                    />
                    {formik.touched.tcIdentityNumber && formik.errors.tcIdentityNumber ? (
                      <p className="mt-1 text-xs text-rose-600">{formik.errors.tcIdentityNumber}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Ad</label>
                    <input name="firstName" value={formik.values.firstName} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200" />
                    {formik.touched.firstName && formik.errors.firstName ? <p className="mt-1 text-xs text-rose-600">{formik.errors.firstName}</p> : null}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Soyad</label>
                    <input name="lastName" value={formik.values.lastName} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200" />
                    {formik.touched.lastName && formik.errors.lastName ? <p className="mt-1 text-xs text-rose-600">{formik.errors.lastName}</p> : null}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                    <input name="email" type="email" value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200" />
                    {formik.touched.email && formik.errors.email ? <p className="mt-1 text-xs text-rose-600">{formik.errors.email}</p> : null}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Telefon</label>
                    <input name="phone" value={formik.values.phone} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200" />
                    {formik.touched.phone && formik.errors.phone ? <p className="mt-1 text-xs text-rose-600">{formik.errors.phone}</p> : null}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Doğum Tarihi</label>
                    <input name="birthDate" type="date" value={formik.values.birthDate} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200" />
                    {formik.touched.birthDate && formik.errors.birthDate ? <p className="mt-1 text-xs text-rose-600">{formik.errors.birthDate}</p> : null}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Bölüm</label>
                    <select name="departmentId" value={formik.values.departmentId} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white">
                      <option value="">Bölüm seçin</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    {formik.touched.departmentId && formik.errors.departmentId ? <p className="mt-1 text-xs text-rose-600">{formik.errors.departmentId}</p> : null}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Kan Grubu</label>
                    <select name="bloodType" value={formik.values.bloodType} onChange={formik.handleChange} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white">
                      <option value="">Belirtilmedi</option>
                      {BLOOD_TYPES.map((bloodType) => (
                        <option key={bloodType} value={bloodType}>
                          {bloodType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Oda (Opsiyonel)</label>
                    <select name="roomId" value={formik.values.roomId} onChange={formik.handleChange} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200 bg-white">
                      <option value="">Auto-assign first available room</option>
                      {rooms
                        .filter((room) => room.occupancy < room.capacity)
                        .map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.roomNumber} - {room.occupancy}/{room.capacity}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Şifre</label>
                    <input name="password" type="password" value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200" />
                    {formik.touched.password && formik.errors.password ? <p className="mt-1 text-xs text-rose-600">{formik.errors.password}</p> : null}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Saglik Durumu</label>
                    <textarea
                      name="healthStatus"
                      value={formik.values.healthStatus}
                      onChange={formik.handleChange}
                      rows={3}
                      placeholder="Kronik durum, duzenli ilac vb."
                      className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Alerjen Gida Bilgisi</label>
                    <textarea
                      name="allergenFoodInfo"
                      value={formik.values.allergenFoodInfo}
                      onChange={formik.handleChange}
                      rows={3}
                      placeholder="Alerjiler, kaciniilmasi gereken gida turleri"
                      className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={formik.isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60">
                    <Save size={18} className="mr-2" /> Kaydet
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

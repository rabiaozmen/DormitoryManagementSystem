import { apiClient, setAccessToken } from "./client";

export const login = async (credentials) => {
  const response = await apiClient.post("/api/auth/login", credentials);
  setAccessToken(response.data.accessToken);
  return response.data;
};

export const logout = async () => {
  await apiClient.post("/api/auth/logout");
  setAccessToken(null);
};

export const refreshSession = async () => {
    const response = await apiClient.post("/api/auth/refresh", {});
    setAccessToken(response.data.accessToken);
    return response.data;
};

export const getAdminDashboard = async () => {
    const res = await apiClient.get("/api/admin/dashboard");
    return res.data;
}

export const getPendingPayments = async () => {
    const res = await apiClient.get("/api/payments/pending");
    return res.data;
}

export const getAllPayments = async () => {
    const res = await apiClient.get("/api/payments/all");
    return res.data;
}

export const createPayment = async (payload) => {
    return apiClient.post("/api/payments", payload);
}

export const markPaymentPaid = async (paymentId) => {
    return apiClient.post(`/api/payments/${paymentId}/mark-paid`);
}

export const getStaffRequests = async () => {
    const res = await apiClient.get("/api/maintenance/open");
    return res.data;
}

export const advanceRequestStatus = async (requestId, newStatus) => {
    return apiClient.patch("/api/maintenance/status", { requestId, newStatus });
}

export const getStudentMe = async () => {
    const res = await apiClient.get("/api/student/me");
    return res.data;
}

export const getStudentProfile = async () => {
    const res = await apiClient.get("/api/student/profile");
    return res.data;
}

export const getStudentPayments = async () => {
    const res = await apiClient.get("/api/payments/me");
    return res.data;
}

export const createMaintenanceTicket = async (payload) => {
    return apiClient.post("/api/maintenance", payload);
}

// Staff Allocations
export const getRooms = async () => {
    const res = await apiClient.get("/api/staff/allocations/rooms");
    return res.data;
}

export const getUnassignedStudents = async () => {
    const res = await apiClient.get("/api/staff/allocations/students/unassigned");
    return res.data;
}

export const assignStudent = async (studentId, roomId) => {
    return apiClient.post("/api/staff/allocations/assign", { studentId, roomId });
}

export const removeStudent = async (studentId) => {
    return apiClient.post("/api/staff/allocations/remove", { studentId });
}

// Announcements
export const getAnnouncements = async () => {
    const res = await apiClient.get("/api/announcements");
    return res.data;
}

export const createAnnouncement = async (payload) => {
    return apiClient.post("/api/announcements", payload);
}

export const deleteAnnouncement = async (id) => {
    return apiClient.delete(`/api/announcements/${id}`);
}

// Student Management (Admin)
export const getAllStudents = async () => {
    const res = await apiClient.get("/api/admin/students");
    return res.data;
}

export const createStudent = async (payload) => {
    return apiClient.post("/api/admin/students", payload);
}

export const updateStudent = async (id, payload) => {
    return apiClient.put(`/api/admin/students/${id}`, payload);
}

export const toggleStudentActive = async (id) => {
    return apiClient.post(`/api/admin/students/${id}/toggle-active`);
}

// Departments
export const getDepartments = async () => {
    const res = await apiClient.get("/api/departments");
    return res.data;
}

export const createDepartment = async (payload) => {
    return apiClient.post("/api/departments", payload);
}

// Expenses
export const getExpenses = async () => {
    const res = await apiClient.get("/api/admin/expenses");
    return res.data;
}

export const createExpense = async (payload) => {
    return apiClient.post("/api/admin/expenses", payload);
}

// Dining
export const getWeeklyMenu = async (startDate) => {
    const res = await apiClient.get(`/api/dining/weekly?startDate=${startDate}`);
    return res.data;
}

export const getMonthlyMenu = async (monthStart) => {
    const res = await apiClient.get(`/api/dining/monthly?monthStart=${monthStart}`);
    return res.data;
}

export const upsertDiningMenu = async (payload) => {
    return apiClient.post("/api/dining", payload);
}

// Student operations: leave requests + entry/exit logs
export const getMyLeaveRequests = async () => {
    const res = await apiClient.get("/api/student/operations/leave-requests");
    return res.data;
}

export const createLeaveRequest = async (payload) => {
    const res = await apiClient.post("/api/student/operations/leave-requests", payload);
    return res.data;
}

export const getMyEntryExitLogs = async () => {
    const res = await apiClient.get("/api/student/operations/entry-exit-logs");
    return res.data;
}

export const createEntryExitLog = async (payload) => {
    const res = await apiClient.post("/api/student/operations/entry-exit-logs", payload);
    return res.data;
}

// Staff operations: review leave requests + monitor entry/exit logs
export const getPendingLeaveRequests = async () => {
    const res = await apiClient.get("/api/staff/operations/leave-requests/pending");
    return res.data;
}

export const reviewLeaveRequest = async (payload) => {
    const res = await apiClient.post("/api/staff/operations/leave-requests/review", payload);
    return res.data;
}

export const getEntryExitLogs = async (take = 100) => {
    const res = await apiClient.get(`/api/staff/operations/entry-exit-logs?take=${take}`);
    return res.data;
}

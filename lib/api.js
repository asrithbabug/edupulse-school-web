'use client';

/**
 * EduPulse API client for the school web app.
 *
 * Talks to the Laravel API at `${NEXT_PUBLIC_API_URL}/api/v1`. Every response
 * there is an envelope: { success, message, data, meta? }. The functions below
 * unwrap it and shape the data the way the pages use it, so pages never build
 * URLs or read tokens themselves.
 */

import { clearAuth, getToken } from './auth';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_BASE = `${API_URL}/api/v1`;

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, errors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

function query(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

async function send(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Please check your internet connection.');
  }

  // Session expired or revoked: sign out everywhere except on the login/password screens.
  if (response.status === 401 && !path.startsWith('/auth/') && typeof window !== 'undefined') {
    clearAuth();
    window.location.href = '/login/';
  }

  return response;
}

async function request(path, options) {
  const response = await send(path, options);
  const json = await response.json().catch(() => null);

  if (!response.ok || json?.success === false) {
    throw new ApiError(json?.message || `Request failed (${response.status})`, {
      status: response.status,
      code: json?.code ?? null,
      errors: json?.errors ?? null,
    });
  }
  return json ?? {};
}

const data = async (path, options) => (await request(path, options)).data;

/** Lists come back as { data, pagination } to match the pages. */
const list = async (path, mapRow = (row) => row) => {
  const json = await request(path);
  return { data: (json.data || []).map(mapRow), pagination: json.meta?.pagination || null };
};

/** Downloads a CSV (or any file) through the authenticated API. */
async function download(path, filename) {
  const response = await send(path);
  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new ApiError(json?.message || `Download failed (${response.status})`, { status: response.status });
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ── Shapes ─────────────────────────────────────────────────────────

const digits = (value) => String(value ?? '').replace(/\D/g, '');
const lastTen = (value) => digits(value).slice(-10);
const yesNo = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === 'string' && value) return ['yes', 'true', '1'].includes(value.toLowerCase());
  return undefined;
};

/** Student as the pages use it (roll_no = admission number, phone/email = parent contact). */
const mapStudent = (s) => ({
  ...s,
  roll_no: s.admission_no,
  phone: s.contact?.phone ?? null,
  email: s.contact?.email ?? null,
});

/** New-admission / existing-student form → admission request. */
function toAdmission(form) {
  const { pin, identification_marks: marks, vaccinated, qualified_for_promotion: qualified, ...rest } = form;
  const [mark1, mark2] = String(marks || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    ...rest,
    aadhaar: digits(rest.aadhaar),
    parent_aadhaar: digits(rest.parent_aadhaar),
    parent_mobile: lastTen(rest.parent_mobile),
    pin_code: pin || undefined,
    identification_mark_1: mark1,
    identification_mark_2: mark2,
    vaccinated: yesNo(vaccinated),
    qualified_for_promotion: yesNo(qualified),
  };
}

function toStaff(form) {
  const payload = { ...form };
  if (payload.experience !== undefined && payload.experience !== null && payload.experience !== '') {
    payload.experience = String(payload.experience);
  }
  if (payload.aadhaar) payload.aadhaar = digits(payload.aadhaar);
  if (!payload.email) delete payload.email;
  delete payload.employee_id; // generated by the server
  return payload;
}

// ── API ────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: ({ id, password }) =>
    data('/auth/login', {
      method: 'POST',
      body: { id: String(id).trim().toUpperCase(), password, role: 'admin', device_name: 'school-web' },
    }),
  logout: () => request('/auth/logout', { method: 'POST' }).catch(() => null),
  forgotPassword: (identifier) =>
    request('/auth/password/forgot', { method: 'POST', body: { identifier: String(identifier).trim() } }),
  verifyPasswordToken: (token) => data(`/auth/password/verify/${encodeURIComponent(token)}`),
  setPassword: ({ token, password }) => request('/auth/password/set', { method: 'POST', body: { token, password } }),
  resendSetupLink: (userId) => data(`/users/${encodeURIComponent(userId)}/setup-link`, { method: 'POST' }),

  // Dashboard & settings
  getAdminDashboard: async () => {
    const d = await data('/dashboard');
    return { ...d, total_teachers: d.total_staff };
  },
  getSchoolProfile: () => data('/settings'),
  updateSchoolProfile: (profile) => {
    const allowed = ['name', 'address', 'city', 'state', 'phone', 'email', 'logo_url', 'settings'];
    const body = Object.fromEntries(Object.entries(profile || {}).filter(([key]) => allowed.includes(key)));
    if (!body.logo_url) delete body.logo_url;
    return data('/settings', { method: 'PATCH', body });
  },

  // Students
  getStudents: (params = {}) => list(`/students${query({ per_page: 500, ...params })}`, mapStudent),
  getStudent: async (id) => mapStudent(await data(`/students/${encodeURIComponent(id)}`)),
  createStudent: (form) => data('/students', { method: 'POST', body: toAdmission(form) }),
  updateStudent: (id, form) =>
    data(`/students/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: {
        name: form.name,
        class: form.class,
        section: form.section,
        parent_name: form.parent_name,
        parent_mobile: form.phone ? lastTen(form.phone) : undefined,
        parent_email: form.email || null,
      },
    }),
  deleteStudent: (id) => request(`/students/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getStudentAttendance: (id) => data(`/students/${encodeURIComponent(id)}/attendance`),
  getStudentMarks: (id) => data(`/students/${encodeURIComponent(id)}/marks`),
  getStudentFees: (id) => data(`/students/${encodeURIComponent(id)}/fees`),

  /** Distinct classes ("10-A") of the school's students, for class pickers. */
  getClassOptions: async () => {
    const { data: students } = await api.getStudents();
    return [...new Set(students.map((s) => s.class).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  },

  // Staff
  getTeachers: () => list(`/staff${query({ per_page: 500 })}`),
  createTeacher: (form) => data('/staff', { method: 'POST', body: toStaff(form) }),
  updateTeacher: (id, form) => data(`/staff/${encodeURIComponent(id)}`, { method: 'PATCH', body: toStaff(form) }),
  deleteTeacher: (id) => request(`/staff/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (params = '') => list(`/attendance?per_page=500${params ? `&${params}` : ''}`),

  // Fees
  getFees: () => list('/fees/summary', (row) => ({ ...row, total_fee: row.total })),
  getFeeStructure: () => data('/fee-structures'),
  assignFee: ({ student_id: studentId, class: className, fee_type, amount, due_date, description }) =>
    data('/fees', {
      method: 'POST',
      body: {
        ...(studentId ? { student_ids: [String(studentId).trim().toUpperCase()] } : { class: className }),
        fee_type,
        amount: Number(amount),
        due_date,
        description: description || undefined,
      },
    }),
  getUnpaidFees: async (studentId) => {
    const { data: fees } = await list(`/fees${query({ student_id: studentId, per_page: 100 })}`);
    return fees.filter((fee) => fee.status !== 'paid');
  },
  recordPayment: ({ fee_id, paid_date, receipt_no, payment_mode }) =>
    data('/payments', { method: 'POST', body: { fee_id, paid_date, receipt_no: receipt_no || undefined, payment_mode } }),

  // Announcements
  getAnnouncements: async () => {
    const { data: rows } = await list(`/announcements${query({ per_page: 50 })}`);
    return rows.map((a) => ({ ...a, posted_by_name: a.posted_by?.name ?? null }));
  },
  createAnnouncement: (payload) => data('/announcements', { method: 'POST', body: payload }),

  // Staff permissions
  getPermissionModules: () => data('/staff-permissions/modules'),
  getAllPermissions: () => data('/staff-permissions'),
  updateTeacherPermissions: (staffId, permissions) =>
    request(`/staff/${encodeURIComponent(staffId)}/permissions`, { method: 'PUT', body: { permissions } }),

  // Subjects
  getSubjects: () => data('/subjects'),
  createSubject: (form) => data('/subjects', { method: 'POST', body: form }),
  updateSubject: (id, form) => data(`/subjects/${id}`, { method: 'PATCH', body: form }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),

  // Timetable
  getTimetable: (className) => data(`/timetable${query({ class: className })}`),
  saveTimetableSlot: (slot) => data('/timetable', { method: 'POST', body: slot }),
  deleteTimetableSlot: (id) => request(`/timetable/${id}`, { method: 'DELETE' }),

  // Exams
  getExamTypes: () => data('/exam-types'),
  createExamType: (form) => data('/exam-types', { method: 'POST', body: form }),

  // Calendar
  getAcademicCalendar: (month, year) => data(`/calendar${query({ month, year })}`),
  createCalendarEvent: (form) => data('/calendar', { method: 'POST', body: form }),
  deleteCalendarEvent: (id) => request(`/calendar/${id}`, { method: 'DELETE' }),

  // Bulk import / export (CSV)
  downloadTemplate: (type) => download(`/import/${type}/template`, `${type}_template.csv`),
  exportCsv: (type) => download(`/export/${type}`, `${type}_${new Date().toISOString().slice(0, 10)}.csv`),
  importCsv: (type, file) => {
    const form = new FormData();
    form.append('file', file);
    return data(`/import/${type}`, { method: 'POST', body: form });
  },

  // Support
  getSupportTickets: () => list(`/support-tickets${query({ per_page: 100 })}`),
  createSupportTicket: (form) => data('/support-tickets', { method: 'POST', body: form }),
};

export default api;

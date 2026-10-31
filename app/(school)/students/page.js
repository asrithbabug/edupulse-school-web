'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, XMarkIcon, EnvelopeIcon, FunnelIcon, ChevronDownIcon, UserPlusIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeFilters, setActiveFilters] = useState({ class: '', section: '', status: '' });
  const addMenuRef = useRef(null);
  const filterRef = useRef(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.getStudents();
        setStudents(res && res.data ? res.data : Array.isArray(res) ? res : []);
      } catch (err) {
        console.warn('Failed to fetch students:', err.message);
        setStudents([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) setAddMenuOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse combined "10-A" field into class number and section
  const getClassNum = (s) => s.class ? s.class.split('-')[0] : '';
  const getSection = (s) => s.class ? s.class.split('-')[1] || '' : '';

  const filteredStudents = students.filter((s) => {
    const matchClass = !activeFilters.class || getClassNum(s) === activeFilters.class;
    const matchSection = !activeFilters.section || getSection(s) === activeFilters.section;
    const matchStatus = !activeFilters.status ||
      (activeFilters.status === 'Active' ? (s.is_active === true || s.is_active === 'active') : (s.is_active === false || s.is_active === 'inactive'));
    return matchClass && matchSection && matchStatus;
  });

  // Unique class numbers from actual data e.g. ["9", "10"]
  const uniqueClasses = [...new Set(students.map(getClassNum).filter(Boolean))].sort((a, b) => Number(a) - Number(b));

  // Sections available only for the currently selected class filter (or all if no class selected)
  const relevantStudents = filterClass ? students.filter((s) => getClassNum(s) === filterClass) : students;
  const uniqueSections = [...new Set(relevantStudents.map(getSection).filter(Boolean))].sort();

  async function handleSelectStudent(student) {
    setSelectedStudent(student);
    setProgressLoading(true);
    setStudentProgress(null);

    try {
      const [attendance, marks, fees] = await Promise.all([
        api.getStudentAttendance(student.id),
        api.getStudentMarks(student.id),
        api.getStudentFees(student.id),
      ]);
      setStudentProgress({ attendance, marks, fees });
    } catch (err) {
      console.warn('Failed to load student progress:', err.message);
      setStudentProgress({ attendance: null, marks: null, fees: null });
    }
    setProgressLoading(false);
  }

  async function handleDownloadExcel() {
    try {
      await api.exportCsv('students');
    } catch (err) {
      alert(err.message || 'Failed to export students');
    }
  }

  async function handleResendPassword(userId) {
    if (!confirm('Resend password setup link to this student?')) return;
    try {
      const result = await api.resendSetupLink(userId);
      alert(result?.email_sent
        ? result.message
        : `${result?.message || 'Email could not be sent.'}\n\nShare this link with the parent:\n${result?.setup_link}`);
    } catch (err) {
      alert(err.message || 'Failed to resend password link');
    }
  }

  const columns = [
    { key: 'id', label: 'Student ID' },
    { key: 'roll_no', label: 'Admission No' },
    { key: 'name', label: 'Name', render: (val, row) => (
      <button onClick={(e) => { e.stopPropagation(); handleSelectStudent(row); }} className="text-left font-medium text-primary hover:underline">
        {val}
      </button>
    )},
    { key: 'class', label: 'Class' },
    { key: 'parent_name', label: 'Parent' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === true || val === 'active' ? 'success' : 'danger'}>
          {val === true || val === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="p-1 hover:bg-gray-100 rounded" title="Edit">
            <PencilIcon className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleResendPassword(row.id); }} className="p-1 hover:bg-gray-100 rounded" title="Resend Password">
            <EnvelopeIcon className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1 hover:bg-gray-100 rounded" title="Deactivate">
            <TrashIcon className="w-4 h-4 text-danger" />
          </button>
        </div>
      ),
    },
  ];

  const handleEdit = (student) => {
    router.push(`/students/new-admission?edit=${encodeURIComponent(student.id)}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this student? The parent will no longer be able to sign in.')) return;
    try {
      await api.deleteStudent(id);
      setStudents(students.map((s) => (s.id === id ? { ...s, is_active: false } : s)));
      if (selectedStudent?.id === id) setSelectedStudent(null);
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    }
  };

  if (loading) return <LoadingSpinner />;

  const activeFilterCount = [activeFilters.class, activeFilters.section, activeFilters.status].filter(Boolean).length;

  function openNewAdmission() {
    setAddMenuOpen(false);
    router.push('/students/new-admission');
  }

  function openExistingAdmission() {
    setAddMenuOpen(false);
    router.push('/students/existing-student');
  }

  function applyFilters() {
    setActiveFilters({ class: filterClass, section: filterSection, status: filterStatus });
    setFilterOpen(false);
  }

  function clearFilters() {
    setFilterClass('');
    setFilterSection('');
    setFilterStatus('');
    setActiveFilters({ class: '', section: '', status: '' });
    // intentionally not closing the panel
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Students</h2>
          <p className="text-text-secondary text-sm mt-1">Manage student records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadExcel} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowDownTrayIcon className="w-4 h-4" /> Export Students
          </button>
          {/* Add button with dropdown */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setAddMenuOpen((v) => !v)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <PlusIcon className="w-4 h-4" /> Add
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${addMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {addMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-border rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
                <button
                  onClick={openNewAdmission}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserPlusIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">New Admission</p>
                    <p className="text-xs text-text-muted mt-0.5">Fresh student joining from 2026</p>
                  </div>
                </button>
                <div className="h-px bg-border mx-3" />
                <button
                  onClick={openExistingAdmission}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <ArchiveBoxIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Existing Student</p>
                    <p className="text-xs text-text-muted mt-0.5">Digitise a manual register record</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.class && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Class: {activeFilters.class}
              <button onClick={() => setActiveFilters((f) => ({ ...f, class: '' }))} className="hover:opacity-70">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {activeFilters.section && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Section: {activeFilters.section}
              <button onClick={() => setActiveFilters((f) => ({ ...f, section: '' }))} className="hover:opacity-70">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {activeFilters.status && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {activeFilters.status}
              <button onClick={() => setActiveFilters((f) => ({ ...f, status: '' }))} className="hover:opacity-70">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-text-muted hover:text-danger transition-colors">Clear all</button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredStudents}
        searchPlaceholder="Search students..."
        onRowClick={(row) => handleSelectStudent(row)}
        actions={
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FunnelIcon className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[10px] font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {filterOpen && (
              <div className="fixed z-[999] w-64 bg-white border border-border rounded-xl shadow-xl p-4 space-y-3"
                style={{ top: filterRef.current ? filterRef.current.getBoundingClientRect().bottom + 6 : 'auto',
                         right: typeof window !== 'undefined' ? window.innerWidth - (filterRef.current ? filterRef.current.getBoundingClientRect().right : 0) : 0 }}>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Filter students</p>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Class</label>
                  <select
                    value={filterClass}
                    onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); }}
                    className="input-field text-sm"
                  >
                    <option value="">All classes</option>
                    {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Section</label>
                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">All sections</option>
                    {uniqueSections.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={clearFilters} className="btn-secondary flex-1 text-sm">Clear</button>
                  <button onClick={applyFilters} className="btn-primary flex-1 text-sm">Apply</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Student Detail Panel */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedStudent(null)} />
          <div className="ml-auto relative w-full max-w-2xl bg-white shadow-2xl h-full overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-text-primary">Student Profile</h3>
              <button onClick={() => setSelectedStudent(null)} className="p-1 hover:bg-gray-100 rounded">
                <XMarkIcon className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{selectedStudent.name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-text-primary">{selectedStudent.name}</h4>
                  <p className="text-sm text-text-secondary">ID: {selectedStudent.id} • Class {selectedStudent.class}{selectedStudent.section ? `-${selectedStudent.section}` : ''} • Admission No: {selectedStudent.roll_no || '-'}</p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-4">
                <InfoItem label="Parent Name" value={selectedStudent.parent_name || '-'} />
                <InfoItem label="Phone" value={selectedStudent.phone || '-'} />
                <InfoItem label="Email" value={selectedStudent.email || '-'} />
                <InfoItem label="Gender" value={selectedStudent.gender || '-'} />
                <InfoItem label="Date of Birth" value={selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : '-'} />
                <InfoItem label="Status" value={selectedStudent.is_active === true || selectedStudent.is_active === 'active' ? 'Active' : 'Inactive'} />
              </div>

              <hr className="border-border" />

              {/* Progress Section */}
              {progressLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-text-muted">Loading progress...</span>
                </div>
              ) : studentProgress ? (
                <>
                  {/* Attendance Summary */}
                  <div>
                    <h5 className="text-sm font-semibold text-text-primary mb-3">📊 Attendance</h5>
                    {studentProgress.attendance ? (
                      <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Present" value={studentProgress.attendance.present ?? 0} color="text-green-600" bg="bg-green-50" />
                        <StatCard label="Absent" value={studentProgress.attendance.absent ?? 0} color="text-red-600" bg="bg-red-50" />
                        <StatCard label="Percentage" value={`${(studentProgress.attendance.percentage ?? 0).toFixed(1)}%`} color="text-blue-600" bg="bg-blue-50" />
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">No attendance data available</p>
                    )}
                  </div>

                  <hr className="border-border" />

                  {/* Marks Summary */}
                  <div>
                    <h5 className="text-sm font-semibold text-text-primary mb-3">📝 Marks</h5>
                    {studentProgress.marks && studentProgress.marks.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-border">
                              <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">Subject</th>
                              <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">Exam</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">Marks</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">Total</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentProgress.marks.map((m, i) => (
                              <tr key={i} className="border-b border-border last:border-0">
                                <td className="px-3 py-2 font-medium">{m.subject}</td>
                                <td className="px-3 py-2 text-text-secondary">{m.exam_type || '-'}</td>
                                <td className="px-3 py-2 text-center">{m.marks}</td>
                                <td className="px-3 py-2 text-center text-text-muted">{m.total_marks || m.total || '-'}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`font-medium ${(m.percentage || (m.marks / (m.total_marks || 100) * 100)) >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                                    {m.percentage ? `${m.percentage.toFixed(0)}%` : m.total_marks ? `${((m.marks / m.total_marks) * 100).toFixed(0)}%` : '-'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">No marks data available</p>
                    )}
                  </div>

                  <hr className="border-border" />

                  {/* Fees Summary */}
                  <div>
                    <h5 className="text-sm font-semibold text-text-primary mb-3">💰 Fees</h5>
                    {studentProgress.fees ? (
                      <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Total Fee" value={`₹${(studentProgress.fees.total ?? studentProgress.fees.total_fee ?? 0).toLocaleString()}`} color="text-gray-700" bg="bg-gray-50" />
                        <StatCard label="Paid" value={`₹${(studentProgress.fees.paid ?? 0).toLocaleString()}`} color="text-green-600" bg="bg-green-50" />
                        <StatCard label="Due" value={`₹${(studentProgress.fees.due ?? studentProgress.fees.pending ?? 0).toLocaleString()}`} color="text-red-600" bg="bg-red-50" />
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">No fees data available</p>
                    )}
                  </div>
                </>
              ) : null}

              <hr className="border-border" />

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => { handleEdit(selectedStudent); setSelectedStudent(null); }} className="btn-primary text-sm flex items-center gap-2">
                  <PencilIcon className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => handleResendPassword(selectedStudent.id)} className="btn-secondary text-sm flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4" /> Resend Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  );
}
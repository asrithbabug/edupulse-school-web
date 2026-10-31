'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, XMarkIcon, EnvelopeIcon, FunnelIcon, ChevronDownIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', subject: '', classes: '', phone: '', email: '' });
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStaffType, setFilterStaffType] = useState('');
  const [activeFilters, setActiveFilters] = useState({ subject: '', status: '', staffType: '' });
  const addMenuRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.getTeachers();
        setTeachers(res && res.data ? res.data : Array.isArray(res) ? res : []);
      } catch (err) {
        console.warn('Failed to fetch teachers:', err.message);
        setTeachers([]);
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

  async function handleDownloadExcel() {
    try {
      await api.exportCsv('staff');
    } catch (err) {
      alert(err.message || 'Failed to export staff');
    }
  }

  async function handleResendPassword(userId) {
    if (!confirm('Resend password setup link to this staff member?')) return;
    try {
      const result = await api.resendSetupLink(userId);
      alert(result?.email_sent
        ? result.message
        : `${result?.message || 'Email could not be sent.'}\n\nShare this link with the staff member:\n${result?.setup_link}`);
    } catch (err) {
      alert(err.message || 'Failed to resend password link');
    }
  }

  const columns = [
    { key: 'employee_id', label: 'Employee ID', render: (val, row) => val || row.id },
    { key: 'name', label: 'Name', render: (val, row) => (
      <button onClick={() => setSelectedTeacher(row)} className="text-left font-medium text-primary hover:underline">
        {val}
      </button>
    )},
    { key: 'staff_type', label: 'Type', render: (val) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        val === 'non-teaching' ? 'bg-amber-50 text-amber-700' : 'bg-primary/10 text-primary'
      }`}>
        {val === 'non-teaching' ? 'Non-Teaching' : 'Teaching'}
      </span>
    )},
    { key: 'subject', label: 'Subject', render: (val) => val || '—' },
    { key: 'classes', label: 'Classes', render: (val) => Array.isArray(val) ? val.join(', ') : val || '—' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === true || val === 'active' ? 'success' : 'warning'}>
          {val === true || val === 'active' ? 'Active' : val === false ? 'Inactive' : val || 'N/A'}
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

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      id: teacher.id,
      name: teacher.name,
      subject: teacher.subject || '',
      classes: Array.isArray(teacher.classes) ? teacher.classes.join(', ') : teacher.classes || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this staff member? They will no longer be able to sign in.')) return;
    try {
      await api.deleteTeacher(id);
      setTeachers(teachers.map((t) => (t.id === id ? { ...t, is_active: false } : t)));
      if (selectedTeacher?.id === id) setSelectedTeacher(null);
    } catch (err) {
      alert(err.message || 'Failed to delete staff member');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const classesArray = formData.classes
        ? formData.classes.split(',').map(c => c.trim()).filter(Boolean)
        : [];

      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, {
          name: formData.name,
          subject: formData.subject,
          phone: formData.phone,
          email: formData.email,
          classes: classesArray,
        });
        const res = await api.getTeachers();
        setTeachers(res && res.data ? res.data : Array.isArray(res) ? res : []);
      }
      setModalOpen(false);
      setEditingTeacher(null);
      setFormData({ id: '', name: '', subject: '', classes: '', phone: '', email: '' });
    } catch (err) {
      alert(err.message || 'Failed to save teacher');
    }
  };

  if (loading) return <LoadingSpinner />;

  const uniqueSubjects = [...new Set(teachers.map(t => t.subject).filter(Boolean))].sort();

  const filteredTeachers = teachers.filter(t => {
    const matchSubject   = !activeFilters.subject || t.subject === activeFilters.subject;
    const matchStaffType = !activeFilters.staffType || t.staff_type === activeFilters.staffType;
    const matchStatus    = !activeFilters.status ||
      (activeFilters.status === 'Active'
        ? (t.is_active === true || t.is_active === 'active')
        : (t.is_active === false || t.is_active === 'inactive'));
    return matchSubject && matchStaffType && matchStatus;
  });

  const activeFilterCount = [activeFilters.subject, activeFilters.staffType, activeFilters.status].filter(Boolean).length;

  function applyFilters() {
    setActiveFilters({ subject: filterSubject, staffType: filterStaffType, status: filterStatus });
    setFilterOpen(false);
  }

  function clearFilters() {
    setFilterSubject('');
    setFilterStaffType('');
    setFilterStatus('');
    setActiveFilters({ subject: '', staffType: '', status: '' });
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Staff</h2>
          <p className="text-text-secondary text-sm mt-1">Manage Academic and Administrative Staff</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadExcel} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowDownTrayIcon className="w-4 h-4" /> Export Staff
          </button>
          {/* Add button */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setAddMenuOpen(v => !v)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <PlusIcon className="w-4 h-4" /> Add
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${addMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {addMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-border rounded-xl shadow-lg z-50 py-1.5">
                <button
                  onClick={() => { setAddMenuOpen(false); router.push('/staff/teaching'); }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AcademicCapIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Teaching Staff</p>
                  </div>
                </button>
                <div className="h-px bg-border mx-3" />
                <button
                  onClick={() => { setAddMenuOpen(false); router.push('/staff/non-teaching'); }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <UserGroupIcon className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Non-Teaching Staff</p>
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
          {activeFilters.staffType && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {activeFilters.staffType === 'teaching' ? 'Teaching' : 'Non-Teaching'}
              <button onClick={() => setActiveFilters(f => ({ ...f, staffType: '' }))} className="hover:opacity-70">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {activeFilters.subject && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Subject: {activeFilters.subject}
              <button onClick={() => setActiveFilters(f => ({ ...f, subject: '' }))} className="hover:opacity-70">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {activeFilters.status && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {activeFilters.status}
              <button onClick={() => setActiveFilters(f => ({ ...f, status: '' }))} className="hover:opacity-70">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-text-muted hover:text-danger transition-colors">Clear all</button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredTeachers}
        searchPlaceholder="Search staff..."
        onRowClick={(row) => setSelectedTeacher(row)}
        actions={
          <div className="relative" ref={filterRef}>
            <button onClick={() => setFilterOpen(v => !v)} className="btn-secondary flex items-center gap-2 text-sm">
              <FunnelIcon className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[10px] font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {filterOpen && (
              <div
                className="fixed z-[999] w-64 bg-white border border-border rounded-xl shadow-xl p-4 space-y-3"
                style={{
                  top: filterRef.current ? filterRef.current.getBoundingClientRect().bottom + 6 : 'auto',
                  right: typeof window !== 'undefined' ? window.innerWidth - (filterRef.current ? filterRef.current.getBoundingClientRect().right : 0) : 0,
                }}
              >
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Filter staff</p>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Staff Type</label>
                  <select value={filterStaffType} onChange={e => setFilterStaffType(e.target.value)} className="input-field text-sm">
                    <option value="">All</option>
                    <option value="teaching">Teaching</option>
                    <option value="non-teaching">Non-Teaching</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Subject</label>
                  <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="input-field text-sm">
                    <option value="">All subjects</option>
                    {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm">
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

      {/* Teacher Detail Panel */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedTeacher(null)} />
          <div className="ml-auto relative w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-text-primary">Staff Details</h3>
              <button onClick={() => setSelectedTeacher(null)} className="p-1 hover:bg-gray-100 rounded">
                <XMarkIcon className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedTeacher.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-text-primary">{selectedTeacher.name}</h4>
                  <p className="text-sm text-text-secondary">Employee ID: {selectedTeacher.employee_id || selectedTeacher.id}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Staff Type" value={selectedTeacher.staff_type === 'non-teaching' ? 'Non-Teaching' : 'Teaching'} />
                <InfoItem label="Role" value={selectedTeacher.role || '-'} />
                <InfoItem label="Subject" value={selectedTeacher.subject || '-'} />
                <InfoItem label="Experience" value={selectedTeacher.experience ? `${selectedTeacher.experience} yrs` : '-'} />
                <InfoItem label="Qualification" value={selectedTeacher.qualification || '-'} />
                <InfoItem label="Status" value={selectedTeacher.is_active === true || selectedTeacher.is_active === 'active' ? 'Active' : 'Inactive'} />
                <InfoItem label="Classes" value={Array.isArray(selectedTeacher.classes) ? selectedTeacher.classes.join(', ') : selectedTeacher.classes || '-'} />
                <InfoItem label="Joining Date" value={selectedTeacher.joining_date ? new Date(selectedTeacher.joining_date).toLocaleDateString() : '-'} />
              </div>

              <hr className="border-border" />

              {/* Contact Info */}
              <div>
                <h5 className="text-sm font-semibold text-text-primary mb-3">Contact Information</h5>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Phone" value={selectedTeacher.phone || '-'} />
                  <InfoItem label="Email" value={selectedTeacher.email || '-'} />
                </div>
              </div>

              <hr className="border-border" />

              {/* Actions (read only context — edit only) */}
              <div className="flex gap-3">
                <button
                  onClick={() => { handleEdit(selectedTeacher); setSelectedTeacher(null); }}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <PencilIcon className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => handleResendPassword(selectedTeacher.id)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <EnvelopeIcon className="w-4 h-4" /> Resend Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTeacher ? 'Edit Staff' : 'Staff Details'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingTeacher && (
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Teacher ID *</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                className="input-field"
                placeholder="e.g. TCH001"
                required
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Classes</label>
              <input
                type="text"
                value={formData.classes}
                onChange={(e) => setFormData({ ...formData, classes: e.target.value })}
                placeholder="e.g., 10-A, 10-B"
                className="input-field"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingTeacher ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value, span2 }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}
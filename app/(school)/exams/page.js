'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function ExamsPage() {
  const [examTypes, setExamTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', max_marks: '', description: '' });

  useEffect(() => {
    fetchExamTypes();
  }, []);

  async function fetchExamTypes() {
    try {
      setExamTypes((await api.getExamTypes()) || []);
    } catch (err) {
      console.warn('Failed to fetch exam types:', err.message);
      setExamTypes([]);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.createExamType({
        name: formData.name.trim(),
        max_marks: formData.max_marks ? Number(formData.max_marks) : undefined,
      });
      setModalOpen(false);
      setFormData({ name: '', max_marks: '', description: '' });
      fetchExamTypes();
    } catch (err) {
      alert(err.message || 'Failed to create exam type');
    }
  }

  const columns = [
    { key: 'name', label: 'Exam Name' },
    { key: 'max_marks', label: 'Max Marks', render: (val) => val || '—' },
    { key: 'academic_year', label: 'Academic Year', render: (val) => val || '—' },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => <Badge variant={val === false ? 'neutral' : 'success'}>{val === false ? 'Inactive' : 'Active'}</Badge>,
    },
  ];

  const currentYear = examTypes.find((e) => e.academic_year)?.academic_year;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Exams</h2>
          <p className="text-text-secondary text-sm mt-1">Exams of the academic year (e.g. Unit Test 1, Half Yearly)</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-text-secondary">Total Exam Types</p>
          <p className="text-xl font-bold text-text-primary mt-1">{examTypes.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-secondary">Active</p>
          <p className="text-xl font-bold text-success mt-1">{examTypes.filter((e) => e.is_active !== false).length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-secondary">Academic Year</p>
          <p className="text-xl font-bold text-primary mt-1">{currentYear || '—'}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={Array.isArray(examTypes) ? examTypes : []}
        searchPlaceholder="Search exam types..."
        actions={
          <button
            onClick={() => { setFormData({ name: '', max_marks: '', description: '' }); setModalOpen(true); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <PlusIcon className="w-4 h-4" /> Add
          </button>
        }
      />

      {/* Add Exam Type Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Exam Type">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Exam Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Unit Test 1, Mid Term, Final"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Max Marks *</label>
            <input
              type="number"
              value={formData.max_marks}
              onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
              className="input-field"
              placeholder="e.g. 100"
              min={1}
              max={1000}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

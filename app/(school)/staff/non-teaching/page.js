'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { shareSetupLink } from '@/lib/setupLink';

const nonTeachingRoles = ['Warden', 'Office Staff', 'Accountant', 'Security Guard', 'Sports Coach', 'Librarian'];

export default function NonTeachingStaffPage() {
  const router = useRouter();
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [formData, setFormData] = useState({
    name:          '',
    role:          '',
    aadhaar:       '',
    employeeId:    '',
    experience:    '',
    qualification: '',
    email:         '',
    phone:         '',
    joiningDate:   new Date().toISOString().split('T')[0],
  });

  const handleChange = (field, value) => {
    if (field === 'aadhaar') {
      const digits = value.replace(/\D/g, '').slice(0, 12);
      setFormData((prev) => ({
        ...prev,
        aadhaar: digits,
        employeeId: digits.length === 12 ? `EMP${digits.slice(-4)}` : '',
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name  = 'Name is required';
    if (!formData.role)        errs.role  = 'Role is required';
    if (!formData.aadhaar)     errs.aadhaar = 'Aadhaar is required';
    else if (!/^\d{12}$/.test(formData.aadhaar)) errs.aadhaar = 'Aadhaar must contain 12 digits';
    if (!formData.qualification.trim()) errs.qualification = 'Qualification is required';
    if (formData.experience === '') errs.experience = 'Experience is required';
    if (!formData.joiningDate) errs.joiningDate = 'Joining date is required';
    if (!formData.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^\d{10,15}$/.test(formData.phone.replace(/[+\-\s]/g, ''))) errs.phone = 'Invalid phone number';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Invalid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await api.createTeacher({
        name:          formData.name,
        aadhaar:       formData.aadhaar,
        employee_id:   formData.employeeId,
        staff_type:    'non-teaching',
        role:          formData.role,
        experience:    formData.experience ? parseInt(formData.experience) : null,
        qualification: formData.qualification || null,
        email:         formData.email || null,
        phone:         formData.phone,
        joining_date:  formData.joiningDate || undefined,
      });
      shareSetupLink(result, 'staff member');
      router.push('/staff');
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save. Please try again.' });
    }
    setSaving(false);
  };

  const SectionTitle = ({ title }) => (
    <div className="border-b border-border pb-2 mb-4">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeftIcon className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <UserGroupIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Add Non-Teaching Staff</h2>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{errors.submit}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 1. Staff Information */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title="1. Staff Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Full Name *</label>
              <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)}
                className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="Full name" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Role *</label>
              <select value={formData.role} onChange={e => handleChange('role', e.target.value)}
                className={`input-field ${errors.role ? 'border-red-400' : ''}`}>
                <option value="" disabled hidden>Select role</option>
                {nonTeachingRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
            </div>
          </div>
        </div>

        {/* 2. Professional Details */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title="2. Professional Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Qualification <span className="text-red-500">*</span></label>
              <input type="text" value={formData.qualification} onChange={e => handleChange('qualification', e.target.value)}
                className={`input-field ${errors.qualification ? 'border-red-400' : ''}`} placeholder="e.g. B.Com, 12th Pass" />
              {errors.qualification && <p className="text-xs text-red-500 mt-1">{errors.qualification}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Experience (years) <span className="text-red-500">*</span></label>
              <input type="number" value={formData.experience} onChange={e => handleChange('experience', e.target.value)}
                className={`input-field ${errors.experience ? 'border-red-400' : ''}`} placeholder="e.g. 3" min="0" max="50" />
              {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Joining Date <span className="text-red-500">*</span></label>
              <input type="date" value={formData.joiningDate} onChange={e => handleChange('joiningDate', e.target.value)}
                className={`input-field ${errors.joiningDate ? 'border-red-400' : ''}`} />
              {errors.joiningDate && <p className="text-xs text-red-500 mt-1">{errors.joiningDate}</p>}
            </div>
          </div>
        </div>

        {/* 3. Contact Information */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title="3. Contact Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Aadhaar Number *</label>
              <input
                type="text"
                value={formData.aadhaar}
                onChange={e => handleChange('aadhaar', e.target.value)}
                className={`input-field ${errors.aadhaar ? 'border-red-400' : ''}`}
                placeholder="123456789012"
                maxLength={12}
              />
              {errors.aadhaar && <p className="text-xs text-red-500 mt-1">{errors.aadhaar}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Employee ID</label>
              <input
                type="text"
                value={formData.employeeId || 'Auto Generated'}
                readOnly
                className={`input-field bg-gray-100 cursor-not-allowed ${formData.employeeId ? 'text-text-primary' : 'text-gray-400'}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Phone *</label>
              <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)}
                className={`input-field ${errors.phone ? 'border-red-400' : ''}`} placeholder="10-digit number" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Email <span className="text-text-muted font-normal">(optional)</span></label>
              <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)}
                className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="staff@school.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-border p-4 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Staff'}
          </button>
        </div>

      </form>
    </div>
  );
}

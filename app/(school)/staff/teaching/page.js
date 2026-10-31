'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { shareSetupLink } from '@/lib/setupLink';

const teachingRoles  = ['Teacher', 'HOD', 'Lab Assistant', 'Vice Principal', 'Principal', 'Correspondent'];
const classNumbers   = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const sections       = ['A','B','C','D','E'];
const rolesWithSubject  = ['Teacher', 'HOD', 'Lab Assistant'];
const rolesWithClasses  = ['Teacher', 'HOD'];

export default function TeachingStaffPage() {
  const router = useRouter();
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});
  const [subjects, setSubjects] = useState([]);
  const [sectionOpen, setSectionOpen] = useState(false);
  const sectionRef = useRef(null);
  const [formData, setFormData] = useState({
    name:          '',
    role:          '',
    aadhaar:       '',
    employeeId:    '',
    subject:       '',
    classes:       [],
    _selectedClass:   '',
    experience:    '',
    qualification: '',
    email:         '',
    phone:         '',
    joiningDate:   new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    api.getSubjects().then(res => {
      setSubjects(Array.isArray(res) ? res : res?.data || []);
    }).catch(() => setSubjects([]));

    function handleClickOutside(e) {
      if (sectionRef.current && !sectionRef.current.contains(e.target)) {
        setSectionOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSubject = rolesWithSubject.includes(formData.role);
  const showClasses = rolesWithClasses.includes(formData.role);

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
    if (!formData.name.trim())        errs.name        = 'Name is required';
    if (!formData.role)               errs.role        = 'Role is required';
    if (!formData.aadhaar)            errs.aadhaar     = 'Aadhaar is required';
    else if (!/^\d{12}$/.test(formData.aadhaar)) errs.aadhaar = 'Aadhaar must contain 12 digits';
    if (showSubject && !formData.subject) errs.subject = 'Subject is required for this role';
    if (showClasses && formData.classes.length === 0) errs.classes = 'Select at least one class';
    if (!formData.qualification.trim()) errs.qualification = 'Qualification is required';
    if (formData.experience === '') errs.experience = 'Experience is required';
    if (!formData.joiningDate) errs.joiningDate = 'Joining date is required';
    if (!formData.email.trim())       errs.email       = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Invalid email';
    if (!formData.phone.trim())       errs.phone       = 'Phone is required';
    else if (!/^\d{10,15}$/.test(formData.phone.replace(/[+\-\s]/g, ''))) errs.phone = 'Invalid phone number';
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
        staff_type:    'teaching',
        role:          formData.role,
        subject:       showSubject ? formData.subject : null,
        classes:       showClasses ? formData.classes : [],
        experience:    formData.experience ? parseInt(formData.experience) : null,
        qualification: formData.qualification || null,
        email:         formData.email,
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
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <AcademicCapIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Add Teaching Staff</h2>
            <p className="text-text-secondary text-sm mt-0.5">Teacher, HOD, Lab Assistant, Vice Principal, Principal, Correspondent</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {teachingRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
            </div>
            {showSubject && (
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">Subject *</label>
                <select value={formData.subject} onChange={e => handleChange('subject', e.target.value)}
                  className={`input-field ${errors.subject ? 'border-red-400' : ''}`}>
                  <option value="" disabled hidden>Select subject</option>
                  {subjects.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                </select>
                {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
              </div>
            )}
          </div>
        </div>

        {/* 2. Assigned Classes — only for Teacher and HOD */}
        {showClasses && (
          <div className="bg-white rounded-xl border border-border p-6">
            <SectionTitle title="2. Assigned Classes *" />
            {errors.classes && <p className="text-xs text-red-500 mb-3">{errors.classes}</p>}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-text-secondary mb-1 block">Class</label>
                <select
                  value={formData._selectedClass || ''}
                  onChange={e => setFormData(prev => ({ ...prev, _selectedClass: e.target.value }))}
                  className="input-field"
                >
                  <option value="" disabled>Select class</option>
                  {classNumbers.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="flex-1" ref={sectionRef}>
                <label className="text-sm font-medium text-text-secondary mb-1 block">Section</label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={!formData._selectedClass}
                    onClick={() => setSectionOpen(v => !v)}
                    className="input-field text-left flex items-center justify-between w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className={formData._selectedClass ? 'text-text-primary' : 'text-text-muted'}>
                      {formData._selectedClass ? 'Pick sections' : 'Select class first'}
                    </span>
                    <span className="text-text-tertiary text-xs ml-2">▾</span>
                  </button>
                  {sectionOpen && formData._selectedClass && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-border rounded-xl shadow-lg z-50 p-2 flex flex-col gap-1">
                      {sections.map(s => {
                        const val = `${formData._selectedClass}-${s}`;
                        const selected = formData.classes.includes(val);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              if (selected) {
                                setFormData(prev => ({ ...prev, classes: prev.classes.filter(c => c !== val) }));
                              } else {
                                setFormData(prev => ({ ...prev, classes: [...prev.classes, val] }));
                                if (errors.classes) setErrors(prev => ({ ...prev, classes: undefined }));
                              }
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selected
                                ? 'bg-primary text-white'
                                : 'hover:bg-gray-50 text-text-primary'
                            }`}
                          >
                            <span>Section {s}</span>
                            {selected && <span className="text-xs">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected classes as removable chips */}
            {formData.classes.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-4">
                {formData.classes.sort().map(cls => (
                  <span key={cls} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                    Class {cls}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, classes: prev.classes.filter(c => c !== cls) }))}
                      className="hover:opacity-70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted mt-3">No classes added yet — select a class then a section</p>
            )}
          </div>
        )}

        {/* 3. Professional Details */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title={showClasses ? '3. Professional Details' : '2. Professional Details'} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Qualification *</label>
              <input type="text" value={formData.qualification} onChange={e => handleChange('qualification', e.target.value)}
                className={`input-field ${errors.qualification ? 'border-red-400' : ''}`} placeholder="e.g. M.Sc, B.Ed" />
              {errors.qualification && <p className="text-xs text-red-500 mt-1">{errors.qualification}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Experience (years) *</label>
              <input type="number" value={formData.experience} onChange={e => handleChange('experience', e.target.value)}
                className={`input-field ${errors.experience ? 'border-red-400' : ''}`} placeholder="e.g. 5" min="0" max="50" />
              {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Joining Date *</label>
              <input type="date" value={formData.joiningDate} onChange={e => handleChange('joiningDate', e.target.value)}
                className={`input-field ${errors.joiningDate ? 'border-red-400' : ''}`} />
              {errors.joiningDate && <p className="text-xs text-red-500 mt-1">{errors.joiningDate}</p>}
            </div>
          </div>
        </div>

        {/* 4. Contact Information */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title={showClasses ? '4. Contact Information' : '3. Contact Information'} />
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
              <label className="text-sm font-medium text-text-secondary mb-1 block">Email *</label>
              <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)}
                className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="staff@school.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Phone *</label>
              <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)}
                className={`input-field ${errors.phone ? 'border-red-400' : ''}`} placeholder="10-digit number" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
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

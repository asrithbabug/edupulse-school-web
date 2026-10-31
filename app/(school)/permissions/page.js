'use client';

import { useState, useEffect } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

const MODULES = [
  { id: 'attendance', name: 'Attendance' },
  { id: 'marks', name: 'Marks' },
  { id: 'homework', name: 'Homework' },
  { id: 'announcements', name: 'Announcements' },
  { id: 'materials', name: 'Materials' },
  { id: 'leave', name: 'Leave' },
  { id: 'chat', name: 'Chat' },
  { id: 'class_log', name: 'Class Log' },
  { id: 'timetable', name: 'Timetable' },
  { id: 'reports', name: 'Reports' },
];

export default function PermissionsPage() {
  const [teachers, setTeachers] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [staff, permissionMap] = await Promise.all([api.getTeachers(), api.getAllPermissions()]);
        setTeachers((staff?.data || []).filter((t) => t.is_active !== false));
        setPermissions(permissionMap || {});
      } catch (err) {
        console.error('Failed to load permissions:', err);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const togglePermission = (teacherId, moduleId) => {
    setPermissions(prev => {
      const current = prev[teacherId]?.[moduleId] || { can_view: true, can_edit: true };
      const isEnabled = current.can_view && current.can_edit;
      return {
        ...prev,
        [teacherId]: {
          ...prev[teacherId],
          [moduleId]: { can_view: !isEnabled, can_edit: !isEnabled },
        },
      };
    });
  };

  const savePermissions = async (teacherId) => {
    setSaving(teacherId);
    setMessage('');
    try {
      const teacherPerms = permissions[teacherId] || {};
      const payload = MODULES.map(m => ({
        module_id: m.id,
        can_view: teacherPerms[m.id]?.can_view ?? true,
        can_edit: teacherPerms[m.id]?.can_edit ?? true,
      }));

      await api.updateTeacherPermissions(teacherId, payload);
      setMessage(`Permissions saved for ${teacherId}`);
    } catch (err) {
      setMessage(`Error: ${err.message || 'Failed to save permissions'}`);
    }
    setSaving(null);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShieldCheckIcon className="w-7 h-7 text-primary" />
            Teacher Permissions
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Manage module access for each teacher
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-text-primary sticky left-0 bg-gray-50 min-w-[180px]">
                Teacher
              </th>
              {MODULES.map(m => (
                <th key={m.id} className="px-3 py-3 font-medium text-text-secondary text-center min-w-[90px]">
                  <span className="text-xs">{m.name}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center min-w-[90px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher, idx) => (
              <tr key={teacher.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3 font-medium text-text-primary sticky left-0 bg-inherit">
                  <div>{teacher.name}</div>
                  <div className="text-xs text-text-secondary">{teacher.id}</div>
                </td>
                {MODULES.map(m => {
                  const perm = permissions[teacher.id]?.[m.id];
                  const isEnabled = perm?.can_view && perm?.can_edit;
                  return (
                    <td key={m.id} className="px-3 py-3 text-center">
                      <button
                        onClick={() => togglePermission(teacher.id, m.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          isEnabled ? 'bg-primary' : 'bg-gray-300'
                        }`}
                        aria-label={`Toggle ${m.name} for ${teacher.name}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                          }`}
                          style={{ transform: isEnabled ? 'translateX(18px)' : 'translateX(3px)' }}
                        />
                      </button>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => savePermissions(teacher.id)}
                    disabled={saving === teacher.id}
                    className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {saving === teacher.id ? 'Saving...' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {teachers.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            No teachers found. Add teachers first.
          </div>
        )}
      </div>
    </div>
  );
}

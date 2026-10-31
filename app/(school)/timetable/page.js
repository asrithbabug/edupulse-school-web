'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Suggested times: periods of 45 minutes from 09:00, with a 15-minute break after period 4. */
function defaultTimes(period) {
  const start = 9 * 60 + (period - 1) * 45 + (period > 4 ? 15 : 0);
  const fmt = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return { start_time: fmt(start), end_time: fmt(start + 45) };
}

const emptySlot = (day = 1, period = 1) => ({ id: null, day, period, subject: '', teacher_id: '', room: '', ...defaultTimes(period) });

/** "10-A" → { classNum: '10', section: 'A' }; "10" → { classNum: '10', section: '' }. */
function splitClass(value) {
  const [classNum, section = ''] = String(value).split('-');
  return { classNum, section };
}

export default function TimetablePage() {
  const [classes, setClasses] = useState([]);
  const [classNum, setClassNum] = useState('');
  const [section, setSection] = useState('');
  const [timetable, setTimetable] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slotForm, setSlotForm] = useState(emptySlot());

  useEffect(() => {
    async function loadOptions() {
      try {
        const [classOptions, subjectList, staff] = await Promise.all([
          api.getClassOptions(),
          api.getSubjects().catch(() => []),
          api.getTeachers().catch(() => ({ data: [] })),
        ]);
        setClasses(classOptions);
        if (classOptions[0]) {
          const first = splitClass(classOptions[0]);
          setClassNum(first.classNum);
          setSection(first.section);
        }
        setSubjects((subjectList || []).filter((s) => s.is_active !== false));
        setTeachers((staff?.data || []).filter((t) => t.is_active !== false && t.staff_type !== 'non-teaching'));
      } catch (err) {
        console.warn('Failed to load timetable options:', err.message);
      }
      setLoading(false);
    }
    loadOptions();
  }, []);

  // Timetables are keyed by the combined class ("10-A", or "10" when the class has no section),
  // matching how students are stored.
  const selectedClass = section ? `${classNum}-${section}` : classNum;
  const classNums = [...new Set(classes.map((c) => splitClass(c).classNum))];
  const classSections = classes.map(splitClass).filter((c) => c.classNum === classNum).map((c) => c.section);
  const sectionOptions = classSections.filter(Boolean);
  const allowNoSection = classSections.includes('');

  function handleClassChange(value) {
    setClassNum(value);
    const sections = classes.map(splitClass).filter((c) => c.classNum === value).map((c) => c.section);
    setSection(sections.includes('') ? '' : sections[0] || '');
  }

  const fetchTimetable = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const result = await api.getTimetable(selectedClass);
      setTimetable(result?.timetable || {});
    } catch (err) {
      console.warn('Failed to fetch timetable:', err.message);
      setTimetable({});
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  function getSlot(day, period) {
    const daySlots = timetable[day] || timetable[String(day)] || [];
    return Array.isArray(daySlots) ? daySlots.find((s) => Number(s.period) === period) : null;
  }

  function openSlotModal(day, period) {
    const existing = getSlot(day, period);
    setSlotForm(existing
      ? {
          id: existing.id,
          day,
          period,
          subject: existing.subject || '',
          teacher_id: existing.teacher_id || '',
          room: existing.room || '',
          start_time: existing.start_time || defaultTimes(period).start_time,
          end_time: existing.end_time || defaultTimes(period).end_time,
        }
      : emptySlot(day, period));
    setModalOpen(true);
  }

  async function handleSaveSlot(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveTimetableSlot({
        class: selectedClass,
        day_of_week: slotForm.day,
        period: slotForm.period,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        subject: slotForm.subject.trim(),
        teacher_id: slotForm.teacher_id || null,
        room: slotForm.room || null,
      });
      setModalOpen(false);
      fetchTimetable();
    } catch (err) {
      alert(err.message || 'Failed to save timetable slot');
    }
    setSaving(false);
  }

  async function handleRemoveSlot() {
    if (!slotForm.id || !confirm('Remove this period from the timetable?')) return;
    try {
      await api.deleteTimetableSlot(slotForm.id);
      setModalOpen(false);
      fetchTimetable();
    } catch (err) {
      alert(err.message || 'Failed to remove the period');
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Timetable</h2>
          <p className="text-text-secondary text-sm mt-1">Manage class schedules</p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="card text-sm text-text-secondary">
          Admit students first: classes appear here once students are assigned to them.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-text-secondary">Class:</label>
            <select value={classNum} onChange={(e) => handleClassChange(e.target.value)} className="input-field w-auto">
              {classNums.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="text-sm font-medium text-text-secondary">Section:</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={sectionOptions.length === 0}
              className="input-field w-auto disabled:opacity-60"
            >
              {(allowNoSection || sectionOptions.length === 0) && <option value="">No section</option>}
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider w-20">Period</th>
                    {DAYS.map((day) => (
                      <th key={day} className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => (
                    <tr key={period} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-text-primary">P{period}</td>
                      {DAYS.map((day, dayIndex) => {
                        const slot = getSlot(dayIndex + 1, period);
                        return (
                          <td key={day} className="px-2 py-2 text-center">
                            <button
                              onClick={() => openSlotModal(dayIndex + 1, period)}
                              className={`w-full min-h-[60px] rounded-lg border border-border p-2 text-xs transition-colors hover:border-primary/50 hover:bg-primary/5 ${slot ? 'bg-primary/5' : 'bg-white'}`}
                            >
                              {slot ? (
                                <>
                                  <p className="font-medium text-text-primary">{slot.subject}</p>
                                  <p className="text-text-muted mt-0.5">{slot.teacher_name || ''}</p>
                                  <p className="text-text-muted">{slot.start_time}–{slot.end_time}</p>
                                </>
                              ) : (
                                <span className="text-text-muted"><PlusIcon className="w-4 h-4 mx-auto" /></span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${selectedClass}: ${DAYS[slotForm.day - 1]}, period ${slotForm.period}`}>
        <form onSubmit={handleSaveSlot} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Start time *</label>
              <input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">End time *</label>
              <input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Subject *</label>
            <input
              type="text"
              value={slotForm.subject}
              onChange={(e) => setSlotForm({ ...slotForm, subject: e.target.value })}
              className="input-field"
              placeholder="e.g. Mathematics"
              list="subjects-list"
              maxLength={50}
              required
            />
            <datalist id="subjects-list">
              {subjects.map((s) => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Teacher</label>
              <select value={slotForm.teacher_id} onChange={(e) => setSlotForm({ ...slotForm, teacher_id: e.target.value })} className="input-field">
                <option value="">Not assigned</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Room</label>
              <input type="text" value={slotForm.room} onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })} className="input-field" maxLength={20} />
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-4">
            <div>
              {slotForm.id && (
                <button type="button" onClick={handleRemoveSlot} className="text-sm text-danger hover:underline">Remove period</button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

const EVENT_TYPES = [
  { value: 'holiday', label: 'Holiday', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'event', label: 'Event', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'exam', label: 'Exam', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'half_day', label: 'Half Day', color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({ title: '', date: '', type: 'holiday', description: '' });

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth, currentYear]);

  async function fetchCalendar() {
    setLoading(true);
    try {
      setEvents((await api.getAcademicCalendar(currentMonth, currentYear)) || []);
    } catch (err) {
      console.warn('Failed to fetch calendar:', err.message);
      setEvents([]);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.createCalendarEvent({ ...formData, description: formData.description || undefined });
      setModalOpen(false);
      setFormData({ title: '', date: '', type: 'holiday', description: '' });
      fetchCalendar();
    } catch (err) {
      alert(err.message || 'Failed to create event');
    }
  }

  async function handleDeleteEvent(event) {
    if (!confirm(`Delete "${event.title}" on ${event.date}?`)) return;
    try {
      await api.deleteCalendarEvent(event.id);
      fetchCalendar();
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  }

  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  function getEventTypeStyle(type) {
    const found = EVENT_TYPES.find((t) => t.value === type);
    return found ? found.color : 'bg-gray-100 text-gray-700 border-gray-200';
  }

  function getEventsForDate(day) {
    return (Array.isArray(events) ? events : []).filter((ev) => {
      const evDate = new Date(ev.date);
      return evDate.getDate() === day && evDate.getMonth() + 1 === currentMonth && evDate.getFullYear() === currentYear;
    });
  }

  // Build calendar grid
  function buildCalendarDays() {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const days = [];

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }

  const calendarDays = buildCalendarDays();
  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();

  // Upcoming events (from today onward)
  const upcomingEvents = (Array.isArray(events) ? events : [])
    .filter((ev) => new Date(ev.date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Academic Calendar</h2>
          <p className="text-text-secondary text-sm mt-1">Manage holidays, events, and schedules</p>
        </div>
        <button
          onClick={() => { setFormData({ title: '', date: '', type: 'holiday', description: '' }); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusIcon className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Type Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {EVENT_TYPES.map((t) => (
          <span key={t.value} className={`px-2 py-1 rounded-md text-xs font-medium border ${t.color}`}>
            {t.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month View */}
        <div className="lg:col-span-2 card">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeftIcon className="w-5 h-5 text-text-secondary" />
            </button>
            <h3 className="text-lg font-semibold text-text-primary">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRightIcon className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-text-muted py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="min-h-[70px]" />;
              const dayEvents = getEventsForDate(day);
              return (
                <div
                  key={day}
                  className={`min-h-[70px] p-1 rounded-lg border transition-colors ${
                    isToday(day)
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:border-border hover:bg-gray-50'
                  }`}
                >
                  <p className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-primary' : 'text-text-primary'}`}>
                    {day}
                  </p>
                  {dayEvents.slice(0, 2).map((ev, i) => (
                    <div
                      key={ev.id || i}
                      className={`text-[10px] px-1 py-0.5 rounded truncate mb-0.5 ${getEventTypeStyle(ev.type)}`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-text-muted">+{dayEvents.length - 2} more</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {upcomingEvents.length > 0 ? upcomingEvents.map((ev, idx) => (
              <div key={ev.id || idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  ev.type === 'holiday' ? 'bg-red-500' :
                  ev.type === 'event' ? 'bg-blue-500' :
                  ev.type === 'exam' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate">{ev.title}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' • '}
                    <span className={`${
                      ev.type === 'holiday' ? 'text-red-600' :
                      ev.type === 'event' ? 'text-blue-600' :
                      ev.type === 'exam' ? 'text-purple-600' :
                      'text-orange-600'
                    }`}>
                      {ev.type === 'half_day' ? 'Half Day' : ev.type?.charAt(0).toUpperCase() + ev.type?.slice(1)}
                    </span>
                  </p>
                </div>
                <button onClick={() => handleDeleteEvent(ev)} className="text-xs text-text-muted hover:text-danger" title="Delete">
                  Delete
                </button>
              </div>
            )) : (
              <p className="text-sm text-text-muted">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Holiday/Event">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g. Republic Day, Annual Day"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input-field"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Optional description..."
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

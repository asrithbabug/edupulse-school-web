'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';


export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState(['All']);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = `date=${selectedDate}${classFilter !== 'All' ? `&class=${classFilter}` : ''}`;
        const [studentResult, attendanceResult] = await Promise.all([
          api.getStudents(),
          api.getAttendance(params),
        ]);
        const students = studentResult?.data || (Array.isArray(studentResult) ? studentResult : []);
        const classNames = [...new Set(students.map((s) => s.class).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setClasses(['All', ...classNames]);
        const records = attendanceResult?.data || (Array.isArray(attendanceResult) ? attendanceResult : []);
        const recordsByStudent = new Map(records.map((record) => [record.student_id, record]));

        setAttendance(students.map((student) => {
          const record = recordsByStudent.get(student.id);
          return {
            ...student,
            student_id: student.id,
            student_name: student.name,
            status: record?.status || 'not_marked',
            date: selectedDate,
          };
        }));
      } catch (err) {
        console.warn('Failed to fetch attendance:', err.message);
        setAttendance([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [selectedDate, classFilter]);

  const filteredAttendance = classFilter === 'All'
    ? attendance
    : attendance.filter((a) => a.class === classFilter);

  const statusVariant = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'danger';
      case 'late': return 'warning';
      case 'not_marked': return 'neutral';
      default: return 'neutral';
    }
  };

  const columns = [
    { key: 'student_name', label: 'Student Name' },
    { key: 'class', label: 'Class' },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={statusVariant(val)}>
          {val === 'not_marked' ? 'Not marked' : val ? val.charAt(0).toUpperCase() + val.slice(1) : 'N/A'}
        </Badge>
      ),
    },
  ];

  // Stats
  const total = filteredAttendance.length;
  const present = filteredAttendance.filter((a) => a.status === 'present').length;
  const absent = filteredAttendance.filter((a) => a.status === 'absent').length;
  const late = filteredAttendance.filter((a) => a.status === 'late').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Attendance</h2>
        <p className="text-text-secondary text-sm mt-1">View and manage attendance records</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1 block">Class</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="input-field"
          >
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-text-primary">{total}</p>
          <p className="text-xs text-text-muted">Total</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-success">{present}</p>
          <p className="text-xs text-text-muted">Present</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-danger">{absent}</p>
          <p className="text-xs text-text-muted">Absent</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-warning">{late}</p>
          <p className="text-xs text-text-muted">Late</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAttendance}
        searchPlaceholder="Search by student name..."
      />
    </div>
  );
}

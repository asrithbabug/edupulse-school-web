'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, AcademicCapIcon, ClipboardDocumentCheckIcon, CurrencyDollarIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import StatCard from '@/components/StatCard';
import { ChartBar } from '@/components/Chart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';


export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, schoolRes] = await Promise.all([
          api.getAdminDashboard(),
          api.getSchoolProfile(),
        ]);
        setData(dashRes || null);
        setSchool(schoolRes || null);
      } catch (err) {
        console.warn('Failed to fetch dashboard:', err.message);
        setData(null);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  // Safe access with defaults - API returns snake_case keys
  const d = data || {};
  const totalStudents = d.total_students || d.totalStudents || 0;
  const totalTeachers = d.total_teachers || d.totalTeachers || 0;
  const attendanceRate = d.attendance_today?.percentage || d.attendanceRate || 0;
  const feesCollected = d.fees?.collected || d.feesCollected || 0;
  const feesTotal = d.fees?.total || d.feesTotal || 0;
  const attendanceChart = d.attendanceChart || d.attendance_chart || [];
  const recentActivity = d.recentActivity || d.recent_activity || [];

  // School details
  const schoolName = school?.name || school?.school_name || 'My School';
  const schoolCity = school?.city || school?.address?.city || '';
  const schoolCode = school?.code || school?.school_code || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
        <p className="text-text-secondary text-sm mt-1">Welcome back! Here&apos;s your school overview.</p>
      </div>

      {/* School Details Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
            <BuildingOffice2Icon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{schoolName}</h3>
            <p className="text-sm text-text-secondary">
              {schoolCity}{schoolCity && schoolCode ? ' • ' : ''}{schoolCode ? `Code: ${schoolCode}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={UserGroupIcon}
          label="Total Students"
          value={totalStudents.toLocaleString()}
          trend="+12 this month"
          trendUp={true}
        />
        <StatCard
          icon={AcademicCapIcon}
          label="Total Teachers"
          value={totalTeachers}
          trend="+2 this month"
          trendUp={true}
        />
        <StatCard
          icon={ClipboardDocumentCheckIcon}
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          trend="+1.2% vs last week"
          trendUp={true}
        />
        <StatCard
          icon={CurrencyDollarIcon}
          label="Fees Collected"
          value={feesTotal > 0 ? `₹${(feesCollected / 100000).toFixed(1)}L` : '₹0'}
          trend={feesTotal > 0 ? `of ₹${(feesTotal / 100000).toFixed(1)}L total` : 'No fees configured'}
          trendUp={true}
        />
      </div>

      {/* Chart and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartBar
            data={attendanceChart}
            dataKey="rate"
            xKey="day"
            title="Weekly Attendance Rate (%)"
            height={280}
          />
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((item, idx) => (
              <div key={item.id || idx} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-text-primary">{item.text}</p>
                  <p className="text-xs text-text-muted mt-0.5">{item.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-text-muted">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

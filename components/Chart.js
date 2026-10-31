'use client';

import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  primary: '#5B5FC7',
  success: '#12B76A',
  warning: '#F79009',
  danger: '#F04438',
  secondary: '#7C3AED',
};

export function ChartLine({ data, dataKey, xKey = 'name', color = 'primary', height = 300, title }) {
  return (
    <div className="card">
      {title && <h3 className="text-sm font-medium text-text-secondary mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #EAECF0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={COLORS[color]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartBar({ data, dataKey, xKey = 'name', color = 'primary', height = 300, title }) {
  return (
    <div className="card">
      {title && <h3 className="text-sm font-medium text-text-secondary mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #EAECF0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey={dataKey} fill={COLORS[color]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartArea({ data, dataKeys, xKey = 'name', colors = ['primary', 'success', 'warning'], height = 300, title }) {
  return (
    <div className="card">
      {title && <h3 className="text-sm font-medium text-text-secondary mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#98A2B3' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #EAECF0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
          <Legend />
          {dataKeys.map((key, idx) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[colors[idx]] || COLORS.primary}
              fill={COLORS[colors[idx]] || COLORS.primary}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

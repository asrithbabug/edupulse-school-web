'use client';

export default function StatCard({ icon: Icon, label, value, trend, trendUp }) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-text-secondary mb-1">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-success' : 'text-danger'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
}

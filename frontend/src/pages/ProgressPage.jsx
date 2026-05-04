import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { dashboardAPI, behaviorAPI, mealAPI } from '../services/api.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProgressPage() {
  const [dashboard, setDashboard] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      dashboardAPI.get(),
      behaviorAPI.getScore(),
      mealAPI.getHistory(14)
    ]).then(([d, e, h]) => {
      setDashboard(d.data.dashboard);
      setEngagement(e.data);
      setHistory(h.data.history || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  const weightHistory = dashboard?.weightHistory || [];
  const weeklyData = dashboard?.weeklyData || [];

  const engScore = Math.round((engagement?.engagementScore || 0) * 100);
  const level = engagement?.engagementLevel || 'Low';
  const levelColor = level === 'High' ? 'var(--success)' : level === 'Medium' ? 'var(--warning)' : 'var(--danger)';

  const features = engagement?.features || {};

  return (
    <div>
      <div className="page-title">📈 Progress</div>
      <div className="page-subtitle">Track your fitness journey over time</div>

      {/* Engagement score */}
      <div className="card" style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>⚡ Engagement Score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 52, fontWeight: 800, color: levelColor }}>{engScore}</div>
            <div style={{ fontSize: 18, color: 'var(--text2)' }}>/100</div>
          </div>
          <span className="tag" style={{ background: `${levelColor}22`, color: levelColor }}>{level} Engagement</span>
          <div className="progress-bar" style={{ marginTop: 16, height: 10 }}>
            <div className="progress-fill" style={{ width: `${engScore}%`, background: levelColor }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: '🔥 Streak', value: `${features.streakDays || 0} days` },
            { label: '🏋️ Workout Rate', value: `${Math.round((features.workoutCompletionRate || 0) * 100)}%` },
            { label: '🍽️ Meals/day', value: (features.mealLoggingRate || 0).toFixed(1) },
            { label: '📅 Logins (7d)', value: features.loginFrequency || 0 },
          ].map(f => (
            <div key={f.label} className="flex-between" style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>{f.label}</span>
              <span style={{ fontWeight: 700 }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly calorie chart */}
      {weeklyData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>📊 Weekly Calories (Last 7 Days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                formatter={(v) => [`${v} kcal`, 'Calories']} />
              <ReferenceLine y={weeklyData[0]?.target || 2000} stroke="var(--accent)" strokeDasharray="4 4" label={{ value: 'Target', fill: 'var(--accent)', fontSize: 11 }} />
              <Bar dataKey="calories" fill="var(--accent3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight history */}
      {weightHistory.length > 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>⚖️ Weight History</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightHistory.map(w => ({ date: new Date(w.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }), weight: w.weight }))}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                formatter={(v) => [`${v} kg`, 'Weight']} />
              <Line type="monotone" dataKey="weight" stroke="var(--accent2)" strokeWidth={2} dot={{ fill: 'var(--accent2)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          {user?.profile?.targetWeight && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text2)' }}>
              Target: <strong style={{ color: 'var(--accent)' }}>{user.profile.targetWeight} kg</strong>
              {user.profile.currentWeight && ` · Current: `}
              {user.profile.currentWeight && <strong style={{ color: 'var(--text)' }}>{user.profile.currentWeight} kg</strong>}
              {user.profile.currentWeight && user.profile.targetWeight && (
                <span style={{ color: 'var(--success)', marginLeft: 8 }}>
                  ({Math.abs(user.profile.currentWeight - user.profile.targetWeight).toFixed(1)} kg to go)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Meal history */}
      {history.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>🍽️ Meal History (14 Days)</div>
          {history.map(day => (
            <div key={day.date} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex-between">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(day.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{day.meals?.length || 0} meals logged</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent4)' }}>{day.totalCalories} kcal</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>consumed</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
        {[
          { icon: '🎯', label: 'Progress Score', value: `${dashboard?.progressScore || 0}%` },
          { icon: '⚖️', label: 'Current BMI', value: user?.profile?.bmi || '—' },
          { icon: '📅', label: 'Days Active', value: features.streakDays || 0 },
          { icon: '🔥', label: 'Inactivity Gap', value: `${features.inactivityGap || 0}d` },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

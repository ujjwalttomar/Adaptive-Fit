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
    Promise.all([dashboardAPI.get(), behaviorAPI.getScore(), mealAPI.getHistory(14)])
      .then(([d, e, h]) => {
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

  const tooltipStyle = { background: 'var(--card2)', border: '1px solid var(--border2)',
    borderRadius: 10, color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13 };

  return (
    <div>
      <div className="page-title">Progress</div>
      <div className="page-subtitle">Track your fitness journey over time</div>

      {/* Engagement + stats */}
      <div className="card" style={{ marginBottom: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Engagement Score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: levelColor, lineHeight: 1 }}>{engScore}</div>
            <div style={{ fontSize: 16, color: 'var(--text2)' }}>/100</div>
          </div>
          <span className="tag" style={{ background: `${levelColor}18`, color: levelColor, marginBottom: 12, display: 'inline-flex' }}>
            {level} Engagement
          </span>
          <div className="progress-bar" style={{ marginTop: 14, height: 7 }}>
            <div className="progress-fill" style={{ width: `${engScore}%`, background: levelColor }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Streak',         value: `${features.streakDays || 0} days` },
            { label: 'Workout Rate',   value: `${Math.round((features.workoutCompletionRate || 0) * 100)}%` },
            { label: 'Meals/day',      value: (features.mealLoggingRate || 0).toFixed(1) },
            { label: 'Logins (7d)',    value: features.loginFrequency || 0 },
          ].map(f => (
            <div key={f.label} className="flex-between" style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>{f.label}</span>
              <span style={{ fontWeight: 600 }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly calories */}
      {weeklyData.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Weekly Calories</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barSize={26}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text2)', fontSize: 12, fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kcal`, 'Calories']} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <ReferenceLine y={weeklyData[0]?.target || 2000} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Bar dataKey="calories" fill="var(--accent3)" radius={[6,6,0,0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight history */}
      {weightHistory.length > 1 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Weight History</div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={weightHistory.map(w => ({
              date: new Date(w.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
              weight: w.weight
            }))}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text2)', fontSize: 11, fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto','auto']} tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, 'Weight']} />
              <Line type="monotone" dataKey="weight" stroke="var(--accent2)" strokeWidth={2} dot={{ fill: 'var(--accent2)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          {user?.profile?.targetWeight && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text2)' }}>
              Target: <strong style={{ color: 'var(--accent)' }}>{user.profile.targetWeight} kg</strong>
              {user.profile.currentWeight && <span> · Current: <strong style={{ color: 'var(--text)' }}>{user.profile.currentWeight} kg</strong></span>}
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
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Meal History — Last 14 Days</div>
          {history.map(day => (
            <div key={day.date} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex-between">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{day.meals?.length || 0} meals</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent4)', fontSize: 14 }}>{day.totalCalories}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>kcal</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 12 }}>
        {[
          { label: 'Progress Score', value: `${dashboard?.progressScore || 0}%` },
          { label: 'BMI',           value: user?.profile?.bmi || '—' },
          { label: 'Days Active',   value: features.streakDays || 0 },
          { label: 'Inactivity',    value: `${features.inactivityGap || 0}d` },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--text)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

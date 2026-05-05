import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { dashboardAPI, workoutAPI } from '../services/api.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const StatCard = ({ icon, label, value, sub, color = 'var(--accent)' }) => (
  <div className="stat-card">
    <div className="stat-card-bg-icon">{icon}</div>
    <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
    <div className="stat-number" style={{ color, marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.get().then(res => { setData(res.data.dashboard); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleGeneratePlan = async () => {
    try { await workoutAPI.generatePlan(); navigate('/workouts'); }
    catch { alert('Failed to generate plan'); }
  };

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.fullName?.split(' ')[0] || 'there';

  const calPct = Math.min(100, data?.todayNutrition?.percentage || 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {greeting}, {name}
        </div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {data?.user?.goal && <span className="tag tag-orange">{data.user.goal}</span>}
          <span>Here's your daily overview</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon="🔥" label="Calories Today"
          value={`${data?.todayNutrition?.consumed || 0}`}
          sub={`of ${data?.todayNutrition?.target || 2000} kcal`}
          color={data?.todayNutrition?.percentage > 100 ? 'var(--danger)' : 'var(--accent4)'} />
        <StatCard icon="🏋️" label="Workout"
          value={data?.todayWorkout?.isRestDay ? 'Rest' : data?.todayWorkout?.type || 'No Plan'}
          sub={data?.todayWorkout?.completed ? '✓ Completed' : data?.todayWorkout?.duration ? `~${data.todayWorkout.duration} min` : 'Not started'}
          color="var(--accent3)" />
        <StatCard icon="⚡" label="Engagement"
          value={`${data?.engagement?.score || 0}%`}
          sub={data?.engagement?.level || 'Low'}
          color={data?.engagement?.level === 'High' ? 'var(--success)' : data?.engagement?.level === 'Medium' ? 'var(--warning)' : 'var(--danger)'} />
        <StatCard icon="🔥" label="Streak"
          value={`${data?.engagement?.streak || 0}d`}
          sub="Keep it going" color="var(--accent)" />
      </div>

      {/* Calorie progress */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Daily Calorie Progress</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{data?.todayNutrition?.percentage || 0}%</div>
        </div>
        <div className="progress-bar" style={{ height: 8, marginBottom: 16 }}>
          <div className="progress-fill"
            style={{ width: `${calPct}%`, background: data?.todayNutrition?.percentage > 100 ? 'var(--danger)' : undefined }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Consumed', value: `${data?.todayNutrition?.consumed || 0}`, unit: 'kcal', color: 'var(--accent)' },
            { label: 'Remaining', value: `${Math.max(0, data?.todayNutrition?.remaining || 0)}`, unit: 'kcal', color: 'var(--success)' },
            { label: 'Target', value: `${data?.todayNutrition?.target || 2000}`, unit: 'kcal', color: 'var(--text2)' },
          ].map(i => (
            <div key={i.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: i.color }}>
                {i.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{i.label}</div>
            </div>
          ))}
        </div>
        {(data?.todayNutrition?.protein > 0 || data?.todayNutrition?.carbs > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14,
            paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Protein', value: `${data?.todayNutrition?.protein || 0}g`, color: 'var(--accent)' },
              { label: 'Carbs',   value: `${data?.todayNutrition?.carbs || 0}g`, color: 'var(--accent4)' },
              { label: 'Fats',    value: `${data?.todayNutrition?.fats || 0}g`, color: 'var(--accent3)' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Today's workout */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Today's Workout</div>
          {!data?.todayWorkout?.planExists ? (
            <div>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
                No workout plan yet. Generate one to get started!
              </p>
              <button onClick={handleGeneratePlan} className="btn btn-primary btn-sm btn-full">Generate Plan</button>
            </div>
          ) : data?.todayWorkout?.isRestDay ? (
            <div style={{ textAlign: 'center', padding: '18px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>😴</div>
              <div style={{ fontWeight: 600 }}>Rest Day</div>
              <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 4 }}>Recovery is key</div>
            </div>
          ) : (
            <div>
              <span className="tag tag-orange" style={{ marginBottom: 12, display: 'inline-flex' }}>
                {data?.todayWorkout?.type}
              </span>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, marginTop: 4 }}>
                ~{data?.todayWorkout?.duration} min · ~{data?.todayWorkout?.calories} kcal
              </div>
              {data?.todayWorkout?.completed ? (
                <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: 13 }}>✓ Completed today!</div>
              ) : (
                <button onClick={() => navigate('/workouts')} className="btn btn-primary btn-sm btn-full">
                  Start Workout
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body Stats */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Body Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Current Weight', value: `${data?.user?.currentWeight || '—'} kg` },
              { label: 'Target Weight',  value: `${data?.user?.targetWeight || '—'} kg` },
              { label: 'BMI',            value: data?.user?.bmi || '—' },
            ].map(s => (
              <div key={s.label} className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 9 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{s.label}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{s.value}</span>
              </div>
            ))}
            <button onClick={() => navigate('/profile')} className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 4 }}>
              Update Weight
            </button>
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      {data?.weeklyData?.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Weekly Calorie Intake</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.weeklyData} barSize={28}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text2)', fontSize: 12, fontFamily: 'var(--font-body)' }}
                axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--card2)', border: '1px solid var(--border2)',
                  borderRadius: 10, color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13 }}
                formatter={(v) => [`${v} kcal`, 'Calories']}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <ReferenceLine y={data?.weeklyData?.[0]?.target || 2000}
                stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Bar dataKey="calories" fill="var(--accent)" radius={[6,6,0,0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <div className="section-label">Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {[
            { label: 'Log Meal',  icon: '🍽️', path: '/meals' },
            { label: 'Workouts', icon: '🏋️', path: '/workouts' },
            { label: 'Assistant', icon: '💬', path: '/chat' },
            { label: 'Progress', icon: '📈', path: '/progress' },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.path)} className="btn btn-secondary"
              style={{ flexDirection: 'column', gap: 6, padding: '14px 12px', fontSize: 13, borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

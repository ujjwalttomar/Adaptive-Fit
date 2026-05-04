import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { dashboardAPI, workoutAPI } from '../services/api.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const StatCard = ({ icon, label, value, sub, color = 'var(--accent)' }) => (
  <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 60, opacity: 0.07 }}>{icon}</div>
    <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'Syne' }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{label}</div>
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
    catch (e) { alert('Failed to generate plan'); }
  };

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.fullName?.split(' ')[0] || 'there';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800 }}>{greeting}, {name} 👋</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
          {data?.user?.goal && <span className="tag tag-purple" style={{ marginRight: 8 }}>{data.user.goal}</span>}
          Here's your daily overview
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="🔥" label="Calories Today" value={`${data?.todayNutrition?.consumed || 0}`}
          sub={`of ${data?.todayNutrition?.target || 2000} kcal`}
          color={data?.todayNutrition?.percentage > 100 ? 'var(--danger)' : 'var(--accent4)'} />
        <StatCard icon="🏋️" label="Workout" value={data?.todayWorkout?.isRestDay ? 'Rest Day' : data?.todayWorkout?.type || 'No Plan'}
          sub={data?.todayWorkout?.completed ? '✅ Completed' : data?.todayWorkout?.duration ? `~${data.todayWorkout.duration} min` : 'Not started'}
          color="var(--accent3)" />
        <StatCard icon="⚡" label="Engagement" value={`${data?.engagement?.score || 0}%`}
          sub={data?.engagement?.level || 'Low'}
          color={data?.engagement?.level === 'High' ? 'var(--success)' : data?.engagement?.level === 'Medium' ? 'var(--warning)' : 'var(--danger)'} />
        <StatCard icon="🔥" label="Streak" value={`${data?.engagement?.streak || 0} days`}
          sub="Keep it going!" color="var(--accent2)" />
      </div>

      {/* Calorie progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>📊 Daily Calorie Progress</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{data?.todayNutrition?.percentage || 0}% of goal</div>
        </div>
        <div className="progress-bar" style={{ height: 12, marginBottom: 12 }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, data?.todayNutrition?.percentage || 0)}%`, background: data?.todayNutrition?.percentage > 100 ? 'var(--danger)' : undefined }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Consumed', value: `${data?.todayNutrition?.consumed || 0} kcal`, color: 'var(--accent)' },
            { label: 'Remaining', value: `${Math.max(0, data?.todayNutrition?.remaining || 0)} kcal`, color: 'var(--success)' },
            { label: 'Target', value: `${data?.todayNutrition?.target || 2000} kcal`, color: 'var(--text2)' },
          ].map(i => (
            <div key={i.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: i.color }}>{i.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{i.label}</div>
            </div>
          ))}
        </div>
        {(data?.todayNutrition?.protein > 0 || data?.todayNutrition?.carbs > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            {[
              { label: '🥩 Protein', value: `${data?.todayNutrition?.protein || 0}g` },
              { label: '🍞 Carbs', value: `${data?.todayNutrition?.carbs || 0}g` },
              { label: '🥑 Fats', value: `${data?.todayNutrition?.fats || 0}g` },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>{m.value}</div>
                <div style={{ color: 'var(--text2)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Today's workout card */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12 }}>🏋️ Today's Workout</div>
          {!data?.todayWorkout?.planExists ? (
            <div>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12 }}>No workout plan yet. Generate one to get started!</p>
              <button onClick={handleGeneratePlan} className="btn btn-primary btn-sm btn-full">Generate Plan</button>
            </div>
          ) : data?.todayWorkout?.isRestDay ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40 }}>😴</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Rest Day</div>
              <div style={{ color: 'var(--text2)', fontSize: 12 }}>Recovery is key!</div>
            </div>
          ) : (
            <div>
              <div className="tag tag-purple" style={{ marginBottom: 12 }}>{data?.todayWorkout?.type}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                ⏱️ ~{data?.todayWorkout?.duration} min · 🔥 ~{data?.todayWorkout?.calories} kcal
              </div>
              {data?.todayWorkout?.completed ? (
                <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>✅ Completed today!</div>
              ) : (
                <button onClick={() => navigate('/workouts')} className="btn btn-primary btn-sm btn-full">Start Workout</button>
              )}
            </div>
          )}
        </div>

        {/* Weight & BMI */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12 }}>⚖️ Body Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Current Weight', value: `${data?.user?.currentWeight || '—'} kg` },
              { label: 'Target Weight', value: `${data?.user?.targetWeight || '—'} kg` },
              { label: 'BMI', value: data?.user?.bmi || '—' },
            ].map(s => (
              <div key={s.label} className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{s.label}</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{s.value}</span>
              </div>
            ))}
            <button onClick={() => navigate('/profile')} className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 4 }}>Update Weight</button>
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      {data?.weeklyData?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>📅 Weekly Calorie Intake</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.weeklyData}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                formatter={(v) => [`${v} kcal`, 'Calories']} />
              <ReferenceLine y={data?.weeklyData?.[0]?.target || 2000} stroke="var(--accent)" strokeDasharray="4 4" />
              <Bar dataKey="calories" fill="var(--accent)" radius={[6, 6, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {[
          { label: '🍽️ Log Meal', path: '/meals' },
          { label: '🏋️ Workouts', path: '/workouts' },
          { label: '💬 Chat', path: '/chat' },
          { label: '📈 Progress', path: '/progress' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)} className="btn btn-secondary"
            style={{ flexDirection: 'column', gap: 4, padding: '16px 12px', fontSize: 13 }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

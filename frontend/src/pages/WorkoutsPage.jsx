import React, { useState, useEffect } from 'react';
import { workoutAPI } from '../services/api.jsx';

const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const dayLabels = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

export default function WorkoutsPage() {
  const [plan, setPlan] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('today');

  const todayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

  const loadData = async () => {
    setLoading(true);
    try {
      const [planRes, todayRes] = await Promise.all([workoutAPI.getPlan(), workoutAPI.getToday()]);
      setPlan(planRes.data.plan);
      setTodayWorkout(todayRes.data);
      setSelectedDay(todayRes.data.today);
    } catch { setPlan(null); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try { await workoutAPI.generatePlan(); await loadData(); setMsg('✅ Workout plan generated!'); setTimeout(() => setMsg(''), 3000); }
    catch (e) { setMsg('❌ ' + (e.response?.data?.message || 'Failed to generate plan')); }
    setGenerating(false);
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await workoutAPI.complete(selectedDay);
      setMsg(`✅ Workout complete! 🔥 ${res.data.caloriesBurned} kcal burned!`);
      await loadData();
      setTimeout(() => setMsg(''), 4000);
    } catch { setMsg('❌ Failed to mark complete'); }
    setCompleting(false);
  };

  const handleSkip = async () => {
    await workoutAPI.skip();
    setMsg('⏭️ Workout skipped for today');
    setTimeout(() => setMsg(''), 3000);
  };

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  const selectedWorkout = plan?.weeklySchedule?.[selectedDay || todayName];

  return (
    <div>
      <div className="page-title">🏋️ Workouts</div>
      <div className="page-subtitle">Your personalized adaptive workout plan</div>

      {msg && <div className={`alert ${msg.startsWith('❌') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

      {!plan ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏋️</div>
          <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No workout plan yet</div>
          <div style={{ color: 'var(--text2)', marginBottom: 24 }}>Generate a personalized plan based on your fitness goal and activity level</div>
          <button onClick={handleGenerate} className="btn btn-primary" disabled={generating}>
            {generating ? 'Generating...' : '⚡ Generate My Plan'}
          </button>
        </div>
      ) : (
        <>
          {/* Plan header */}
          <div className="card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.planDetails.planName}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
                <span className="tag tag-purple" style={{ marginRight: 8 }}>{plan.planDetails.currentDifficulty}</span>
                Week {plan.planDetails.weekNumber} · {plan.planStats.totalWorkoutsCompleted}/{plan.planStats.totalWorkoutsPlanned} workouts done
              </div>
            </div>
            <button onClick={handleGenerate} className="btn btn-secondary btn-sm" disabled={generating}>
              {generating ? '...' : '🔄 Regenerate'}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['today', 'week'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}>
                {t === 'today' ? "Today's Workout" : '📅 Weekly Plan'}
              </button>
            ))}
          </div>

          {tab === 'today' && (
            <div>
              {todayWorkout?.workout?.isRestDay ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <div style={{ fontSize: 60, marginBottom: 12 }}>😴</div>
                  <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>Rest Day</div>
                  <div style={{ color: 'var(--text2)', marginTop: 8 }}>Recovery is essential. Rest, hydrate, and come back stronger tomorrow!</div>
                </div>
              ) : (
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                      <div>
                        <span className="tag tag-purple" style={{ marginRight: 8 }}>{todayWorkout?.workout?.workoutType}</span>
                        <span className="tag tag-teal">{plan.planDetails.currentDifficulty}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                        ⏱️ ~{todayWorkout?.workout?.totalEstimatedDuration} min · 🔥 ~{todayWorkout?.workout?.totalEstimatedCalories} kcal
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {todayWorkout?.workout?.exercises?.map((ex, i) => (
                        <div key={i} style={{ background: ex.completed ? 'rgba(74,222,128,0.08)' : 'var(--bg2)', border: `1px solid ${ex.completed ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 16px' }}>
                          <div className="flex-between">
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>
                                {ex.completed ? '✅ ' : `${i + 1}. `}{ex.exerciseName}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                                {ex.duration > 0 ? `${ex.sets} sets × ${ex.duration}s hold` : `${ex.sets} sets × ${ex.reps} reps`}
                                {ex.restBetweenSets > 0 && ` · ${ex.restBetweenSets}s rest`}
                              </div>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--accent4)', fontWeight: 700 }}>~{ex.estimatedCalories} kcal</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      {todayWorkout?.workout?.exercises?.every(e => e.completed) ? (
                        <div style={{ color: 'var(--success)', fontWeight: 700, padding: '10px 0' }}>🎉 Workout completed today!</div>
                      ) : (
                        <>
                          <button onClick={handleComplete} className="btn btn-primary" disabled={completing} style={{ flex: 1 }}>
                            {completing ? 'Saving...' : '✅ Mark Complete'}
                          </button>
                          <button onClick={handleSkip} className="btn btn-secondary btn-sm">⏭️ Skip</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'week' && (
            <div>
              {/* Day selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                {days.map(d => {
                  const w = plan.weeklySchedule[d];
                  const isToday = d === todayName;
                  const isSelected = d === (selectedDay || todayName);
                  return (
                    <button key={d} onClick={() => setSelectedDay(d)}
                      style={{ minWidth: 60, padding: '10px 8px', borderRadius: 10, border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'rgba(108,99,255,0.15)' : 'var(--card)', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: isToday ? 'var(--accent)' : 'var(--text2)', fontWeight: isToday ? 700 : 400 }}>{dayLabels[d]}</div>
                      <div style={{ fontSize: 18, marginTop: 4 }}>{w?.isRestDay ? '😴' : w?.workoutType === 'Cardio' ? '🏃' : w?.workoutType === 'Strength' ? '💪' : w?.workoutType === 'Core' ? '🔥' : '🧘'}</div>
                      <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{w?.isRestDay ? 'Rest' : w?.workoutType?.split(' ')[0]}</div>
                    </button>
                  );
                })}
              </div>

              {selectedWorkout && (
                <div className="card">
                  {selectedWorkout.isRestDay ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ fontSize: 48 }}>😴</div>
                      <div style={{ fontWeight: 700, marginTop: 8 }}>Rest Day</div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex-between" style={{ marginBottom: 16 }}>
                        <span className="tag tag-purple">{selectedWorkout.workoutType}</span>
                        <span style={{ fontSize: 13, color: 'var(--text2)' }}>⏱️ ~{selectedWorkout.totalEstimatedDuration} min · 🔥 ~{selectedWorkout.totalEstimatedCalories} kcal</span>
                      </div>
                      {selectedWorkout.exercises?.map((ex, i) => (
                        <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{i + 1}. {ex.exerciseName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                            {ex.duration > 0 ? `${ex.sets} sets × ${ex.duration}s` : `${ex.sets} × ${ex.reps} reps`} · Rest: {ex.restBetweenSets}s · ~{ex.estimatedCalories} kcal
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

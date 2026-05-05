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
    try { await workoutAPI.generatePlan(); await loadData(); setMsg('Workout plan generated!'); setTimeout(() => setMsg(''), 3000); }
    catch (e) { setMsg('error:' + (e.response?.data?.message || 'Failed to generate plan')); }
    setGenerating(false);
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await workoutAPI.complete(selectedDay);
      setMsg(`Workout complete! ${res.data.caloriesBurned} kcal burned`);
      await loadData(); setTimeout(() => setMsg(''), 4000);
    } catch { setMsg('error:Failed to mark complete'); }
    setCompleting(false);
  };

  const handleSkip = async () => {
    await workoutAPI.skip();
    setMsg('Workout skipped for today'); setTimeout(() => setMsg(''), 3000);
  };

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  const selectedWorkout = plan?.weeklySchedule?.[selectedDay || todayName];
  const isError = msg.startsWith('error:');

  return (
    <div>
      <div className="page-title">Workouts</div>
      <div className="page-subtitle">Your personalized adaptive workout plan</div>

      {msg && <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`}>{isError ? msg.slice(6) : msg}</div>}

      {!plan ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🏋️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 10 }}>No workout plan yet</div>
          <div style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 14, maxWidth: 340, margin: '0 auto 28px' }}>
            Generate a personalized plan based on your fitness goal and activity level
          </div>
          <button onClick={handleGenerate} className="btn btn-primary" disabled={generating}>
            {generating ? 'Generating…' : 'Generate My Plan'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{plan.planDetails.planName}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="tag tag-orange">{plan.planDetails.currentDifficulty}</span>
                <span>Week {plan.planDetails.weekNumber} · {plan.planStats.totalWorkoutsCompleted}/{plan.planStats.totalWorkoutsPlanned} done</span>
              </div>
            </div>
            <button onClick={handleGenerate} className="btn btn-secondary btn-sm" disabled={generating}>
              {generating ? '…' : 'Regenerate'}
            </button>
          </div>

          <div className="tab-bar">
            {['today', 'week'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`tab-btn${tab === t ? ' active' : ''}`}>
                {t === 'today' ? "Today's Workout" : 'Weekly Plan'}
              </button>
            ))}
          </div>

          {tab === 'today' && (
            <div>
              {todayWorkout?.workout?.isRestDay ? (
                <div className="card" style={{ textAlign: 'center', padding: '44px 24px' }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>😴</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Rest Day</div>
                  <div style={{ color: 'var(--text2)', marginTop: 8, fontSize: 14 }}>Recovery is essential. Rest, hydrate, and come back stronger.</div>
                </div>
              ) : (
                <div className="card">
                  <div className="flex-between" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="tag tag-orange">{todayWorkout?.workout?.workoutType}</span>
                      <span className="tag tag-teal">{plan.planDetails.currentDifficulty}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>
                      ~{todayWorkout?.workout?.totalEstimatedDuration} min · ~{todayWorkout?.workout?.totalEstimatedCalories} kcal
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                    {todayWorkout?.workout?.exercises?.map((ex, i) => (
                      <div key={i} style={{
                        background: ex.completed ? 'rgba(65,217,139,0.06)' : 'var(--bg2)',
                        border: `1px solid ${ex.completed ? 'rgba(65,217,139,0.22)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                        <div className="flex-between">
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>
                              {ex.completed ? <span style={{ color: 'var(--success)', marginRight: 6 }}>✓</span> : <span style={{ color: 'var(--text3)', marginRight: 6 }}>{i+1}.</span>}
                              {ex.exerciseName}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                              {ex.duration > 0 ? `${ex.sets} sets × ${ex.duration}s hold` : `${ex.sets} sets × ${ex.reps} reps`}
                              {ex.restBetweenSets > 0 && ` · ${ex.restBetweenSets}s rest`}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--accent4)', fontWeight: 600 }}>~{ex.estimatedCalories} kcal</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {todayWorkout?.workout?.exercises?.every(e => e.completed) ? (
                      <div style={{ color: 'var(--success)', fontWeight: 600, padding: '10px 0', fontSize: 14 }}>✓ Workout completed today!</div>
                    ) : (
                      <>
                        <button onClick={handleComplete} className="btn btn-primary" disabled={completing} style={{ flex: 1 }}>
                          {completing ? 'Saving…' : 'Mark Complete'}
                        </button>
                        <button onClick={handleSkip} className="btn btn-secondary btn-sm">Skip</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'week' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                {days.map(d => {
                  const w = plan.weeklySchedule[d];
                  const isToday = d === todayName;
                  const isSel = d === (selectedDay || todayName);
                  return (
                    <button key={d} onClick={() => setSelectedDay(d)}
                      style={{ minWidth: 58, padding: '10px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                        background: isSel ? 'rgba(232,131,79,0.10)' : 'var(--card)',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.18s' }}>
                      <div style={{ fontSize: 11, color: isToday ? 'var(--accent)' : 'var(--text2)', fontWeight: isToday ? 700 : 400 }}>{dayLabels[d]}</div>
                      <div style={{ fontSize: 18, marginTop: 4 }}>{w?.isRestDay ? '😴' : w?.workoutType === 'Cardio' ? '🏃' : w?.workoutType === 'Strength' ? '💪' : '🔥'}</div>
                      <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{w?.isRestDay ? 'Rest' : w?.workoutType?.split(' ')[0]}</div>
                    </button>
                  );
                })}
              </div>

              {selectedWorkout && (
                <div className="card">
                  {selectedWorkout.isRestDay ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ fontSize: 44 }}>😴</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 8 }}>Rest Day</div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex-between" style={{ marginBottom: 16 }}>
                        <span className="tag tag-orange">{selectedWorkout.workoutType}</span>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>~{selectedWorkout.totalEstimatedDuration} min · ~{selectedWorkout.totalEstimatedCalories} kcal</span>
                      </div>
                      {selectedWorkout.exercises?.map((ex, i) => (
                        <div key={i} style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{i+1}. {ex.exerciseName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                            {ex.duration > 0 ? `${ex.sets} × ${ex.duration}s` : `${ex.sets} × ${ex.reps} reps`} · Rest: {ex.restBetweenSets}s · ~{ex.estimatedCalories} kcal
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

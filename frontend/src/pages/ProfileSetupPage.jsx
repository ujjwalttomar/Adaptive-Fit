import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const steps = [
  { id: 'basics', label: 'Basics', icon: '👤' },
  { id: 'body', label: 'Body', icon: '⚖️' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
];

export default function ProfileSetupPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    age: '', gender: 'Male', height: '', currentWeight: '',
    targetWeight: '', fitnessGoal: 'Weight Loss',
    activityLevel: 'Lightly Active', dietaryPreference: 'No Preference'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const bmi = form.height && form.currentWeight
    ? (form.currentWeight / ((form.height / 100) ** 2)).toFixed(1)
    : null;

  const bmiCategory = (b) => {
    if (!b) return '';
    const n = parseFloat(b);
    if (n < 18.5) return { label: 'Underweight', color: 'var(--warning)' };
    if (n < 25) return { label: 'Normal', color: 'var(--success)' };
    if (n < 30) return { label: 'Overweight', color: 'var(--warning)' };
    return { label: 'Obese', color: 'var(--danger)' };
  };

  const bmiInfo = bmiCategory(bmi);

  const nextStep = () => {
    setError('');
    if (step === 0 && (!form.age || !form.gender)) return setError('Please fill in all fields');
    if (step === 1 && (!form.height || !form.currentWeight)) return setError('Please fill in height and weight');
    setStep(s => Math.min(s + 1, steps.length - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fitnessGoal || !form.activityLevel) return setError('Please fill in all fields');
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.setupProfile(form);
      updateUser(res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 40, paddingBottom: 40 }}>
      <div className="auth-bg-orb auth-orb-1" />
      <div className="auth-bg-orb auth-orb-2" />

      <div className="auth-container" style={{ maxWidth: 540 }}>
        <div className="auth-brand">
          <div className="brand-name">Set Up Your Profile</div>
          <div className="brand-sub">Personalize your fitness plan</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, background: 'var(--card)', borderRadius: 16, padding: '12px 20px', border: '1px solid var(--border)' }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i <= step ? 'var(--accent)' : 'var(--bg3)',
                  color: i <= step ? 'white' : 'var(--text3)',
                  fontSize: 16, fontWeight: 700, transition: 'all 0.3s',
                  border: i === step ? '2px solid rgba(108,99,255,0.5)' : '2px solid transparent',
                  boxShadow: i === step ? '0 0 12px rgba(108,99,255,0.4)' : 'none'
                }}>
                  {i < step ? '✓' : s.icon}
                </div>
                <div style={{ fontSize: 11, color: i <= step ? 'var(--accent)' : 'var(--text3)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 2, height: 2, background: i < step ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s', marginBottom: 20 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && <div className="alert alert-error">{error}</div>}

          {step === 0 && (
            <div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Tell us about yourself</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label>Age</label>
                  <input type="number" min="10" max="100" placeholder="22" value={form.age} onChange={set('age')} required />
                </div>
                <div className="input-group">
                  <label>Gender</label>
                  <select value={form.gender} onChange={set('gender')}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Dietary Preference</label>
                <select value={form.dietaryPreference} onChange={set('dietaryPreference')}>
                  <option>No Preference</option><option>Vegetarian</option>
                  <option>Vegan</option><option>Non Vegetarian</option>
                </select>
              </div>
              <button onClick={nextStep} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                Continue →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Your body measurements</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label>Height (cm)</label>
                  <input type="number" min="100" max="250" placeholder="175" value={form.height} onChange={set('height')} required />
                </div>
                <div className="input-group">
                  <label>Current Weight (kg)</label>
                  <input type="number" min="20" max="300" step="0.1" placeholder="70" value={form.currentWeight} onChange={set('currentWeight')} required />
                </div>
              </div>
              <div className="input-group">
                <label>Target Weight (kg) — Optional</label>
                <input type="number" min="20" max="300" step="0.1" placeholder="65" value={form.targetWeight} onChange={set('targetWeight')} />
              </div>

              {bmi && (
                <div style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12,
                  padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>Your BMI</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: bmiInfo.color }}>{bmi}</span>
                    <span style={{ fontSize: 12, color: bmiInfo.color, fontWeight: 600, background: `${bmiInfo.color}22`, padding: '3px 10px', borderRadius: 20 }}>{bmiInfo.label}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
                <button onClick={nextStep} className="btn btn-primary" style={{ flex: 2 }}>Continue →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Set your goals</h3>
              <div className="input-group">
                <label>Fitness Goal</label>
                <select value={form.fitnessGoal} onChange={set('fitnessGoal')}>
                  <option>Weight Loss</option><option>Muscle Gain</option>
                  <option>Stay Fit</option><option>Improve Stamina</option>
                </select>
              </div>
              <div className="input-group">
                <label>Activity Level</label>
                <select value={form.activityLevel} onChange={set('activityLevel')}>
                  <option>Sedentary</option><option>Lightly Active</option>
                  <option>Moderately Active</option><option>Very Active</option>
                </select>
              </div>

              {/* Goal cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { goal: 'Weight Loss', icon: '🏃', desc: 'Calorie deficit plan' },
                  { goal: 'Muscle Gain', icon: '💪', desc: 'Strength & hypertrophy' },
                  { goal: 'Stay Fit', icon: '⚡', desc: 'Balanced maintenance' },
                  { goal: 'Improve Stamina', icon: '🔥', desc: 'Cardio focused' },
                ].map(g => (
                  <div key={g.goal} onClick={() => setForm(p => ({ ...p, fitnessGoal: g.goal }))}
                    style={{
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${form.fitnessGoal === g.goal ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.fitnessGoal === g.goal ? 'rgba(108,99,255,0.1)' : 'var(--bg2)',
                      transition: 'all 0.2s'
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{g.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: form.fitnessGoal === g.goal ? 'var(--accent)' : 'var(--text)' }}>{g.goal}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{g.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? <><span className="btn-spinner" /> Saving...</> : 'Save & Start 🚀'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

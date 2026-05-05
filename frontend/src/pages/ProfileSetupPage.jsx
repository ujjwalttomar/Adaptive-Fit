import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const steps = [
  { id: 'basics', label: 'Basics' },
  { id: 'body',   label: 'Body' },
  { id: 'goals',  label: 'Goals' },
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
    ? (form.currentWeight / ((form.height / 100) ** 2)).toFixed(1) : null;

  const bmiCategory = (b) => {
    if (!b) return null;
    const n = parseFloat(b);
    if (n < 18.5) return { label: 'Underweight', color: 'var(--warning)' };
    if (n < 25)   return { label: 'Normal',       color: 'var(--success)' };
    if (n < 30)   return { label: 'Overweight',   color: 'var(--warning)' };
    return { label: 'Obese', color: 'var(--danger)' };
  };
  const bmiInfo = bmiCategory(bmi);

  const nextStep = () => {
    setError('');
    if (step === 0 && (!form.age || !form.gender)) return setError('Please fill in all fields');
    if (step === 1 && (!form.height || !form.currentWeight)) return setError('Please enter height and weight');
    setStep(s => Math.min(s + 1, steps.length - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fitnessGoal || !form.activityLevel) return setError('Please fill in all fields');
    setLoading(true);
    try {
      const res = await authAPI.setupProfile(form);
      updateUser(res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-orb-1" />
      <div className="auth-bg-orb auth-orb-2" />

      <div className="auth-container" style={{ maxWidth: 460 }}>
        <div className="auth-brand">
          <div className="brand-logo">AF</div>
          <div className="brand-name">AdaptiveFit</div>
          <div className="brand-sub">Set up your profile to get started</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: i <= step ? 'var(--accent)' : 'var(--card2)',
                  border: `2px solid ${i <= step ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                  color: i <= step ? '#fff' : 'var(--text2)',
                  transition: 'all 0.25s'
                }}>{i + 1}</div>
                <div style={{ fontSize: 10, color: i === step ? 'var(--accent)' : 'var(--text2)', fontWeight: i === step ? 600 : 400, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 48, height: 2, background: i < step ? 'var(--accent)' : 'var(--border)', margin: '0 6px', marginBottom: 20, transition: 'background 0.25s' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="card auth-card">
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          {step === 0 && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, marginBottom: 20 }}>Tell us about yourself</h3>
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
              <button onClick={nextStep} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>Continue →</button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, marginBottom: 20 }}>Your body measurements</h3>
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

              {bmi && bmiInfo && (
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>Your BMI</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: bmiInfo.color }}>{bmi}</span>
                    <span style={{ fontSize: 12, color: bmiInfo.color, fontWeight: 600,
                      background: `${bmiInfo.color}18`, padding: '3px 10px', borderRadius: 20 }}>{bmiInfo.label}</span>
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
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, marginBottom: 20 }}>Set your goals</h3>
              <div className="input-group">
                <label>Activity Level</label>
                <select value={form.activityLevel} onChange={set('activityLevel')}>
                  <option>Sedentary</option><option>Lightly Active</option>
                  <option>Moderately Active</option><option>Very Active</option>
                </select>
              </div>

              <div className="section-label" style={{ marginBottom: 10 }}>Fitness Goal</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
                {[
                  { goal: 'Weight Loss',      icon: '🏃', desc: 'Calorie deficit plan' },
                  { goal: 'Muscle Gain',       icon: '💪', desc: 'Strength & hypertrophy' },
                  { goal: 'Stay Fit',          icon: '⚡', desc: 'Balanced maintenance' },
                  { goal: 'Improve Stamina',   icon: '🔥', desc: 'Cardio focused' },
                ].map(g => (
                  <div key={g.goal} onClick={() => setForm(p => ({ ...p, fitnessGoal: g.goal }))}
                    style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      border: `1px solid ${form.fitnessGoal === g.goal ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.fitnessGoal === g.goal ? 'rgba(232,131,79,0.10)' : 'var(--bg2)',
                      transition: 'all 0.18s' }}>
                    <div style={{ fontSize: 22, marginBottom: 5 }}>{g.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600,
                      color: form.fitnessGoal === g.goal ? 'var(--accent)' : 'var(--text)' }}>{g.goal}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{g.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? <><span className="btn-spinner" /> Saving…</> : 'Save & Start →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { authAPI } from '../services/api.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const profile = user?.profile || {};

  const [form, setForm] = useState({
    currentWeight: profile.currentWeight || '',
    targetWeight:  profile.targetWeight  || '',
    fitnessGoal:   profile.fitnessGoal   || 'Stay Fit',
    activityLevel: profile.activityLevel || 'Lightly Active',
    dietaryPreference: profile.dietaryPreference || 'No Preference',
    height: profile.height || '',
    age:    profile.age    || '',
    gender: profile.gender || 'Male',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      setMsg('success'); setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('error:' + (err.response?.data?.message || 'Failed to update'));
    }
    setSaving(false);
  };

  const bmiCategory = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25)   return 'Normal';
    if (bmi < 30)   return 'Overweight';
    return 'Obese';
  };

  const isError = msg.startsWith('error:');

  return (
    <div>
      <div className="page-title">Profile</div>
      <div className="page-subtitle">Manage your health profile and goals</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Weight',       value: `${profile.currentWeight || '—'}`, unit: 'kg' },
          { label: 'Target',       value: `${profile.targetWeight || '—'}`,  unit: 'kg' },
          { label: 'BMI',          value: profile.bmi || '—',                unit: bmiCategory(profile.bmi) || '' },
          { label: 'Daily Target', value: `${profile.dailyCalorieTarget || '—'}`, unit: 'kcal' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text)', marginBottom: 2 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{s.unit}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* User info card */}
      <div className="card" style={{ marginBottom: 18, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(145deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user?.fullName?.[0] || '?'}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.2 }}>{user?.fullName}</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 3 }}>{user?.email}</div>
            <div style={{ marginTop: 7 }}>
              <span className="tag tag-orange">{profile.fitnessGoal || 'Goal not set'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 20 }}>Update Profile</div>
        {msg === 'success' && <div className="alert alert-success">✓ Profile updated successfully</div>}
        {isError && <div className="alert alert-error">{msg.slice(6)}</div>}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label>Age</label>
              <input type="number" min="10" max="100" value={form.age} onChange={set('age')} />
            </div>
            <div className="input-group">
              <label>Gender</label>
              <select value={form.gender} onChange={set('gender')}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="input-group">
              <label>Height (cm)</label>
              <input type="number" min="100" max="250" value={form.height} onChange={set('height')} />
            </div>
            <div className="input-group">
              <label>Current Weight (kg)</label>
              <input type="number" min="20" max="300" step="0.1" value={form.currentWeight} onChange={set('currentWeight')} />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Target Weight (kg)</label>
              <input type="number" min="20" max="300" step="0.1" value={form.targetWeight} onChange={set('targetWeight')} />
            </div>
          </div>

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

          <div className="input-group">
            <label>Dietary Preference</label>
            <select value={form.dietaryPreference} onChange={set('dietaryPreference')}>
              <option>No Preference</option><option>Vegetarian</option>
              <option>Vegan</option><option>Non Vegetarian</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

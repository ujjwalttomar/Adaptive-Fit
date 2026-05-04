import React, { useState } from 'react';
import { authAPI } from '../services/api.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const profile = user?.profile || {};

  const [form, setForm] = useState({
    currentWeight: profile.currentWeight || '',
    targetWeight: profile.targetWeight || '',
    fitnessGoal: profile.fitnessGoal || 'Stay Fit',
    activityLevel: profile.activityLevel || 'Lightly Active',
    dietaryPreference: profile.dietaryPreference || 'No Preference',
    height: profile.height || '',
    age: profile.age || '',
    gender: profile.gender || 'Male',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      setMsg('✅ Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to update'));
    }
    setSaving(false);
  };

  const bmiCategory = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div>
      <div className="page-title">👤 Profile</div>
      <div className="page-subtitle">Manage your health profile and goals</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '⚖️', label: 'Current Weight', value: `${profile.currentWeight || '—'} kg` },
          { icon: '🎯', label: 'Target Weight', value: `${profile.targetWeight || '—'} kg` },
          { icon: '📊', label: 'BMI', value: profile.bmi || '—', sub: bmiCategory(profile.bmi) },
          { icon: '🔥', label: 'Daily Target', value: `${profile.dailyCalorieTarget || '—'} kcal` },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.sub || s.label}</div>
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
            {user?.fullName?.[0] || '?'}
          </div>
          <div>
            <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>{user?.fullName}</div>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>{user?.email}</div>
            <div style={{ marginTop: 4 }}>
              <span className="tag tag-purple" style={{ fontSize: 11 }}>{profile.fitnessGoal || 'Goal not set'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>✏️ Update Profile</div>
        {msg && <div className={`alert ${msg.startsWith('❌') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label>Age</label>
              <input type="number" min="10" max="100" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Gender</label>
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="input-group">
              <label>Height (cm)</label>
              <input type="number" min="100" max="250" value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Current Weight (kg)</label>
              <input type="number" min="20" max="300" step="0.1" value={form.currentWeight} onChange={e => setForm(p => ({ ...p, currentWeight: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Target Weight (kg)</label>
              <input type="number" min="20" max="300" step="0.1" value={form.targetWeight} onChange={e => setForm(p => ({ ...p, targetWeight: e.target.value }))} />
            </div>
          </div>

          <div className="input-group">
            <label>Fitness Goal</label>
            <select value={form.fitnessGoal} onChange={e => setForm(p => ({ ...p, fitnessGoal: e.target.value }))}>
              <option>Weight Loss</option><option>Muscle Gain</option>
              <option>Stay Fit</option><option>Improve Stamina</option>
            </select>
          </div>

          <div className="input-group">
            <label>Activity Level</label>
            <select value={form.activityLevel} onChange={e => setForm(p => ({ ...p, activityLevel: e.target.value }))}>
              <option>Sedentary</option><option>Lightly Active</option>
              <option>Moderately Active</option><option>Very Active</option>
            </select>
          </div>

          <div className="input-group">
            <label>Dietary Preference</label>
            <select value={form.dietaryPreference} onChange={e => setForm(p => ({ ...p, dietaryPreference: e.target.value }))}>
              <option>No Preference</option><option>Vegetarian</option>
              <option>Vegan</option><option>Non Vegetarian</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

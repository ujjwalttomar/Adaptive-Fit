import React, { useState, useEffect } from 'react';
import { mealAPI } from '../services/api.jsx';

export default function MealsPage() {
  const [tab, setTab] = useState('log');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mealType, setMealType] = useState('Breakfast');
  const [portion, setPortion] = useState(100);
  const [logging, setLogging] = useState(false);
  const [success, setSuccess] = useState('');
  const [todayMeals, setTodayMeals] = useState([]);
  const [summary, setSummary] = useState(null);

  const loadToday = async () => {
    const res = await mealAPI.getToday();
    setTodayMeals(res.data.meals);
    setSummary(res.data.dailySummary);
  };

  useEffect(() => { if (tab === 'today') loadToday(); }, [tab]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setResults([]);
    setSelected(null);
    try {
      const res = await mealAPI.search(search);
      setResults(res.data.results);
    } catch {}
    setSearching(false);
  };

  const handleLog = async () => {
    if (!selected) return;
    setLogging(true);
    try {
      await mealAPI.log({ mealType, foodName: selected.name, portionSize: portion, ...selected, per: undefined });
      setSuccess(`✅ ${selected.name} logged successfully!`);
      setSelected(null); setSearch(''); setResults([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { alert('Failed to log meal'); }
    setLogging(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal?')) return;
    await mealAPI.delete(id);
    loadToday();
  };

  const calculatedCals = selected ? Math.round(selected.calories * portion / 100) : 0;

  return (
    <div>
      <div className="page-title">🍽️ Meals</div>
      <div className="page-subtitle">Search, log, and track your nutrition</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['log', 'today'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
            {t === 'log' ? '➕ Log Meal' : '📋 Today\'s Meals'}
          </button>
        ))}
      </div>

      {tab === 'log' && (
        <div>
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Search Food</div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input className="input-group input" style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }}
                placeholder="Search food (e.g. rice, banana, chicken...)" value={search}
                onChange={e => setSearch(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={searching}>
                {searching ? '...' : '🔍 Search'}
              </button>
            </form>

            {searching && <div style={{ textAlign: 'center', color: 'var(--text2)', padding: 20 }}>Searching...</div>}

            {results.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results.map((r, i) => (
                  <div key={i} onClick={() => setSelected(r)}
                    style={{ padding: '12px 16px', background: selected?.name === r.name ? 'rgba(108,99,255,0.15)' : 'var(--bg2)', border: `1px solid ${selected?.name === r.name ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div className="flex-between">
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--accent4)', fontWeight: 700 }}>{r.calories} kcal/100g</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                      P: {r.protein}g · C: {r.carbohydrates}g · F: {r.fats}g
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="card" style={{ background: 'rgba(108,99,255,0.08)', borderColor: 'rgba(108,99,255,0.3)' }}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>Log: {selected.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Meal Type</label>
                  <select value={mealType} onChange={e => setMealType(e.target.value)}>
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Portion (grams)</label>
                  <input type="number" min="1" max="2000" value={portion} onChange={e => setPortion(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center' }}>
                {[
                  { label: '🔥 Calories', val: `${calculatedCals} kcal` },
                  { label: '🥩 Protein', val: `${Math.round(selected.protein * portion / 100)}g` },
                  { label: '🍞 Carbs', val: `${Math.round(selected.carbohydrates * portion / 100)}g` },
                  { label: '🥑 Fats', val: `${Math.round(selected.fats * portion / 100)}g` },
                ].map(n => (
                  <div key={n.label}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{n.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{n.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={handleLog} className="btn btn-primary btn-full" disabled={logging}>
                {logging ? 'Logging...' : '✅ Log This Meal'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'today' && (
        <div>
          {summary && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Today's Summary</div>
              <div className="progress-bar" style={{ marginBottom: 12, height: 10 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, summary.percentageConsumed)}%` }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
                {[
                  { label: 'Consumed', val: `${summary.calories} kcal`, color: 'var(--accent)' },
                  { label: 'Remaining', val: `${Math.max(0, summary.remainingCalories)} kcal`, color: 'var(--success)' },
                  { label: 'Target', val: `${summary.dailyTarget} kcal`, color: 'var(--text2)' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todayMeals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
              <div style={{ fontWeight: 600 }}>No meals logged today</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Switch to "Log Meal" to add your first meal</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayMeals.map(m => (
                <div key={m._id} className="card" style={{ padding: '14px 16px' }}>
                  <div className="flex-between">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{m.mealDetails.foodName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        <span className="tag tag-purple" style={{ fontSize: 11, padding: '2px 8px', marginRight: 6 }}>{m.mealDetails.mealType}</span>
                        {m.mealDetails.portionSize}g · {new Date(m.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent4)' }}>{m.mealDetails.nutritionInfo.calories}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>kcal</div>
                      </div>
                      <button onClick={() => handleDelete(m._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

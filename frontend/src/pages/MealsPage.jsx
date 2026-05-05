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
    setSearching(true); setResults([]); setSelected(null);
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
      setSuccess(`${selected.name} logged successfully`);
      setSelected(null); setSearch(''); setResults([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch { alert('Failed to log meal'); }
    setLogging(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this meal?')) return;
    await mealAPI.delete(id); loadToday();
  };

  const calculatedCals = selected ? Math.round(selected.calories * portion / 100) : 0;

  return (
    <div>
      <div className="page-title">Meals</div>
      <div className="page-subtitle">Search, log, and track your nutrition</div>

      <div className="tab-bar">
        {['log', 'today'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn${tab === t ? ' active' : ''}`}>
            {t === 'log' ? 'Log Meal' : "Today's Meals"}
          </button>
        ))}
      </div>

      {tab === 'log' && (
        <div>
          {success && <div className="alert alert-success">✓ {success}</div>}

          <div className="card" style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Search Food</div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input
                style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text)',
                  fontFamily: 'var(--font-body)', outline: 'none', fontSize: 14,
                  transition: 'border-color 0.18s' }}
                placeholder="Search food (e.g. rice, banana, chicken…)"
                value={search} onChange={e => setSearch(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              <button type="submit" className="btn btn-primary" disabled={searching}>
                {searching ? '…' : 'Search'}
              </button>
            </form>

            {searching && <div style={{ textAlign: 'center', color: 'var(--text2)', padding: 20 }}>Searching…</div>}

            {results.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results.map((r, i) => (
                  <div key={i} onClick={() => setSelected(r)}
                    style={{ padding: '12px 14px',
                      background: selected?.name === r.name ? 'rgba(232,131,79,0.10)' : 'var(--bg2)',
                      border: `1px solid ${selected?.name === r.name ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.18s' }}>
                    <div className="flex-between">
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--accent4)', fontWeight: 600 }}>{r.calories} kcal/100g</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                      P: {r.protein}g · C: {r.carbohydrates}g · F: {r.fats}g
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="card" style={{ background: 'rgba(232,131,79,0.05)', borderColor: 'rgba(232,131,79,0.25)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Log — {selected.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Meal Type</label>
                  <select value={mealType} onChange={e => setMealType(e.target.value)}>
                    {['Breakfast','Lunch','Dinner','Snack'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Portion (g)</label>
                  <input type="number" min="1" max="2000" value={portion} onChange={e => setPortion(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center' }}>
                {[
                  { label: 'Calories', val: `${calculatedCals}`, unit: 'kcal', color: 'var(--accent)' },
                  { label: 'Protein',  val: `${Math.round(selected.protein * portion / 100)}`, unit: 'g', color: 'var(--accent4)' },
                  { label: 'Carbs',    val: `${Math.round(selected.carbohydrates * portion / 100)}`, unit: 'g', color: 'var(--accent3)' },
                  { label: 'Fats',     val: `${Math.round(selected.fats * portion / 100)}`, unit: 'g', color: 'var(--text2)' },
                ].map(n => (
                  <div key={n.label}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: n.color }}>{n.val}<span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 2 }}>{n.unit}</span></div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{n.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={handleLog} className="btn btn-primary btn-full" disabled={logging}>
                {logging ? 'Logging…' : 'Log This Meal'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'today' && (
        <div>
          {summary && (
            <div className="card" style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Today's Summary</div>
              <div className="progress-bar" style={{ marginBottom: 14, height: 7 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, summary.percentageConsumed)}%` }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
                {[
                  { label: 'Consumed',  val: `${summary.calories}`, unit: 'kcal', color: 'var(--accent)' },
                  { label: 'Remaining', val: `${Math.max(0, summary.remainingCalories)}`, unit: 'kcal', color: 'var(--success)' },
                  { label: 'Target',    val: `${summary.dailyTarget}`, unit: 'kcal', color: 'var(--text2)' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: s.color }}>
                      {s.val}<span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 2 }}>{s.unit}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todayMeals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <div className="empty-state-title">No meals logged today</div>
              <div className="empty-state-desc">Switch to "Log Meal" to add your first meal</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayMeals.map(m => (
                <div key={m._id} className="card" style={{ padding: '14px 16px' }}>
                  <div className="flex-between">
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{m.mealDetails.foodName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="tag tag-orange">{m.mealDetails.mealType}</span>
                        <span>{m.mealDetails.portionSize}g · {new Date(m.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent4)', fontSize: 15 }}>{m.mealDetails.nutritionInfo.calories}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>kcal</div>
                      </div>
                      <button onClick={() => handleDelete(m._id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                          fontSize: 15, padding: 4, transition: 'color 0.18s' }}
                        onMouseEnter={e => e.target.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text3)'}>✕</button>
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

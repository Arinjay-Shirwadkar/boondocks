import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api';
import PreferenceSliders, { DEFAULT_PREFERENCES, DEFAULT_WEIGHTS } from '../components/PreferenceSliders';

/* ---------- helpers ---------- */

const ROLE_LABELS = { seeker: 'Seeker', host: 'Host', both: 'Seeker and Host' };

const withDefaults = (user) => ({
  preferences: { ...DEFAULT_PREFERENCES, ...(user?.preferences || {}) },
  weights: { ...DEFAULT_WEIGHTS, ...(user?.priorityWeights || {}) },
});

/* ---------- small pieces ---------- */

function AccountBlock({ user }) {
  const rows = [
    ['Name', user.name],
    ['Email', user.email],
    ['Role', ROLE_LABELS[user.role] || user.role],
    ['Area', user.area || 'Not set'],
    ['Search radius', user.radiusKm != null ? `${user.radiusKm} km` : 'Not set'],
  ];

  return (
    <section className="card-brutal p-5" style={{ borderRadius: 0 }}>
      <h2 className="text-2xl font-bold mb-4">Account</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="border-4 border-crimson p-3" style={{ borderRadius: 0 }}>
            <dt className="text-cream-dim">{label}</dt>
            <dd className="text-lg font-bold break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SaveBar({ status, dirty, onSave }) {
  const label = status === 'saving' ? 'Saving…' : 'Save Preferences';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || status === 'saving'}
        className="btn-brutal disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderRadius: 0 }}
      >
        {label}
      </button>
      <p role="status" aria-live="polite" className="font-bold">
        {status === 'saved' && !dirty && <span>Saved. Your matches now use these preferences.</span>}
        {status === 'error' && (
          <span className="text-crimson">Couldn’t save your changes. Try again.</span>
        )}
        {status !== 'saved' && status !== 'error' && dirty && (
          <span className="text-cream-dim">You have unsaved changes.</span>
        )}
        {status !== 'saved' && status !== 'error' && !dirty && (
          <span className="text-cream-dim">Nothing to save.</span>
        )}
      </p>
    </div>
  );
}

/* ---------- page ---------- */

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [baseline, setBaseline] = useState(() => JSON.stringify(withDefaults(null)));
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error

  const applyUser = useCallback((u) => {
    const next = withDefaults(u);
    setUser(u);
    setPreferences(next.preferences);
    setWeights(next.weights);
    setBaseline(JSON.stringify(next));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/user/profile');
      applyUser(data);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Couldn’t load your profile.');
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(
    () => JSON.stringify({ preferences, weights }) !== baseline,
    [preferences, weights, baseline]
  );

  const handlePreferences = (next) => {
    setPreferences(next);
    setSaveStatus('idle');
  };

  const handleWeights = (next) => {
    setWeights(next);
    setSaveStatus('idle');
  };

  const save = async () => {
    setSaveStatus('saving');
    try {
      const { data } = await api.put('/user/preferences', { preferences, priorityWeights: weights });
      // server response is the source of truth; fall back to what we sent
      if (data && data.preferences) {
        applyUser({ ...user, ...data });
      } else {
        setBaseline(JSON.stringify({ preferences, weights }));
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-pitch text-cream font-comic p-4 md:p-8">
      <header className="border-4 border-crimson p-5 mb-8 shadow-brutal" style={{ borderRadius: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold">Your Profile</h1>
        <p className="text-cream-dim mt-2">
          Tell us how you live. Matches are scored against these preferences and how much each one matters to you.
        </p>
      </header>

      {loading && (
        <p role="status" className="border-4 border-crimson p-6 text-xl" style={{ borderRadius: 0 }}>
          Loading profile…
        </p>
      )}

      {!loading && loadError && (
        <div role="alert" className="border-4 border-crimson bg-ink p-6 flex flex-col gap-4" style={{ borderRadius: 0 }}>
          <p className="text-xl font-bold text-crimson">{loadError}</p>
          <button type="button" onClick={load} className="btn-brutal self-start" style={{ borderRadius: 0 }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && user && (
        <div className="flex flex-col gap-8 max-w-4xl">
          <AccountBlock user={user} />

          <section className="card-brutal p-5 flex flex-col gap-5" style={{ borderRadius: 0 }}>
            <h2 className="text-2xl font-bold">Living preferences</h2>
            <PreferenceSliders
              preferences={preferences}
              weights={weights}
              onPreferencesChange={handlePreferences}
              onWeightsChange={handleWeights}
            />
            <SaveBar status={saveStatus} dirty={dirty} onSave={save} />
          </section>
        </div>
      )}
    </main>
  );
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api';
import PreferenceSliders, { DEFAULT_PREFERENCES, DEFAULT_WEIGHTS } from '../components/PreferenceSliders';
import MapPicker from '../components/MapPicker';

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
    ['Area', user.area || user.location?.address || 'Not set'],
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

  // Location state
  const [userLocation, setUserLocation] = useState({
    coordinates: [72.8777, 19.0760],
    address: '',
    radiusKm: 5,
  });
  const [locSaveStatus, setLocSaveStatus] = useState('idle');

  const applyUser = useCallback((u) => {
    const next = withDefaults(u);
    setUser(u);
    setPreferences(next.preferences);
    setWeights(next.weights);
    setBaseline(JSON.stringify(next));

    if (u) {
      const coords = u.location?.coordinates || [72.8777, 19.0760];
      setUserLocation({
        coordinates: coords,
        address: u.location?.address || u.area || '',
        radiusKm: u.radiusKm || 5,
      });
    }
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

  const saveLocation = async () => {
    setLocSaveStatus('saving');
    try {
      const { data } = await api.put('/user/profile', {
        area: userLocation.address,
        radiusKm: userLocation.radiusKm,
        location: {
          type: 'Point',
          coordinates: userLocation.coordinates,
          address: userLocation.address,
        },
      });
      setUser((prev) => ({ ...prev, ...data }));
      setLocSaveStatus('saved');
      setTimeout(() => setLocSaveStatus('idle'), 3000);
    } catch {
      setLocSaveStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-pitch text-cream font-comic p-4 md:p-8">
      <header className="border-4 border-crimson p-5 mb-8 shadow-brutal" style={{ borderRadius: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold">Your Profile</h1>
        <p className="text-cream-dim mt-2">
          Tell us how you live. Matches are scored against these preferences, budget, and radius.
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

          {/* Interactive Map & Search Radius Section */}
          <section className="card-brutal p-5 flex flex-col gap-5" style={{ borderRadius: 0 }}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-crimson pb-3">
              <div>
                <h2 className="text-2xl font-bold">Interactive Search Location &amp; Radius</h2>
                <p className="text-xs text-cream-dim">
                  Click on the map to reposition your location pin and adjust your sharing search area.
                </p>
              </div>
              <button
                type="button"
                onClick={saveLocation}
                disabled={locSaveStatus === 'saving'}
                className="btn-brutal text-sm py-1.5 px-4"
              >
                {locSaveStatus === 'saving'
                  ? 'Saving Pin…'
                  : locSaveStatus === 'saved'
                  ? '✔ Location Saved'
                  : 'Save Location & Radius'}
              </button>
            </div>

            <MapPicker
              coordinates={userLocation.coordinates}
              address={userLocation.address}
              radiusKm={userLocation.radiusKm}
              onChange={({ coordinates, address, radiusKm }) => {
                setUserLocation({ coordinates, address, radiusKm });
                setLocSaveStatus('idle');
              }}
              onRadiusChange={(radiusKm) => {
                setUserLocation((prev) => ({ ...prev, radiusKm }));
                setLocSaveStatus('idle');
              }}
            />
          </section>

          {/* Living Preferences & Budget Section */}
          <section className="card-brutal p-5 flex flex-col gap-5" style={{ borderRadius: 0 }}>
            <h2 className="text-2xl font-bold">Living &amp; Budget Preferences</h2>
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

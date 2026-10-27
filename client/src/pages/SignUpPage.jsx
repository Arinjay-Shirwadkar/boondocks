import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PreferenceSliders, { DEFAULT_PREFERENCES, DEFAULT_WEIGHTS } from '../components/PreferenceSliders';

const ROLES = [
  { value: 'seeker', label: 'Seeker', hint: 'I need a bed' },
  { value: 'host', label: 'Host', hint: 'I have a bed' },
  { value: 'both', label: 'Both', hint: 'Both, actually' }
];
const STEP_TITLES = ['The basics', 'Where are you at?', 'Your vibe'];

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [account, setAccount] = useState({ name: '', email: '', password: '', role: 'seeker' });
  const [loc, setLoc] = useState({ area: '', radiusKm: 5, coordinates: null });
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  const canSkipLocation = account.role === 'host';

  const validate = () => {
    if (step === 1) {
      if (!account.name.trim()) return 'Name is required.';
      if (!/^\S+@\S+\.\S+$/.test(account.email)) return 'Enter a valid email.';
      if (account.password.length < 8) return 'Password must be at least 8 characters.';
    }
    if (step === 2 && !loc.area.trim()) return 'Tell us your area (or skip, if you are a host).';
    return '';
  };

  const next = () => {
    const msg = validate();
    if (msg) return setError(msg);
    setError('');
    setStep((s) => s + 1);
  };

  const skipLocation = () => {
    setLoc({ area: '', radiusKm: 5, coordinates: null });
    setError('');
    setStep(3);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported here.');
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc((l) => ({ ...l, coordinates: [pos.coords.longitude, pos.coords.latitude] })),
      () => setError('Could not get your location. Type your area instead.')
    );
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    const payload = {
      ...account,
      area: loc.area.trim(),
      location: loc.coordinates
        ? { address: loc.area.trim(), coordinates: loc.coordinates }
        : { address: loc.area.trim() },
      radiusKm: loc.radiusKm,
      preferences,
      priorityWeights: weights
    };
    try {
      const { data } = await api.post('/auth/signup', payload);
      login(data.token, data.user);
      navigate(account.role === 'host' ? '/profile' : '/matches');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-5xl font-black uppercase text-crimson mb-1">Boondocks</h1>
        <p className="mb-6 font-bold text-cream-dim">Find your people. Then find the bed.</p>

        {/* progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`flex-1 border-4 border-crimson py-1 text-center font-black uppercase text-sm ${
                n <= step ? 'bg-crimson text-cream' : 'bg-black text-cream/50'
              }`}
            >
              {n}
            </div>
          ))}
        </div>

        <div className="card-brutal">
          <h2 className="text-2xl font-black uppercase mb-5">
            Step {step}/3 — {STEP_TITLES[step - 1]}
          </h2>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <input className="input-brutal" placeholder="Name" value={account.name}
                onChange={(e) => setAccount({ ...account, name: e.target.value })} />
              <input className="input-brutal" type="email" placeholder="Email" value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })} />
              <input className="input-brutal" type="password" placeholder="Password (min 8 chars)" value={account.password}
                onChange={(e) => setAccount({ ...account, password: e.target.value })} />

              <div>
                <p className="font-black uppercase mb-2">I am a…</p>
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map((r) => (
                    <button
                      type="button" key={r.value}
                      onClick={() => setAccount({ ...account, role: r.value })}
                      className={`border-4 p-3 text-left font-black uppercase ${
                        account.role === r.value
                          ? 'bg-crimson border-cream text-cream'
                          : 'bg-black border-crimson text-cream hover:bg-crimson-dark'
                      }`}
                    >
                      {r.label}
                      <span className="block text-xs font-bold normal-case opacity-80">{r.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <input className="input-brutal" placeholder="Area name (e.g. Kothrud, Pune)" value={loc.area}
                onChange={(e) => setLoc({ ...loc, area: e.target.value })} />

              <button type="button" className="btn-ghost" onClick={useMyLocation}>
                {loc.coordinates ? '✔ Location captured' : 'Use my location'}
              </button>

              <div>
                <div className="flex justify-between font-black uppercase">
                  <span>Search radius</span>
                  <span className="text-crimson">{loc.radiusKm} km</span>
                </div>
                <input type="range" min="1" max="50" value={loc.radiusKm}
                  onChange={(e) => setLoc({ ...loc, radiusKm: Number(e.target.value) })}
                  className="w-full mt-2 accent-crimson" />
              </div>

              {canSkipLocation && (
                <p className="text-sm font-bold text-cream-dim">
                  Hosts can skip this. Your listing carries its own address.
                </p>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <PreferenceSliders
              preferences={preferences} weights={weights}
              onPreferencesChange={setPreferences} onWeightsChange={setWeights}
            />
          )}

          {error && (
            <p className="mt-5 border-4 border-crimson bg-crimson-dark p-3 font-black">{error}</p>
          )}

          {/* NAV */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="btn-ghost"
              onClick={() => { setError(''); setStep((s) => s - 1); }}
              disabled={step === 1 || loading}>
              Back
            </button>

            <div className="flex gap-3">
              {step === 2 && canSkipLocation && (
                <button type="button" className="btn-ghost" onClick={skipLocation}>Skip</button>
              )}
              {step < 3 ? (
                <button type="button" className="btn-brutal" onClick={next}>Next</button>
              ) : (
                <button type="button" className="btn-brutal" onClick={submit} disabled={loading}>
                  {loading ? 'Creating…' : 'Create account'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-5 font-bold">
          Already in? <Link to="/login" className="text-crimson underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
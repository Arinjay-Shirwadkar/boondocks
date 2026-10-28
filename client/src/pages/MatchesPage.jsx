import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';

/* ---------- helpers ---------- */

const CATEGORY_LABELS = {
  food: 'Food',
  vices: 'Vices',
  price: 'Budget',
  pets: 'Pets',
  guests: 'Guests',
  sleepTime: 'Sleep time',
};

const RULE_LABELS = {
  foodAllowed: 'Food',
  viceTolerance: 'Vice tolerance',
  petsAllowed: 'Pets',
  guestPolicy: 'Guests',
  sleepPolicy: 'Sleep time',
};

const formatRent = (n) => `₹${Number(n || 0).toLocaleString('en-IN')} / person`;

const formatDistance = (d) =>
  typeof d === 'number' ? `${d < 10 ? d.toFixed(1) : Math.round(d)} km away` : 'Distance unknown';

const typeLabel = (t) => (t === 'PG' ? 'PG' : 'Sharing Flat');

const imageUrl = (img) => (typeof img === 'string' ? img : img?.url || '');

const formatValue = (v) => {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.join(', ');
  if (v && typeof v === 'object') return Object.values(v).join(', ');
  return String(v);
};

// rules is an object; amenities may be an array or an object
const toRows = (data, labels = {}) => {
  if (!data) return [];
  if (Array.isArray(data)) return data.map((item) => ({ label: formatValue(item), value: null }));
  return Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => ({ label: labels[k] || k, value: formatValue(v) }));
};

/* ---------- small pieces ---------- */

function MatchBadge({ score }) {
  return (
    <span
      className="inline-block bg-crimson text-cream font-bold px-3 py-1 border-4 border-crimson"
      style={{ borderRadius: 0 }}
    >
      {Math.round(score)}% Compatible
    </span>
  );
}

function MatchCard({ match, onOpen }) {
  const { property, matchScore, distanceKm } = match;
  const cover = imageUrl(property.images?.[0]);

  return (
    <button
      type="button"
      onClick={() => onOpen(match)}
      className="card-brutal text-left w-full flex flex-col gap-3 p-0 hover:shadow-brutal focus:outline-none focus-visible:shadow-brutal-cream"
      style={{ borderRadius: 0 }}
    >
      {cover && (
        <img
          src={cover}
          alt=""
          className="w-full h-40 object-cover border-b-4 border-crimson"
          style={{ borderRadius: 0 }}
        />
      )}
      <div className="p-4 flex flex-col gap-3 w-full">
        <div className="flex items-start justify-between gap-3">
          <MatchBadge score={matchScore} />
          <span className="chip">{typeLabel(property.type)}</span>
        </div>
        <h2 className="text-xl font-bold leading-tight break-words">{property.title}</h2>
        <p className="text-2xl font-bold text-crimson">{formatRent(property.rentPerHead)}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-cream-dim">
          <span>{formatDistance(distanceKm)}</span>
          <span>
            {property.availableBeds} of {property.totalBeds} beds left
          </span>
        </div>
      </div>
    </button>
  );
}

function BreakdownList({ title, items, emptyText }) {
  return (
    <section className="border-4 border-crimson p-4" style={{ borderRadius: 0 }}>
      <h3 className="text-lg font-bold mb-3">
        {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <p className="text-cream-dim">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((b, i) => (
            <li key={`${b.category}-${i}`} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{CATEGORY_LABELS[b.category] || b.category}</p>
                <p className="text-cream-dim">{b.detail}</p>
              </div>
              <span className="chip shrink-0">Weight {b.weight}/5</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DetailRows({ title, rows }) {
  if (!rows.length) return null;
  return (
    <section className="border-4 border-crimson p-4" style={{ borderRadius: 0 }}>
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <ul className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <li key={i} className="flex justify-between gap-3 border-b-2 border-crimson pb-1 last:border-b-0">
            <span>{r.label}</span>
            {r.value !== null && <span className="text-cream-dim text-right">{r.value}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

const REQUEST_BUTTON_TEXT = {
  idle: 'Send Join Request',
  sending: 'Sending…',
  sent: 'Request Sent',
  exists: 'Already Requested',
  error: 'Try Again',
};

function RequestButton({ status, onClick }) {
  const locked = status === 'sending' || status === 'sent' || status === 'exists';
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={locked}
        className="btn-brutal w-full disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ borderRadius: 0 }}
      >
        {REQUEST_BUTTON_TEXT[status]}
      </button>
      <p role="status" aria-live="polite" className="min-h-[1.5rem]">
        {status === 'sent' && 'Sent. The host will see your request in their dashboard.'}
        {status === 'exists' && 'You already asked to join this place. Wait for the host to reply.'}
        {status === 'error' && (
          <span className="text-crimson font-bold">Couldn’t send the request. Check your connection and try again.</span>
        )}
      </p>
    </div>
  );
}

function Drawer({ match, requestStatus, onSend, onClose }) {
  const [shown, setShown] = useState(false);
  const closeRef = useRef(null);
  const { property, matchScore, distanceKm, breakdown = [] } = match;

  // slide in after first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Escape closes, body scroll locked while open, focus moves into the drawer
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const compatible = breakdown.filter((b) => b.status === 'compatible');
  const conflicts = breakdown.filter((b) => b.status === 'conflict');
  const neutral = breakdown.filter((b) => b.status === 'neutral');
  const cover = imageUrl(property.images?.[0]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={property.title}
        className="relative h-full w-full max-w-xl overflow-y-auto bg-pitch text-cream border-l-4 border-crimson transition-transform duration-200 motion-reduce:transition-none"
        style={{ transform: shown ? 'translateX(0)' : 'translateX(100%)', borderRadius: 0 }}
      >
        <div className="p-5 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <MatchBadge score={matchScore} />
              <h2 className="text-2xl font-bold break-words">{property.title}</h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="btn-ghost shrink-0"
              style={{ borderRadius: 0 }}
              aria-label="Close details"
            >
              Close
            </button>
          </div>

          {cover && (
            <img
              src={cover}
              alt=""
              className="w-full h-52 object-cover border-4 border-crimson"
              style={{ borderRadius: 0 }}
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <span className="chip chip-on">{typeLabel(property.type)}</span>
            <span className="text-xl font-bold text-crimson">{formatRent(property.rentPerHead)}</span>
          </div>
          <div className="text-cream-dim flex flex-col gap-1">
            <p>{property.location?.address || 'Address not listed'}</p>
            <p>
              {formatDistance(distanceKm)} · {property.availableBeds} of {property.totalBeds} beds left
            </p>
            {property.hostId?.name && <p>Hosted by {property.hostId.name}</p>}
          </div>

          <RequestButton status={requestStatus} onClick={onSend} />

          <BreakdownList title="COMPATIBLE" items={compatible} emptyText="Nothing lines up yet on your priorities." />
          <BreakdownList title="CONFLICTS" items={conflicts} emptyText="No conflicts with your preferences." />
          {neutral.length > 0 && (
            <p className="text-cream-dim">
              No effect on score: {neutral.map((b) => CATEGORY_LABELS[b.category] || b.category).join(', ')}.
            </p>
          )}

          <DetailRows title="House rules" rows={toRows(property.rules, RULE_LABELS)} />
          <DetailRows title="Amenities" rows={toRows(property.amenities)} />
        </div>
      </aside>
    </div>
  );
}

/* ---------- page ---------- */

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  // propertyId -> 'sending' | 'sent' | 'exists' | 'error'
  const [requestStatus, setRequestStatus] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/matches');
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t load your matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeDrawer = useCallback(() => setSelected(null), []);

  const sendRequest = async (propertyId) => {
    setRequestStatus((s) => ({ ...s, [propertyId]: 'sending' }));
    try {
      await api.post('/requests', { propertyId });
      setRequestStatus((s) => ({ ...s, [propertyId]: 'sent' }));
    } catch (err) {
      const status = err.response?.status === 409 ? 'exists' : 'error';
      setRequestStatus((s) => ({ ...s, [propertyId]: status }));
    }
  };

  return (
    <main className="min-h-screen bg-pitch text-cream font-comic p-4 md:p-8">
      <header className="border-4 border-crimson p-5 mb-8 shadow-brutal" style={{ borderRadius: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold">Your Matches</h1>
        <p className="text-cream-dim mt-2">
          Sharing PGs and flats, ranked by how well the people and rules fit your priorities.
        </p>
      </header>

      {loading && (
        <p role="status" className="border-4 border-crimson p-6 text-xl" style={{ borderRadius: 0 }}>
          Loading matches…
        </p>
      )}

      {!loading && error && (
        <div role="alert" className="border-4 border-crimson bg-ink p-6 flex flex-col gap-4" style={{ borderRadius: 0 }}>
          <p className="text-xl font-bold text-crimson">{error}</p>
          <button type="button" onClick={load} className="btn-brutal self-start" style={{ borderRadius: 0 }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="border-4 border-crimson p-6 flex flex-col gap-2" style={{ borderRadius: 0 }}>
          <p className="text-xl font-bold">No matches yet.</p>
          <p className="text-cream-dim">
            Widen your search radius or update your preferences on the profile page, then check back.
          </p>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.property._id} match={m} onOpen={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <Drawer
          match={selected}
          requestStatus={requestStatus[selected.property._id] || 'idle'}
          onSend={() => sendRequest(selected.property._id)}
          onClose={closeDrawer}
        />
      )}
    </main>
  );
}
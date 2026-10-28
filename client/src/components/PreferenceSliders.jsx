export const DEFAULT_PREFERENCES = {
  food: 'any',
  vices: 'none',
  alcohol: false,
  smoking: false,
  minPrice: 3000,
  maxPrice: 30000,
  pets: false,
  guests: 'occasional',
  sleepTime: 'early-bird',
};

export const DEFAULT_WEIGHTS = {
  food: 3,
  vices: 3,
  price: 3,
  pets: 3,
  guests: 3,
  sleepTime: 3,
};

const WEIGHT_LABELS = ['', 'MEH', 'LOW', 'MEDIUM', 'HIGH', 'DEALBREAKER'];

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`chip ${value === o.value ? 'chip-on' : ''}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const YES_NO = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
];

function PriorityRow({ value = 3, onChange }) {
  return (
    <div className="mt-4 border-t-4 border-crimson pt-3">
      <div className="flex justify-between text-sm font-black uppercase">
        <span>How much does this matter?</span>
        <span className="text-crimson">
          {value}/5 · {WEIGHT_LABELS[value] || 'MEDIUM'}
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2 accent-crimson cursor-pointer"
      />
    </div>
  );
}

function Block({ title, children }) {
  return (
    <section className="border-4 border-crimson bg-black p-4">
      <h3 className="text-xl font-black uppercase mb-3 text-crimson">{title}</h3>
      {children}
    </section>
  );
}

export default function PreferenceSliders({
  preferences = DEFAULT_PREFERENCES,
  weights = DEFAULT_WEIGHTS,
  onPreferencesChange,
  onWeightsChange,
}) {
  const setPref = (k, v) => onPreferencesChange({ ...preferences, [k]: v });
  const setW = (k, v) => onWeightsChange({ ...weights, [k]: v });

  // Resolve current vice value
  const currentVice =
    preferences.vices ||
    (preferences.alcohol && preferences.smoking
      ? 'all-legal'
      : preferences.smoking
      ? 'smoking'
      : preferences.alcohol
      ? 'alcohol'
      : 'none');

  const handleViceChange = (val) => {
    onPreferencesChange({
      ...preferences,
      vices: val,
      alcohol: val === 'alcohol' || val === 'all-legal',
      smoking: val === 'smoking' || val === 'all-legal',
    });
  };

  const minPrice = preferences.minPrice != null ? preferences.minPrice : 3000;
  const maxPrice = preferences.maxPrice != null ? preferences.maxPrice : 30000;

  return (
    <div className="space-y-5">
      {/* 1. Food */}
      <Block title="Food">
        <Segmented
          value={preferences.food || 'any'}
          onChange={(v) => setPref('food', v)}
          options={[
            { value: 'veg', label: 'Veg' },
            { value: 'non-veg', label: 'Non-Veg' },
            { value: 'any', label: 'Any' },
          ]}
        />
        <PriorityRow value={weights.food} onChange={(v) => setW('food', v)} />
      </Block>

      {/* 2. Budget / Price Range */}
      <Block title="Budget Range (₹ / Month)">
        <p className="text-xs font-bold text-cream-dim mb-3">
          Set your preferred monthly rent budget per bed:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black uppercase text-cream block mb-1">
              Min Budget (₹)
            </label>
            <input
              type="number"
              min="1000"
              max="100000"
              step="500"
              value={minPrice}
              onChange={(e) => setPref('minPrice', Number(e.target.value))}
              className="input-brutal text-base py-1.5"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase text-cream block mb-1">
              Max Budget (₹)
            </label>
            <input
              type="number"
              min="1000"
              max="100000"
              step="500"
              value={maxPrice}
              onChange={(e) => setPref('maxPrice', Number(e.target.value))}
              className="input-brutal text-base py-1.5"
            />
          </div>
        </div>
        <div className="mt-3">
          <input
            type="range"
            min="2000"
            max="60000"
            step="1000"
            value={maxPrice}
            onChange={(e) => setPref('maxPrice', Number(e.target.value))}
            className="w-full accent-crimson cursor-pointer"
          />
          <div className="flex justify-between text-xs font-bold text-cream-dim mt-1">
            <span>₹{minPrice.toLocaleString('en-IN')} min</span>
            <span className="text-crimson font-black">₹{maxPrice.toLocaleString('en-IN')} max target</span>
          </div>
        </div>
        <PriorityRow value={weights.price} onChange={(v) => setW('price', v)} />
      </Block>

      {/* 3. Vices (Alcohol & Smoking only - zero drugs) */}
      <Block title="Vices (Legal Only)">
        <p className="text-xs font-bold text-cream-dim mb-3">
          What vices are you comfortable having around the living space?
        </p>
        <Segmented
          value={currentVice}
          onChange={handleViceChange}
          options={[
            { value: 'none', label: 'Strictly None' },
            { value: 'alcohol', label: 'Alcohol OK' },
            { value: 'smoking', label: 'Smoking OK' },
            { value: 'all-legal', label: 'All Legal (Alcohol & Smoking OK)' },
          ]}
        />
        <PriorityRow value={weights.vices} onChange={(v) => setW('vices', v)} />
      </Block>

      {/* 4. Pets */}
      <Block title="Pets">
        <Segmented
          value={Boolean(preferences.pets)}
          onChange={(v) => setPref('pets', v)}
          options={YES_NO}
        />
        <PriorityRow value={weights.pets} onChange={(v) => setW('pets', v)} />
      </Block>

      {/* 5. Guests */}
      <Block title="Guests">
        <Segmented
          value={preferences.guests || 'occasional'}
          onChange={(v) => setPref('guests', v)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'occasional', label: 'Sometimes' },
            { value: 'frequent', label: 'Often' },
          ]}
        />
        <PriorityRow value={weights.guests} onChange={(v) => setW('guests', v)} />
      </Block>

      {/* 6. Sleep schedule */}
      <Block title="Sleep schedule">
        <Segmented
          value={preferences.sleepTime || 'early-bird'}
          onChange={(v) => setPref('sleepTime', v)}
          options={[
            { value: 'night-owl', label: 'Night owl' },
            { value: 'early-bird', label: 'Early bird' },
          ]}
        />
        <PriorityRow value={weights.sleepTime} onChange={(v) => setW('sleepTime', v)} />
      </Block>
    </div>
  );
}

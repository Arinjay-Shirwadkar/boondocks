export const DEFAULT_PREFERENCES = {
  food: 'any', alcohol: false, smoking: false, drugs: false,
  pets: false, guests: 'occasional', sleepTime: 'early-bird'
};
export const DEFAULT_WEIGHTS = { food: 3, vices: 3, pets: 3, guests: 3, sleepTime: 3 };

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

const YES_NO = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }];

function PriorityRow({ value, onChange }) {
  return (
    <div className="mt-4 border-t-4 border-crimson pt-3">
      <div className="flex justify-between text-sm font-black uppercase">
        <span>How much does this matter?</span>
        <span className="text-crimson">{value}/5 · {WEIGHT_LABELS[value]}</span>
      </div>
      <input
        type="range" min="1" max="5" step="1" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2 accent-crimson"
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

export default function PreferenceSliders({ preferences, weights, onPreferencesChange, onWeightsChange }) {
  const setPref = (k, v) => onPreferencesChange({ ...preferences, [k]: v });
  const setW = (k, v) => onWeightsChange({ ...weights, [k]: v });

  return (
    <div className="space-y-5">
      <Block title="Food">
        <Segmented
          value={preferences.food} onChange={(v) => setPref('food', v)}
          options={[{ value: 'veg', label: 'Veg' }, { value: 'non-veg', label: 'Non-Veg' }, { value: 'any', label: 'Any' }]}
        />
        <PriorityRow value={weights.food} onChange={(v) => setW('food', v)} />
      </Block>

      <Block title="Vices (I'm okay with…)">
        {['alcohol', 'smoking', 'drugs'].map((k) => (
          <div key={k} className="flex items-center justify-between mb-2">
            <span className="font-bold uppercase">{k}</span>
            <Segmented value={preferences[k]} onChange={(v) => setPref(k, v)} options={YES_NO} />
          </div>
        ))}
        <PriorityRow value={weights.vices} onChange={(v) => setW('vices', v)} />
      </Block>

      <Block title="Pets">
        <Segmented value={preferences.pets} onChange={(v) => setPref('pets', v)} options={YES_NO} />
        <PriorityRow value={weights.pets} onChange={(v) => setW('pets', v)} />
      </Block>

      <Block title="Guests">
        <Segmented
          value={preferences.guests} onChange={(v) => setPref('guests', v)}
          options={[{ value: 'none', label: 'None' }, { value: 'occasional', label: 'Sometimes' }, { value: 'frequent', label: 'Often' }]}
        />
        <PriorityRow value={weights.guests} onChange={(v) => setW('guests', v)} />
      </Block>

      <Block title="Sleep schedule">
        <Segmented
          value={preferences.sleepTime} onChange={(v) => setPref('sleepTime', v)}
          options={[{ value: 'night-owl', label: 'Night owl' }, { value: 'early-bird', label: 'Early bird' }]}
        />
        <PriorityRow value={weights.sleepTime} onChange={(v) => setW('sleepTime', v)} />
      </Block>
    </div>
  );
}
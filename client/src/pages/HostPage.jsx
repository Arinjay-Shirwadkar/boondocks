import { useCallback, useEffect, useState } from "react";
import axios from "axios";

// Boondoacks design tokens
const C = { black: "#000000", red: "#DC143C", darkRed: "#8B0000", cream: "#FFFDD0" };
const FONT = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif";

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const inputStyle = {
  fontFamily: FONT,
  background: C.black,
  color: C.cream,
  border: `3px solid ${C.red}`,
  borderRadius: 0,
};

const blockBtn = (bg, fg) => ({
  fontFamily: FONT,
  background: bg,
  color: fg,
  border: `3px solid ${C.red}`,
  borderRadius: 0,
  boxShadow: `4px 4px 0 ${C.darkRed}`,
  cursor: "pointer",
});

const EMPTY_FORM = {
  title: "",
  type: "PG",
  address: "",
  rentPerHead: "",
  totalBeds: "",
  availableBeds: "",
  foodAllowed: "any",
  viceTolerance: "none",
  petsAllowed: false,
  guestPolicy: "occasional",
  sleepPolicy: "flexible",
  images: "",
};

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 font-bold">
      {label}
      {children}
    </label>
  );
}

/* ---------- Add property form ---------- */
function PropertyForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const total = Number(form.totalBeds);
    const available = Number(form.availableBeds);
    if (available > total) {
      setError("Available beds can't be more than total beds.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/properties", {
        title: form.title,
        type: form.type,
        location: { address: form.address },
        rentPerHead: Number(form.rentPerHead),
        totalBeds: total,
        availableBeds: available,
        rules: {
          foodAllowed: form.foodAllowed,
          viceTolerance: form.viceTolerance,
          petsAllowed: form.petsAllowed,
          guestPolicy: form.guestPolicy,
          sleepPolicy: form.sleepPolicy,
        },
        images: form.images
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setForm(EMPTY_FORM);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Could not list the property. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 md:grid-cols-2 p-5"
      style={{ border: `6px solid ${C.red}`, boxShadow: `10px 10px 0 ${C.darkRed}` }}
    >
      <Field label="Listing title">
        <input name="title" value={form.title} onChange={set} required className="p-2" style={inputStyle} />
      </Field>

      <Field label="Type">
        <select name="type" value={form.type} onChange={set} className="p-2" style={inputStyle}>
          <option value="PG">PG</option>
          <option value="Sharing Flat">Sharing Flat</option>
        </select>
      </Field>

      <Field label="Location">
        <input name="address" value={form.address} onChange={set} required className="p-2" style={inputStyle} />
      </Field>

      <Field label="Rent per person (₹/month)">
        <input type="number" min="0" name="rentPerHead" value={form.rentPerHead} onChange={set} required className="p-2" style={inputStyle} />
      </Field>

      <Field label="Total beds">
        <input type="number" min="1" name="totalBeds" value={form.totalBeds} onChange={set} required className="p-2" style={inputStyle} />
      </Field>

      <Field label="Available beds">
        <input type="number" min="0" name="availableBeds" value={form.availableBeds} onChange={set} required className="p-2" style={inputStyle} />
      </Field>

      <Field label="Food rule">
        <select name="foodAllowed" value={form.foodAllowed} onChange={set} className="p-2" style={inputStyle}>
          <option value="veg">Veg only</option>
          <option value="non-veg">Non-veg allowed</option>
          <option value="any">Anything goes</option>
        </select>
      </Field>

      <Field label="Vices tolerance">
        <select name="viceTolerance" value={form.viceTolerance} onChange={set} className="p-2" style={inputStyle}>
          <option value="none">None</option>
          <option value="alcohol">Alcohol okay</option>
          <option value="smoking">Smoking okay</option>
          <option value="all">Alcohol, smoking, all okay</option>
        </select>
      </Field>

      <Field label="Guest policy">
        <select name="guestPolicy" value={form.guestPolicy} onChange={set} className="p-2" style={inputStyle}>
          <option value="none">No guests</option>
          <option value="occasional">Occasional guests</option>
          <option value="anytime">Guests anytime</option>
        </select>
      </Field>

      <Field label="Sleep time">
        <select name="sleepPolicy" value={form.sleepPolicy} onChange={set} className="p-2" style={inputStyle}>
          <option value="early">Early sleepers (before 11pm)</option>
          <option value="flexible">Flexible</option>
          <option value="night-owl">Night owls (after 1am)</option>
        </select>
      </Field>

      <Field label="Image URLs (comma separated)">
        <input name="images" value={form.images} onChange={set} className="p-2" style={inputStyle} />
      </Field>

      <label className="flex items-center gap-3 font-bold self-end">
        <input
          type="checkbox"
          name="petsAllowed"
          checked={form.petsAllowed}
          onChange={set}
          style={{ width: 24, height: 24, accentColor: C.red }}
        />
        Pets allowed
      </label>

      {error && (
        <div
          role="alert"
          className="md:col-span-2 p-3 font-bold"
          style={{ background: C.red, color: C.cream, border: `3px solid ${C.cream}` }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="md:col-span-2 p-3 text-xl font-bold"
        style={{ ...blockBtn(C.cream, C.black), opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Listing..." : "List this place"}
      </button>
    </form>
  );
}

/* ---------- One incoming request ---------- */
function RequestRow({ request, onDecide, onOpenChat }) {
  const seeker = typeof request.seekerId === "object" ? request.seekerId : null;
  const name = seeker?.name || "Unknown seeker";

  return (
    <div className="p-3 flex flex-col gap-2" style={{ border: `3px solid ${C.cream}` }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold">{name}</span>
        <span
          className="px-2 font-bold"
          style={{
            background: request.status === "rejected" ? C.darkRed : request.status === "accepted" ? C.cream : C.red,
            color: request.status === "accepted" ? C.black : C.cream,
          }}
        >
          {request.status}
        </span>
      </div>

      {request.status === "pending" && (
        <div className="flex gap-3">
          <button className="px-4 py-1 font-bold" style={blockBtn(C.cream, C.black)} onClick={() => onDecide(request._id, "accepted")}>
            Accept
          </button>
          <button className="px-4 py-1 font-bold" style={blockBtn(C.red, C.cream)} onClick={() => onDecide(request._id, "rejected")}>
            Reject
          </button>
        </div>
      )}

      {request.status === "accepted" && (
        <button className="px-4 py-1 font-bold self-start" style={blockBtn(C.red, C.cream)} onClick={() => onOpenChat(request)}>
          Open Chat Interface
        </button>
      )}
    </div>
  );
}

/* ---------- Chat panel (reads request.chatHistory) ---------- */
function ChatPanel({ request, onClose }) {
  const history = request.chatHistory || [];
  return (
    <div
      className="p-4 mt-3 flex flex-col gap-2"
      style={{ border: `4px solid ${C.red}`, background: C.black }}
    >
      <div className="flex justify-between items-center">
        <strong>Chat with {request.seekerId?.name || "seeker"}</strong>
        <button className="px-3 font-bold" style={blockBtn(C.cream, C.black)} onClick={onClose}>
          Close
        </button>
      </div>
      {history.length === 0 ? (
        <p>No messages yet. Hook up the chat endpoint here when the team adds it.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {history.map((m, i) => (
            <li key={i} style={{ borderLeft: `4px solid ${C.red}`, paddingLeft: 8 }}>
              {m.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Page ---------- */
export default function HostPage() {
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [p, r] = await Promise.all([api.get("/api/properties/mine"), api.get("/api/requests/host")]);
      setProperties(p.data);
      setRequests(r.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your listings. Refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id, status) => {
    try {
      await api.put(`/api/requests/${id}/status`, { status });
      setRequests((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
    } catch (err) {
      setError(err.response?.data?.message || `Could not mark request ${status}.`);
    }
  };

  const requestsFor = (propertyId) =>
    requests.filter((r) => (typeof r.propertyId === "object" ? r.propertyId._id : r.propertyId) === propertyId);

  return (
    <main className="min-h-screen p-4 sm:p-8" style={{ background: C.black, color: C.cream, fontFamily: FONT }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        <header className="p-5" style={{ background: C.red, border: `6px solid ${C.cream}`, boxShadow: `10px 10px 0 ${C.darkRed}` }}>
          <h1 className="text-3xl sm:text-5xl font-bold" style={{ color: C.cream }}>
            Broadcast Your Accommodation (Sharing Only)
          </h1>
        </header>

        <section>
          <h2 className="text-2xl font-bold mb-4">Add a sharing PG or flat</h2>
          <PropertyForm onCreated={load} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">My Listed Properties</h2>

          {error && (
            <div role="alert" className="p-3 mb-4 font-bold" style={{ background: C.red, border: `3px solid ${C.cream}` }}>
              {error}
            </div>
          )}

          {loading ? (
            <p>Loading your listings...</p>
          ) : properties.length === 0 ? (
            <p className="p-4" style={{ border: `4px dashed ${C.red}` }}>
              Nothing listed yet. Fill in the form above to post your first place.
            </p>
          ) : (
            <div className="grid gap-8">
              {properties.map((p) => {
                const reqs = requestsFor(p._id);
                return (
                  <article key={p._id} className="p-5" style={{ border: `5px solid ${C.red}`, boxShadow: `8px 8px 0 ${C.darkRed}` }}>
                    <div className="flex flex-wrap justify-between gap-2">
                      <h3 className="text-2xl font-bold">{p.title}</h3>
                      <span className="px-3 font-bold" style={{ background: C.cream, color: C.black }}>
                        {p.type}
                      </span>
                    </div>
                    <p className="mt-1">{p.location?.address || p.location}</p>
                    <p className="mt-2 font-bold">
                      ₹{p.rentPerHead} per person · {p.availableBeds} of {p.totalBeds} beds free
                    </p>
                    {p.rules && (
                      <p className="mt-1">
                        Food: {p.rules.foodAllowed} · Vices: {p.rules.viceTolerance} · Pets:{" "}
                        {p.rules.petsAllowed ? "yes" : "no"} · Guests: {p.rules.guestPolicy} · Sleep: {p.rules.sleepPolicy}
                      </p>
                    )}

                    <h4 className="text-xl font-bold mt-5 mb-2">Tenant requests ({reqs.length})</h4>
                    {reqs.length === 0 ? (
                      <p>No requests for this place yet.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {reqs.map((r) => (
                          <div key={r._id}>
                            <RequestRow request={r} onDecide={decide} onOpenChat={setActiveChat} />
                            {activeChat?._id === r._id && <ChatPanel request={r} onClose={() => setActiveChat(null)} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

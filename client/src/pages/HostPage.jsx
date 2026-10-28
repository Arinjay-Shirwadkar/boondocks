import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import MapPicker from "../components/MapPicker";
import ChatPanel from "../components/ChatPanel";

// Boondocks design tokens
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

const AVAILABLE_AMENITIES = [
  "Wi-Fi",
  "AC",
  "Washing Machine",
  "Kitchen Access",
  "Power Backup",
  "Maid Service",
  "RO Water",
  "Parking",
  "CCTV",
  "Geyser",
];

const EMPTY_FORM = {
  title: "",
  type: "PG",
  address: "Mumbai, Maharashtra",
  coordinates: [72.8777, 19.0760],
  rentPerHead: "",
  totalBeds: "",
  availableBeds: "",
  foodAllowed: "any",
  viceTolerance: "none",
  petsAllowed: false,
  guestPolicy: "occasional",
  sleepPolicy: "flexible",
  amenities: ["Wi-Fi", "RO Water"],
  images: [],
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
  const [uploadingImages, setUploadingImages] = useState(false);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
    setUploadingImages(true);
    setError("");
    try {
      const res = await api.post("/api/properties/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.urls) {
        setForm((prev) => ({
          ...prev,
          images: Array.from(new Set([...(Array.isArray(prev.images) ? prev.images : []), ...res.data.urls])),
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image(s).");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove),
    }));
  };

  const toggleAmenity = (item) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists ? prev.amenities.filter((a) => a !== item) : [...prev.amenities, item],
      };
    });
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
        location: {
          type: "Point",
          coordinates: form.coordinates || [72.8777, 19.0760],
          address: form.address,
        },
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
        amenities: form.amenities,
        images: Array.isArray(form.images) ? form.images : [],
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
      style={{ border: `6px solid ${C.red}`, boxShadow: `10px 10px 0 ${C.darkRed}`, background: C.black }}
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

      {/* Interactive Leaflet Map Pin Picker for Location */}
      <div className="md:col-span-2 flex flex-col gap-1 border-2 border-crimson p-3 bg-black">
        <span className="font-bold text-sm text-cream uppercase">
          📍 Property Location (Click Map to Drop Pin)
        </span>
        <MapPicker
          coordinates={form.coordinates}
          address={form.address}
          showRadius={false}
          height="280px"
          onChange={({ coordinates, address }) => {
            setForm((prev) => ({ ...prev, coordinates, address }));
          }}
        />
        <label className="text-xs font-bold text-cream-dim mt-2 uppercase">Selected Address / Landmark:</label>
        <input
          name="address"
          value={form.address}
          onChange={set}
          required
          placeholder="Detailed street, building, area"
          className="p-2"
          style={inputStyle}
        />
      </div>

      <Field label="Rent per person (₹/month)">
        <input
          type="number"
          min="0"
          name="rentPerHead"
          value={form.rentPerHead}
          onChange={set}
          required
          className="p-2"
          style={inputStyle}
        />
      </Field>

      <Field label="Total beds">
        <input
          type="number"
          min="1"
          name="totalBeds"
          value={form.totalBeds}
          onChange={set}
          required
          className="p-2"
          style={inputStyle}
        />
      </Field>

      <Field label="Available beds">
        <input
          type="number"
          min="0"
          name="availableBeds"
          value={form.availableBeds}
          onChange={set}
          required
          className="p-2"
          style={inputStyle}
        />
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
          <option value="none">None (Strictly clean)</option>
          <option value="alcohol">Alcohol okay</option>
          <option value="smoking">Smoking okay</option>
          <option value="all-legal">All Legal (Alcohol &amp; Smoking OK)</option>
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

      {/* Amenities Section */}
      <div className="md:col-span-2 flex flex-col gap-2">
        <span className="font-bold">Select Amenities:</span>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_AMENITIES.map((item) => {
            const active = form.amenities.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleAmenity(item)}
                className={`chip ${active ? "chip-on" : ""}`}
              >
                {active ? "✔ " : "+ "}
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Local Image File Uploads Section (Multer) */}
      <div className="md:col-span-2 border-2 border-crimson p-3 bg-black flex flex-col gap-2">
        <label className="font-bold text-sm text-cream uppercase flex flex-col gap-1">
          📸 Upload Property Images (Stored Locally):
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploadingImages}
            className="p-2 border-2 border-crimson bg-black text-cream text-xs file:border-2 file:border-cream file:bg-crimson file:text-cream file:font-black file:uppercase file:text-xs file:py-1 file:px-3 file:mr-3 file:cursor-pointer hover:file:bg-[#8B0000]"
          />
        </label>
        {uploadingImages && (
          <p className="text-xs text-crimson font-black animate-pulse">Uploading images to server...</p>
        )}

        {Array.isArray(form.images) && form.images.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {form.images.map((img, idx) => (
              <div key={idx} className="relative group border-2 border-crimson w-24 h-20 bg-black overflow-hidden">
                <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-0 right-0 bg-crimson text-cream text-xs px-1.5 py-0.5 font-black hover:bg-black"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
        disabled={saving || uploadingImages}
        className="md:col-span-2 p-3 text-xl font-bold"
        style={{ ...blockBtn(C.cream, C.black), opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Listing..." : "List this place"}
      </button>
    </form>
  );
}

/* ---------- Edit Property Modal ---------- */
function EditPropertyModal({ property, onClose, onUpdated }) {
  const [form, setForm] = useState({
    title: property.title || "",
    type: property.type || "PG",
    address: property.location?.address || "",
    coordinates: property.location?.coordinates || [72.8777, 19.0760],
    rentPerHead: property.rentPerHead || 0,
    totalBeds: property.totalBeds || 1,
    availableBeds: property.availableBeds || 0,
    foodAllowed: property.rules?.foodAllowed || "any",
    viceTolerance: property.rules?.viceTolerance || "none",
    petsAllowed: Boolean(property.rules?.petsAllowed),
    guestPolicy: property.rules?.guestPolicy || "occasional",
    sleepPolicy: property.rules?.sleepPolicy || "flexible",
    amenities: Array.isArray(property.amenities) ? property.amenities : [],
    images: Array.isArray(property.images) ? property.images : [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
    setUploadingImages(true);
    setError("");
    try {
      const res = await api.post("/api/properties/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.urls) {
        setForm((prev) => ({
          ...prev,
          images: Array.from(new Set([...(Array.isArray(prev.images) ? prev.images : []), ...res.data.urls])),
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image(s).");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove),
    }));
  };

  const toggleAmenity = (item) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists ? prev.amenities.filter((a) => a !== item) : [...prev.amenities, item],
      };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const total = Number(form.totalBeds);
    const available = Number(form.availableBeds);
    if (available > total) {
      setError("Available beds cannot exceed total beds.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/properties/${property._id}`, {
        title: form.title,
        type: form.type,
        location: {
          type: "Point",
          coordinates: form.coordinates || [72.8777, 19.0760],
          address: form.address,
        },
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
        amenities: form.amenities,
        images: Array.isArray(form.images) ? form.images : [],
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update property.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 overflow-y-auto">
      <div
        className="w-full max-w-3xl border-4 border-crimson bg-black p-6 shadow-brutal my-8 max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: FONT }}
      >
        <div className="flex justify-between items-center mb-4 border-b-4 border-crimson pb-2">
          <h2 className="text-2xl font-black uppercase text-cream">Edit Property Listing</h2>
          <button type="button" onClick={onClose} className="btn-ghost py-1 px-3">
            ✕ Close
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Field label="Listing title">
            <input name="title" value={form.title} onChange={set} required className="p-2" style={inputStyle} />
          </Field>

          <Field label="Type">
            <select name="type" value={form.type} onChange={set} className="p-2" style={inputStyle}>
              <option value="PG">PG</option>
              <option value="Sharing Flat">Sharing Flat</option>
            </select>
          </Field>

          {/* Interactive Leaflet Map Pin Picker for Location */}
          <div className="md:col-span-2 flex flex-col gap-1 border-2 border-crimson p-3 bg-black">
            <span className="font-bold text-sm text-cream uppercase">
              📍 Property Location (Click Map to Drop Pin)
            </span>
            <MapPicker
              coordinates={form.coordinates}
              address={form.address}
              showRadius={false}
              height="260px"
              onChange={({ coordinates, address }) => {
                setForm((prev) => ({ ...prev, coordinates, address }));
              }}
            />
            <label className="text-xs font-bold text-cream-dim mt-2 uppercase">Selected Address / Landmark:</label>
            <input
              name="address"
              value={form.address}
              onChange={set}
              required
              className="p-2"
              style={inputStyle}
            />
          </div>

          <Field label="Rent per person (₹/month)">
            <input
              type="number"
              min="0"
              name="rentPerHead"
              value={form.rentPerHead}
              onChange={set}
              required
              className="p-2"
              style={inputStyle}
            />
          </Field>

          <Field label="Total beds">
            <input
              type="number"
              min="1"
              name="totalBeds"
              value={form.totalBeds}
              onChange={set}
              required
              className="p-2"
              style={inputStyle}
            />
          </Field>

          <Field label="Available beds">
            <input
              type="number"
              min="0"
              name="availableBeds"
              value={form.availableBeds}
              onChange={set}
              required
              className="p-2"
              style={inputStyle}
            />
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
              <option value="all-legal">All Legal (Alcohol &amp; Smoking OK)</option>
            </select>
          </Field>

          <Field label="Guest policy">
            <select name="guestPolicy" value={form.guestPolicy} onChange={set} className="p-2" style={inputStyle}>
              <option value="none">No guests</option>
              <option value="occasional">Occasional guests</option>
              <option value="anytime">Guests anytime</option>
            </select>
          </Field>

          <Field label="Sleep policy">
            <select name="sleepPolicy" value={form.sleepPolicy} onChange={set} className="p-2" style={inputStyle}>
              <option value="early">Early sleepers</option>
              <option value="flexible">Flexible</option>
              <option value="night-owl">Night owls</option>
            </select>
          </Field>

          {/* Amenities */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <span className="font-bold">Amenities:</span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_AMENITIES.map((item) => {
                const active = form.amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`chip ${active ? "chip-on" : ""}`}
                  >
                    {active ? "✔ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Local Image File Uploads Section (Multer) */}
          <div className="md:col-span-2 border-2 border-crimson p-3 bg-black flex flex-col gap-2">
            <label className="font-bold text-sm text-cream uppercase flex flex-col gap-1">
              📸 Upload Property Images (Stored Locally):
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingImages}
                className="p-2 border-2 border-crimson bg-black text-cream text-xs file:border-2 file:border-cream file:bg-crimson file:text-cream file:font-black file:uppercase file:text-xs file:py-1 file:px-3 file:mr-3 file:cursor-pointer hover:file:bg-[#8B0000]"
              />
            </label>
            {uploadingImages && (
              <p className="text-xs text-crimson font-black animate-pulse">Uploading images to server...</p>
            )}

            {Array.isArray(form.images) && form.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative group border-2 border-crimson w-24 h-20 bg-black overflow-hidden">
                    <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0 right-0 bg-crimson text-cream text-xs px-1.5 py-0.5 font-black hover:bg-black"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploadingImages} className="btn-brutal">
              {saving ? "Saving Changes…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Applicant Profile Inspector Modal ---------- */
function ApplicantInspectorModal({ requestId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchApplicant() {
      setLoading(true);
      try {
        const res = await api.get(`/api/requests/${requestId}/applicant`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load applicant profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchApplicant();
  }, [requestId]);

  const CATEGORY_NAMES = {
    food: "Food Habit",
    vices: "Vices (Legal Only)",
    price: "Monthly Budget",
    pets: "Pet Policy",
    guests: "Guest Frequency",
    sleepTime: "Sleep Routine",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto border-4 border-crimson bg-black p-6 shadow-brutal text-cream"
        style={{ fontFamily: FONT }}
      >
        <div className="flex justify-between items-start border-b-4 border-crimson pb-3 mb-4">
          <div>
            <span className="chip chip-on text-xs">APPLICANT PROFILE INSPECTOR</span>
            <h2 className="text-3xl font-black uppercase text-cream mt-1">
              {data?.seeker?.name || "Applicant Details"}
            </h2>
            <p className="text-xs text-cream-dim">
              Evaluating compatibility for {data?.property?.title || "your listing"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost py-1 px-3">
            ✕ Close
          </button>
        </div>

        {loading && <p className="text-lg p-6">Loading applicant compatibility data…</p>}

        {error && (
          <div role="alert" className="p-4 bg-crimson border-2 border-cream font-bold">
            {error}
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* Score Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-4 border-crimson bg-ink p-4">
              <div>
                <p className="text-xs uppercase font-bold text-cream-dim">Compatibility Rating</p>
                <p className="text-4xl font-black text-crimson">{data.matchScore}% MATCH</p>
              </div>
              <div className="text-right text-xs text-cream-dim">
                <p>Status: <strong className="text-cream uppercase">{data.requestStatus}</strong></p>
                <p>Search Area: <strong className="text-cream">{data.seeker?.area || "Not listed"}</strong></p>
                {data.distanceKm != null && <p>Proximity: <strong className="text-cream">{data.distanceKm} km</strong></p>}
              </div>
            </div>

            {/* Living Preferences Overview */}
            <div className="border-4 border-crimson p-4">
              <h3 className="text-lg font-bold uppercase text-crimson mb-2">Living Preferences</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="border-2 border-crimson p-2 bg-ink">
                  <span className="text-xs text-cream-dim block uppercase">Food</span>
                  <strong>{data.seeker?.preferences?.food || "Any"}</strong>
                </div>
                <div className="border-2 border-crimson p-2 bg-ink">
                  <span className="text-xs text-cream-dim block uppercase">Vices</span>
                  <strong>{data.seeker?.preferences?.vices || "None"}</strong>
                </div>
                <div className="border-2 border-crimson p-2 bg-ink">
                  <span className="text-xs text-cream-dim block uppercase">Budget Target</span>
                  <strong>
                    ₹{data.seeker?.preferences?.minPrice || 3000} - ₹{data.seeker?.preferences?.maxPrice || 30000}
                  </strong>
                </div>
                <div className="border-2 border-crimson p-2 bg-ink">
                  <span className="text-xs text-cream-dim block uppercase">Pets</span>
                  <strong>{data.seeker?.preferences?.pets ? "Yes (Has/Wants)" : "No"}</strong>
                </div>
                <div className="border-2 border-crimson p-2 bg-ink">
                  <span className="text-xs text-cream-dim block uppercase">Guests</span>
                  <strong>{data.seeker?.preferences?.guests || "Occasional"}</strong>
                </div>
                <div className="border-2 border-crimson p-2 bg-ink">
                  <span className="text-xs text-cream-dim block uppercase">Sleep Routine</span>
                  <strong>{data.seeker?.preferences?.sleepTime || "Early-bird"}</strong>
                </div>
              </div>
            </div>

            {/* Match Breakdown vs Property Rules */}
            <div className="border-4 border-crimson p-4">
              <h3 className="text-lg font-bold uppercase text-crimson mb-3">Compatibility Breakdown</h3>
              <ul className="space-y-2.5">
                {data.breakdown?.map((b, i) => {
                  const badgeColor =
                    b.status === "compatible"
                      ? "border-green-500 text-green-400"
                      : b.status === "conflict"
                      ? "border-crimson text-crimson"
                      : "border-cream/60 text-cream/80";

                  return (
                    <li
                      key={i}
                      className="border-2 border-crimson bg-ink p-3 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="max-w-[75%]">
                        <p className="font-bold uppercase text-sm">
                          {CATEGORY_NAMES[b.category] || b.category}
                        </p>
                        <p className="text-xs text-cream-dim">{b.detail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`border-2 px-2 py-0.5 text-xs font-black uppercase ${badgeColor}`}>
                          {b.status} ({b.score}%)
                        </span>
                        <span className="chip text-[10px] py-0.5 px-1.5">W {b.weight}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- One incoming request ---------- */
function RequestRow({ request, onDecide, onOpenChat, onInspect }) {
  const seeker = typeof request.seekerId === "object" ? request.seekerId : null;
  const name = seeker?.name || "Unknown seeker";

  return (
    <div className="p-3 flex flex-col gap-2" style={{ border: `3px solid ${C.cream}`, background: C.black }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-lg">{name}</span>
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

      <div className="flex flex-wrap items-center gap-2 mt-1">
        {/* Applicant Inspector Button */}
        <button
          type="button"
          onClick={() => onInspect(request._id)}
          className="px-3 py-1 text-xs font-black uppercase"
          style={blockBtn(C.black, C.cream)}
        >
          🔍 View Applicant Profile
        </button>

        {request.status === "pending" && (
          <div className="flex gap-2">
            <button
              className="px-4 py-1 text-xs font-bold"
              style={blockBtn(C.cream, C.black)}
              onClick={() => onDecide(request._id, "accepted")}
            >
              Accept
            </button>
            <button
              className="px-4 py-1 text-xs font-bold"
              style={blockBtn(C.red, C.cream)}
              onClick={() => onDecide(request._id, "rejected")}
            >
              Reject
            </button>
          </div>
        )}

        {request.status === "accepted" && (
          <button
            className="px-4 py-1 text-xs font-bold"
            style={blockBtn(C.red, C.cream)}
            onClick={() => onOpenChat(request)}
          >
            💬 Open Chat
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function HostPage() {
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [inspectingRequestId, setInspectingRequestId] = useState(null);
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
        <header
          className="p-5"
          style={{ background: C.red, border: `6px solid ${C.cream}`, boxShadow: `10px 10px 0 ${C.darkRed}` }}
        >
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
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <h3 className="text-2xl font-bold">{p.title}</h3>
                        <span className="px-3 py-0.5 text-xs font-bold" style={{ background: C.cream, color: C.black }}>
                          {p.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingProperty(p)}
                        className="btn-brutal text-xs py-1.5 px-3"
                      >
                        ✏ Edit Property
                      </button>
                    </div>

                    {p.images && p.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto mt-3 py-1">
                        {p.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-20 h-16 object-cover border-2 border-crimson"
                          />
                        ))}
                      </div>
                    )}

                    <p className="mt-2 text-sm">{p.location?.address || p.location}</p>
                    <p className="mt-2 font-bold text-lg text-crimson">
                      ₹{p.rentPerHead} per person · {p.availableBeds} of {p.totalBeds} beds free
                    </p>

                    {p.rules && (
                      <p className="mt-1 text-xs text-cream-dim">
                        Food: {p.rules.foodAllowed} · Vices: {p.rules.viceTolerance} · Pets:{" "}
                        {p.rules.petsAllowed ? "yes" : "no"} · Guests: {p.rules.guestPolicy} · Sleep: {p.rules.sleepPolicy}
                      </p>
                    )}

                    {p.amenities && p.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {p.amenities.map((a) => (
                          <span key={a} className="chip text-[11px] py-0.5 px-2">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                    <h4 className="text-xl font-bold mt-6 mb-2">Tenant requests ({reqs.length})</h4>
                    {reqs.length === 0 ? (
                      <p className="text-xs text-cream-dim">No requests for this place yet.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {reqs.map((r) => (
                          <div key={r._id}>
                            <RequestRow
                              request={r}
                              onDecide={decide}
                              onOpenChat={setActiveChat}
                              onInspect={setInspectingRequestId}
                            />
                            {activeChat?._id === r._id && (
                              <ChatPanel
                                request={r}
                                onClose={() => setActiveChat(null)}
                                onUpdate={load}
                              />
                            )}
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

      {/* Edit Property Inline Modal */}
      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onUpdated={load}
        />
      )}

      {/* Applicant Profile Inspector Modal */}
      {inspectingRequestId && (
        <ApplicantInspectorModal
          requestId={inspectingRequestId}
          onClose={() => setInspectingRequestId(null)}
        />
      )}
    </main>
  );
}

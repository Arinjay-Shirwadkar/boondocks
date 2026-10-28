import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// Boondoacks design tokens
const C = { black: "#000000", red: "#DC143C", darkRed: "#8B0000", cream: "#FFFDD0" };
const FONT = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif";

const inputStyle = {
  fontFamily: FONT,
  background: C.black,
  color: C.cream,
  border: `4px solid ${C.red}`,
  borderRadius: 0,
  outlineColor: C.cream,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Expected response: { token, user: { role, ... } }
      const { data } = await axios.post("/api/auth/login", form);
      login(data.token, data.user);
      navigate(data.user?.role === "host" ? "/host" : "/matches");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Check your email and password, then try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: C.black, color: C.cream, fontFamily: FONT }}
    >
      <div
        className="w-full max-w-md p-6 sm:p-8"
        style={{
          border: `6px solid ${C.red}`,
          boxShadow: `10px 10px 0 ${C.darkRed}`,
          borderRadius: 0,
        }}
      >
        <h1 className="text-4xl font-bold mb-2" style={{ color: C.cream }}>
          Sign in to Boondoacks
        </h1>
        <p className="mb-6" style={{ color: C.cream }}>
          Find your people. Sharing PGs and flats only.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1 font-bold">
            Email or Phone Number
            <input
              type="text"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="e.g. alex@example.com or 9876543210"
              autoComplete="username"
              className="p-3 text-lg"
              style={inputStyle}
            />
          </label>

          <label className="flex flex-col gap-1 font-bold">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="p-3 text-lg"
              style={inputStyle}
            />
          </label>

          {error && (
            <div
              role="alert"
              className="p-3 font-bold"
              style={{ background: C.red, color: C.cream, border: `3px solid ${C.cream}` }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="p-3 text-xl font-bold"
            style={{
              fontFamily: FONT,
              background: C.cream,
              color: C.black,
              border: `4px solid ${C.red}`,
              borderRadius: 0,
              boxShadow: `5px 5px 0 ${C.red}`,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6">
          New here?{" "}
          <Link
            to="/signup"
            className="font-bold underline"
            style={{ color: C.red, textDecorationThickness: "3px" }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

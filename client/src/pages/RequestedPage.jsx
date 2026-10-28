import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

/* ------------------------------------------------------------------ */
/* Requested page (seeker side)                                        */
/* Uses: GET /api/requests/seeker, GET /api/user/profile,              */
/*       POST /api/requests/:id/messages  [ADDED in spec],             */
/*       POST /api/requests/:id/reveal-contact                         */
/* JWT is read from localStorage("token"). Swap authFetch for your     */
/* shared axios/fetch client if the team has one.                      */
/* ------------------------------------------------------------------ */

const API = import.meta.env?.VITE_API_URL ?? "";
const FONT = { fontFamily: '"Comic Sans MS", "Comic Sans", cursive, sans-serif' };
const FOCUS =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FFFDD0]";

async function authFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

/* ------------------------- Status badge ---------------------------- */
const STATUS = {
  pending: { label: "Pending", cls: "bg-black text-[#FFFDD0] border-[#FFFDD0] border-dashed" },
  accepted: { label: "Accepted", cls: "bg-[#DC143C] text-[#FFFDD0] border-[#FFFDD0]" },
  rejected: { label: "Declined", cls: "bg-[#FFFDD0] text-black border-[#DC143C] line-through decoration-[#DC143C] decoration-2" },
};

function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.pending;
  return (
    <span className={`inline-block -rotate-2 border-[3px] px-3 py-1 text-sm font-bold uppercase ${s.cls}`}>
      {s.label}
    </span>
  );
}

/* ------------------------ Contact reveal --------------------------- */
function ContactReveal({ request, onReveal, busy }) {
  if (request.contactUnlocked && request.contacts) {
    const { host, seeker } = request.contacts;
    return (
      <div className="border-4 border-[#DC143C] bg-[#FFFDD0] p-3 text-black">
        <p className="text-sm font-bold uppercase text-[#8B0000]">Contacts unlocked</p>
        {[
          ["Host", host],
          ["You", seeker],
        ].map(([who, c]) => (
          <div key={who} className="mt-2 border-t-2 border-black pt-2 text-sm">
            <p className="font-bold">
              {who}: {c?.name}
            </p>
            <p>Phone: {c?.phone || "not provided"}</p>
            <p className="break-all">Email: {c?.email}</p>
          </div>
        ))}
      </div>
    );
  }

  const iWaiting = request.seekerConsent;
  return (
    <div>
      <button
        type="button"
        onClick={onReveal}
        disabled={iWaiting || busy}
        className={`w-full border-[3px] border-[#FFFDD0] px-4 py-3 text-base font-bold uppercase shadow-[5px_5px_0_#FFFDD0] transition-transform enabled:hover:translate-x-[2px] enabled:hover:translate-y-[2px] enabled:hover:shadow-[3px_3px_0_#FFFDD0] enabled:active:translate-x-[5px] enabled:active:translate-y-[5px] enabled:active:shadow-none disabled:cursor-not-allowed disabled:border-dashed disabled:bg-black disabled:text-[#F5F5DC] disabled:shadow-none ${
          iWaiting ? "" : "bg-[#DC143C] text-[#FFFDD0] hover:bg-[#8B0000]"
        } ${FOCUS}`}
      >
        {iWaiting ? "Waiting for the host to agree" : "Reveal contact details"}
      </button>
      <p className="mt-2 text-xs text-[#F5F5DC]">
        Phone numbers and emails unlock only when you and the host both click this.
        {request.hostConsent && !iWaiting ? " The host already did. Your turn." : ""}
      </p>
    </div>
  );
}

/* --------------------------- Chat drawer --------------------------- */
function ChatDrawer({ request, meId, onClose, onSent, onReveal, revealBusy }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const feedRef = useRef(null);
  const closeRef = useRef(null);
  const messages = request.chatHistory ?? [];

  const property = request.propertyId ?? {};
  const host = request.hostId ?? {};

  // scroll to newest message
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [messages.length]);

  // focus close button on open, Escape closes
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send(e) {
    e.preventDefault();
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setError("");
    try {
      await authFetch(`/api/requests/${request._id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setText("");
      await onSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Chat about ${property.title ?? "property"}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l-4 border-[#DC143C] bg-black"
        style={FONT}
      >
        <header className="flex items-start justify-between gap-3 border-b-4 border-[#DC143C] p-4">
          <div>
            <h2 className="text-xl font-bold leading-tight text-[#FFFDD0]">{property.title}</h2>
            <p className="text-sm text-[#F5F5DC]">Chatting with {host.name ?? "the host"}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className={`border-[3px] border-[#FFFDD0] px-3 py-1 text-lg font-bold text-[#FFFDD0] hover:bg-[#DC143C] ${FOCUS}`}
          >
            X
          </button>
        </header>

        <div className="border-b-4 border-[#DC143C] p-4">
          <ContactReveal request={request} onReveal={onReveal} busy={revealBusy} />
        </div>

        <ol ref={feedRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {messages.length === 0 && (
            <li className="border-2 border-dashed border-[#DC143C] p-4 text-center text-[#F5F5DC]">
              No messages yet. Say hi, ask about house rules, or when you can visit.
            </li>
          )}
          {messages.map((m, i) => {
            const mine = String(m.senderId?._id ?? m.senderId) === String(meId);
            const isHostSender = String(m.senderId?._id ?? m.senderId) === String(request.hostId?._id ?? request.hostId);
            return (
              <li key={m._id ?? i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] border-2 border-black p-2.5 shadow-[4px_4px_0_#000000] ${
                    isHostSender
                      ? "bg-gradient-to-r from-[#DC143C] to-[#8B0000] text-[#FFFDD0]"
                      : "bg-gradient-to-r from-[#FFFDD0] to-[#F5F5DC] text-black"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p className="mt-1 text-[11px] opacity-80">
                    {mine ? "You" : host.name ?? "Host"},{" "}
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <form onSubmit={send} className="border-t-4 border-[#DC143C] p-4">
          {error && (
            <p role="alert" className="mb-2 border-2 border-[#DC143C] p-2 text-sm text-[#FFFDD0]">
              Message not sent: {error}
            </p>
          )}
          <div className="flex gap-3">
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <input
              id="chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              placeholder="Write a message"
              autoComplete="off"
              className={`min-w-0 flex-1 border-[3px] border-[#FFFDD0] bg-black px-3 py-2 text-[#FFFDD0] placeholder:text-[#F5F5DC]/60 ${FOCUS}`}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className={`border-[3px] border-[#FFFDD0] bg-[#DC143C] px-4 py-2 font-bold uppercase text-[#FFFDD0] hover:bg-[#8B0000] disabled:opacity-40 ${FOCUS}`}
            >
              {sending ? "Sending" : "Send"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

/* ---------------------------- Request card ------------------------- */
function RequestCard({ request, onOpenChat }) {
  const property = request.propertyId ?? {};
  const accepted = request.status === "accepted";
  return (
    <li
      className={`border-4 bg-black p-5 ${
        accepted
          ? "border-[#DC143C] shadow-[8px_8px_0_#DC143C]"
          : "border-[#FFFDD0] shadow-[8px_8px_0_#FFFDD0]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold leading-tight text-[#FFFDD0]">{property.title ?? "Untitled space"}</h3>
          <p className="mt-1 text-sm text-[#F5F5DC]">{property.type}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <p className="mt-4 text-3xl font-bold text-[#DC143C]">
        {property.rentPerHead != null ? `Rs ${Number(property.rentPerHead).toLocaleString("en-IN")}` : "Rent n/a"}
        <span className="ml-2 text-base font-normal text-[#F5F5DC]">per head, per month</span>
      </p>

      <div className="mt-5">
        {accepted ? (
          <button
            type="button"
            onClick={() => onOpenChat(request._id)}
            className={`border-[3px] border-[#FFFDD0] bg-[#DC143C] px-5 py-3 font-bold uppercase text-[#FFFDD0] shadow-[5px_5px_0_#FFFDD0] hover:bg-[#8B0000] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none ${FOCUS}`}
          >
            Open chat
          </button>
        ) : (
          <p className="text-sm text-[#F5F5DC]">
            {request.status === "pending"
              ? "Waiting for the host to reply. Chat opens once they accept."
              : "The host declined this one. Check your matches for other spaces."}
          </p>
        )}
      </div>
    </li>
  );
}

/* ------------------------------ Page ------------------------------- */
export default function RequestedPage() {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [meId, setMeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [revealBusy, setRevealBusy] = useState(false);

  useEffect(() => {
    const qId = searchParams.get("requestId") || searchParams.get("openChat");
    if (qId) {
      setOpenId(qId);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    const data = await authFetch("/api/requests/seeker");
    setRequests(Array.isArray(data) ? data : data.requests ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [profile] = await Promise.all([authFetch("/api/user/profile"), load()]);
        setMeId(profile._id ?? profile.user?._id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  // refresh while chat is open so host replies and consent show up (every 3 seconds)
  useEffect(() => {
    if (!openId) return;
    const t = setInterval(() => load().catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [openId, load]);

  async function reveal(id) {
    setRevealBusy(true);
    try {
      const res = await authFetch(`/api/requests/${id}/reveal-contact`, { method: "POST" });
      // merge response into the request so the UI updates immediately
      setRequests((rs) => rs.map((r) => (r._id === id ? { ...r, ...res } : r)));
    } catch (err) {
      setError(err.message);
    } finally {
      setRevealBusy(false);
    }
  }

  const closeChat = useCallback(() => setOpenId(null), []);
  const openRequest = requests.find((r) => r._id === openId);

  return (
    <div className="min-h-screen bg-black text-[#FFFDD0]" style={FONT}>
      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="font-bold uppercase leading-[0.95]" style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)" }}>
          Your <span className="text-[#DC143C]">requests</span>
        </h1>
        <p className="mt-3 text-lg text-[#F5F5DC]">Every bed you've asked for, and where it stands.</p>

        {error && (
          <p role="alert" className="mt-6 border-4 border-[#DC143C] bg-[#DC143C] p-3 font-bold text-[#FFFDD0]">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-xl">Loading your requests...</p>
        ) : requests.length === 0 && !error ? (
          <div className="mt-10 border-4 border-dashed border-[#DC143C] p-8 text-center">
            <p className="text-2xl font-bold">No requests yet.</p>
            <p className="mt-2 text-[#F5F5DC]">Open your matches and ask for a bed that fits you.</p>
          </div>
        ) : (
          <ul className="mt-10 space-y-8">
            {requests.map((r) => (
              <RequestCard key={r._id} request={r} onOpenChat={setOpenId} />
            ))}
          </ul>
        )}
      </main>

      {openRequest && openRequest.status === "accepted" && (
        <ChatDrawer
          request={openRequest}
          meId={meId}
          onClose={closeChat}
          onSent={load}
          onReveal={() => reveal(openRequest._id)}
          revealBusy={revealBusy}
        />
      )}
    </div>
  );
}
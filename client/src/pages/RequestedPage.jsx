import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import ChatPanel from "../components/ChatPanel";

/* ------------------------------------------------------------------ */
/* Requested page (seeker side)                                        */
/* Uses: GET /requests/seeker, GET /user/profile                       */
/* Uses shared ChatPanel.jsx for comic-themed conversation & contacts  */
/* ------------------------------------------------------------------ */

const FONT = { fontFamily: '"Comic Sans MS", "Comic Sans", cursive, sans-serif' };
const FOCUS =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FFFDD0]";

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
        {property.rentPerHead != null ? `₹${Number(property.rentPerHead).toLocaleString("en-IN")}` : "Rent n/a"}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const qId = searchParams.get("requestId") || searchParams.get("openChat");
    if (qId) {
      setOpenId(qId);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/requests/seeker");
      setRequests(Array.isArray(data) ? data : data.requests ?? []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load requests.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([api.get("/user/profile"), load()]);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load session or requests.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

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

      {/* Shared Comic-Themed Chat Dialog for Seeker Side */}
      {openRequest && openRequest.status === "accepted" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 overflow-y-auto"
          onClick={closeChat}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatPanel
              request={openRequest}
              onClose={closeChat}
              onUpdate={load}
            />
          </div>
        </div>
      )}
    </div>
  );
}

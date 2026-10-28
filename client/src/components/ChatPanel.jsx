import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const FONT = { fontFamily: '"Comic Sans MS", "Comic Sans", cursive, sans-serif' };

export default function ChatPanel({ request: initialRequest, onClose, onUpdate }) {
  const { user } = useAuth();
  const [request, setRequest] = useState(initialRequest);
  const [messages, setMessages] = useState(initialRequest.chatHistory || []);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState('');
  const feedRef = useRef(null);

  const meId = user?._id || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))._id : null);
  const hostId = String(request.hostId?._id || request.hostId);
  const _seekerId = String(request.seekerId?._id || request.seekerId);
  const isHostUser = meId ? String(meId) === hostId : user?.role === 'host';

  const otherPersonName = isHostUser
    ? request.seekerId?.name || 'Applicant'
    : request.hostId?.name || 'Host';

  // Scroll to bottom of message feed
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  // Sync initial request prop when changed
  useEffect(() => {
    setRequest(initialRequest);
    if (Array.isArray(initialRequest.chatHistory)) {
      setMessages(initialRequest.chatHistory);
    }
  }, [initialRequest]);

  // 3-second live short-polling for messages and consent updates
  useEffect(() => {
    let isMounted = true;
    const fetchChat = async () => {
      try {
        const { data } = await api.get(`/requests/${request._id}/chat`);
        if (isMounted && data) {
          if (Array.isArray(data.chatHistory)) {
            setMessages(data.chatHistory);
          }
          setRequest((prev) => ({ ...prev, ...data }));
          if (onUpdate) onUpdate(data);
        }
      } catch (err) {
        console.warn('Chat polling error:', err?.response?.data?.message || err.message);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [request._id, onUpdate]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError('');
    try {
      const { data } = await api.post(`/requests/${request._id}/message`, { message: trimmed });
      setText('');
      if (data && Array.isArray(data.chatHistory)) {
        setMessages(data.chatHistory);
      }
      if (data) {
        setRequest((prev) => ({ ...prev, ...data }));
        if (onUpdate) onUpdate(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  // Mutual contact reveal
  const handleRevealContact = async () => {
    if (revealing) return;
    setRevealing(true);
    setError('');
    try {
      const { data } = await api.post(`/requests/${request._id}/reveal-contact`);
      if (data) {
        setRequest((prev) => ({ ...prev, ...data }));
        if (onUpdate) onUpdate(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit contact reveal consent.');
    } finally {
      setRevealing(false);
    }
  };

  const myConsentGiven = isHostUser ? request.hostConsent : request.seekerConsent;
  const otherConsentGiven = isHostUser ? request.seekerConsent : request.hostConsent;

  return (
    <div
      className="p-4 mt-3 flex flex-col gap-3 border-4 border-black bg-black text-[#FFFDD0] shadow-[8px_8px_0_#DC143C] relative overflow-hidden"
      style={{
        ...FONT,
        backgroundImage: 'radial-gradient(#1a1a1a 18%, #000000 19%)',
        backgroundSize: '10px 10px',
      }}
    >
      {/* Chat Header Banner */}
      <div className="flex flex-col gap-3 border-b-4 border-black pb-3 bg-gradient-to-r from-[#DC143C] to-[#8B0000] p-3 shadow-[4px_4px_0_#000000]">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <span className="text-xs font-black uppercase text-[#FFFDD0] tracking-wider block">
              {request.propertyId?.title || 'Sharing Space'}
            </span>
            <h3 className="text-xl font-black text-[#FFFDD0] uppercase tracking-wide mt-0.5">
              Chat with {otherPersonName}
            </h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-black bg-[#FFFDD0] px-3 py-1 font-black text-xs uppercase text-black shadow-[3px_3px_0_#000000] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              ✕ Close
            </button>
          )}
        </div>

        {/* Revealed Contacts inside Chat Header upon Mutual Consent */}
        {request.contactUnlocked && request.contacts && (
          <div className="border-t-2 border-black/40 pt-2.5 mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="border-2 border-black bg-[#FFFDD0] text-black px-2 py-0.5 text-[11px] font-black uppercase shadow-[2px_2px_0_#000000]">
                ⚡ Verified Contact Details Unlocked
              </span>
              <span className="text-[10px] font-black uppercase text-[#FFFDD0] tracking-wider">
                Mutual Consent Confirmed
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="border-2 border-black bg-white p-2 text-black shadow-[3px_3px_0_#000000]">
                <p className="font-black text-[#DC143C] uppercase text-xs">
                  Host: {request.contacts.host?.name || 'Host'}
                </p>
                <p className="mt-1 font-bold">
                  📞 Phone: {request.contacts.host?.phone || 'Not listed'}
                </p>
                <p className="font-bold break-all">
                  ✉ Email: {request.contacts.host?.email || 'Not listed'}
                </p>
              </div>
              <div className="border-2 border-black bg-white p-2 text-black shadow-[3px_3px_0_#000000]">
                <p className="font-black text-[#DC143C] uppercase text-xs">
                  Tenant: {request.contacts.seeker?.name || 'Seeker'}
                </p>
                <p className="mt-1 font-bold">
                  📞 Phone: {request.contacts.seeker?.phone || 'Not listed'}
                </p>
                <p className="font-bold break-all">
                  ✉ Email: {request.contacts.seeker?.email || 'Not listed'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mutual Contact Reveal Action Box (shown when contacts are not unlocked yet) */}
      {!request.contactUnlocked && (
        <div className="border-4 border-black bg-[#FFFDD0] p-3 text-black shadow-[5px_5px_0_#000000]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-black">
                Mutual Contact Reveal
              </p>
              <p className="text-[11px] font-bold text-black/80 mt-0.5">
                {otherConsentGiven && !myConsentGiven
                  ? `⚡ ${otherPersonName} agreed to reveal contacts! Click below to unlock.`
                  : 'Phone numbers & emails unlock only when both host and applicant agree.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRevealContact}
              disabled={myConsentGiven || revealing}
              className={`border-4 border-black px-4 py-2 text-xs font-black uppercase tracking-wide shadow-[4px_4px_0_#000000] shrink-0 transition-transform ${
                myConsentGiven
                  ? 'border-dashed bg-gray-200 text-gray-700 cursor-not-allowed shadow-none'
                  : 'bg-[#DC143C] text-[#FFFDD0] hover:bg-[#8B0000] active:translate-x-1 active:translate-y-1 active:shadow-none'
              }`}
            >
              {revealing
                ? 'Saving Consent...'
                : myConsentGiven
                ? `Waiting for ${otherPersonName} to agree`
                : 'Reveal Contact Info'}
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <ol
        ref={feedRef}
        className="flex flex-col gap-3 max-h-80 overflow-y-auto p-4 border-4 border-black bg-[#0d0d0d] shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]"
      >
        {messages.length === 0 ? (
          <li className="text-center text-sm text-[#FFFDD0]/60 py-8 border-2 border-dashed border-[#DC143C] p-4 bg-black/60">
            💬 No messages yet. Say hello and coordinate space viewing or house rules!
          </li>
        ) : (
          messages.map((m, i) => {
            const senderIdStr = String(m.senderId?._id || m.senderId);
            const isMine = meId ? senderIdStr === String(meId) : false;
            const isHostSender = senderIdStr === hostId;

            // Host message bubble: Vibrant Crimson gradient with cream text, 3px solid black border, offset drop shadow shadow-[4px_4px_0_#000]
            // Seeker message bubble: Cream-to-yellow gradient with pitch black text, 3px solid black border, offset drop shadow shadow-[4px_4px_0_#DC143C]
            const bubbleClasses = isHostSender
              ? 'bg-gradient-to-r from-[#DC143C] to-[#8B0000] text-[#FFFDD0] border-[3px] border-black shadow-[4px_4px_0_#000]'
              : 'bg-gradient-to-r from-[#FFFDD0] to-[#F5F5DC] text-black border-[3px] border-black shadow-[4px_4px_0_#DC143C]';

            const senderLabel = isHostSender ? 'Host' : 'Seeker';

            return (
              <li key={m._id || i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] font-black uppercase text-[#FFFDD0]/70 mb-0.5 px-1">
                  {isMine ? 'You' : `${senderLabel} (${otherPersonName})`}
                </span>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl ${
                    isMine ? 'rounded-tr-none' : 'rounded-tl-none'
                  } ${bubbleClasses}`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm font-bold leading-snug">
                    {m.message}
                  </p>
                  <p
                    className={`mt-1.5 text-[9px] font-black uppercase text-right ${
                      isHostSender ? 'text-[#FFFDD0]/75' : 'text-black/75'
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ol>

      {/* Input Field Form */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`MESSAGE ${otherPersonName.toUpperCase()}...`}
          maxLength={1000}
          className="flex-1 border-4 border-black bg-black p-3 text-sm font-bold text-[#FFFDD0] placeholder:text-[#FFFDD0]/40 shadow-[4px_4px_0_#000000] uppercase focus:outline-none focus:border-[#DC143C]"
          style={FONT}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="border-4 border-black bg-[#DC143C] text-[#FFFDD0] px-6 py-2.5 text-sm font-black uppercase shadow-[4px_4px_0_#000000] hover:bg-[#8B0000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-transform disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={FONT}
        >
          {sending ? 'SENDING…' : 'SEND'}
        </button>
      </form>

      {error && (
        <div role="alert" className="border-2 border-black bg-[#DC143C] p-2 text-xs font-bold text-[#FFFDD0]">
          {error}
        </div>
      )}
    </div>
  );
}

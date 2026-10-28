import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const FONT = { fontFamily: '"Comic Sans MS", "Comic Sans", cursive, sans-serif' };

export default function SeekerAcceptanceBanner() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dismissed_accepted_requests') || '[]');
    } catch {
      return [];
    }
  });

  const isSeeker = user?.role === 'seeker' || user?.role === 'both' || !user?.role;

  const checkAcceptedRequests = useCallback(async () => {
    if (!isAuthenticated || !isSeeker) return;
    try {
      const { data } = await api.get('/requests/seeker');
      const list = Array.isArray(data) ? data : data?.requests || [];
      const accepted = list.filter((r) => r.status === 'accepted');
      setAcceptedRequests(accepted);
    } catch (err) {
      // Quietly ignore polling failures for banner
      console.debug('Request notification check error:', err?.message);
    }
  }, [isAuthenticated, isSeeker]);

  // Polling on login and every 5 seconds
  useEffect(() => {
    if (!isAuthenticated || !isSeeker) {
      setAcceptedRequests([]);
      return;
    }

    checkAcceptedRequests();
    const interval = setInterval(checkAcceptedRequests, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isSeeker, checkAcceptedRequests]);

  // Filter out any dismissed requests
  const activeNotification = acceptedRequests.find((r) => !dismissed.includes(r._id));

  if (!activeNotification) return null;

  const propTitle = activeNotification.propertyId?.title || activeNotification.property?.title || 'this space';

  const handleDismiss = (e) => {
    e.stopPropagation();
    const next = [...dismissed, activeNotification._id];
    setDismissed(next);
    try {
      sessionStorage.setItem('dismissed_accepted_requests', JSON.stringify(next));
    } catch {
      // sessionStorage fallback
    }
  };

  const handleOpenChat = () => {
    navigate(`/requested?requestId=${activeNotification._id}`);
  };

  return (
    <div
      role="alert"
      className="sticky top-[60px] z-50 w-full px-4 py-2 pointer-events-none"
      style={FONT}
    >
      <div
        onClick={handleOpenChat}
        className="pointer-events-auto mx-auto max-w-5xl cursor-pointer border-4 border-black bg-gradient-to-r from-[#DC143C] via-[#B22222] to-[#8B0000] p-3 text-[#FFFDD0] shadow-[6px_6px_0_#000000] hover:scale-[1.01] transition-transform flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-bounce shrink-0">🎉</span>
          <p className="text-sm md:text-base font-black uppercase tracking-wide leading-snug">
            🎉 HOST ACCEPTED YOUR REQUEST! Your join request for{' '}
            <span className="underline decoration-[#FFFDD0] decoration-2 underline-offset-2">
              {propTitle}
            </span>{' '}
            was accepted. Click here to open chat!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-block border-2 border-black bg-[#FFFDD0] text-black px-2 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0_#000000]">
            OPEN CHAT 💬
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="border-2 border-black bg-black text-[#FFFDD0] hover:bg-[#FFFDD0] hover:text-black w-7 h-7 flex items-center justify-center font-black text-sm shadow-[2px_2px_0_#000000]"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}


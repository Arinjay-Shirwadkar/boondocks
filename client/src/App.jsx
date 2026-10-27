// App.jsx  (uncomment the other two once Part 2 files exist)
import { Routes, Route, Navigate } from 'react-router-dom';
import SignUpPage from './pages/SignUpPage';
// import MatchesPage from './pages/MatchesPage';
// import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignUpPage />} />
      {/* <Route path="/matches" element={<MatchesPage />} /> */}
      {/* <Route path="/profile" element={<ProfilePage />} /> */}
      <Route path="*" element={<Navigate to="/signup" />} />
    </Routes>
  );
}
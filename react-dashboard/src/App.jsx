import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MyCourses from './pages/MyCourses';
import BrowseCourses from './pages/BrowseCourses';
import Progress from './pages/Progress';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import TestSeries from './pages/TestSeries';
import AIRecommendations from './pages/AIRecommendations';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="browse-courses" element={<BrowseCourses />} />
          <Route path="progress" element={<Progress />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="test-series" element={<TestSeries />} />
          <Route path="messages" element={<Messages />} />
          <Route path="recommendations" element={<AIRecommendations />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

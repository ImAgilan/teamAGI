/**
 * AppLayout — TeamAGI App Shell
 */
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import TopBar from './TopBar';
import CreatePostModal from '../feed/CreatePostModal';
import useUIStore from '../../store/uiStore';
import RealTimeHandler from './RealTimeHandler';

export default function AppLayout() {
  const createPostOpen = useUIStore((s) => s.createPostOpen);
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <RealTimeHandler />
      <Sidebar />


            <TopBar />
      <main className="app-main">
        <Outlet />
      </main>
      <MobileNav />
      {createPostOpen && <CreatePostModal />}
    </div>
  );
}

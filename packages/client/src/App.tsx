import { Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { Toaster } from './components/common/Toaster';

export default function App() {
  return (
    <Layout>
      <Outlet />
      <Toaster />
    </Layout>
  );
}

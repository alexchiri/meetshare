import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './components/home/HomePage';
import RoomPage from './components/room/RoomPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'room/:roomId', element: <RoomPage /> },
    ],
  },
]);

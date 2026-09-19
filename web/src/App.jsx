import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Friends from "./pages/Friends";
import Requests from "./pages/Requests";
import ChatList from "./pages/ChatList";
import Chat from "./pages/Chat";
import Feed from "./pages/Feed";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="feed" element={<Feed />} />

            <Route path="friends" element={<Friends />} />
            <Route path="requests" element={<Requests />} />

            <Route path="chat">
              <Route index element={<ChatList />} />
              <Route path=":friendId" element={<Chat />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
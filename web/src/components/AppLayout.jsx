import { Outlet } from "react-router-dom";
import { ChatProvider } from "../context/ChatContext";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <ChatProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
        <Sidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </ChatProvider>
  );
}
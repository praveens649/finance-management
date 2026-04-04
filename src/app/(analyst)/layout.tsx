import { ReactNode } from "react";

export default function AnalystLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans antialiased">
      {/* 
        Shared Analyst UI wrapper. 
        Wraps both the /login portal and the /analyst dashboard.
      */}
      {children}
    </div>
  );
}

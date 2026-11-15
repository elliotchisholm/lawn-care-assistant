import type { ReactNode } from "react";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import SideNav from "@/components/SideNav";

/** Top bar, bottom tabs on mobile, left sidebar on desktop. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="lg:flex">
        <SideNav />
        <div className="min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</div>
      </div>
      <TabBar />
    </div>
  );
}

import * as React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  LogOut,
  NotebookTabs,
  Sprout,
  Tag,
  MapPinned,
  Wheat,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ToastManager } from "../ui/ToastManager";

type MenuItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const dashboardItem: MenuItem = {
  to: "/dashboard",
  label: "Dashboard",
  icon: <BarChart3 className="size-4" />,
};

const sections: MenuSection[] = [
  {
    title: "Organizations",
    items: [
      { to: "/organizations", label: "Organizations", icon: <Building2 className="size-4" /> },
    ],
  },
  {
    title: "Rice",
    items: [
      { to: "/master-data/rice-types", label: "Rice Types", icon: <Wheat className="size-4" /> },
      { to: "/master-data/varieties", label: "Varieties", icon: <Sprout className="size-4" /> },
    ],
  },
  {
    title: "Crop",
    items: [
      { to: "/master-data/crop-years", label: "Crop Years", icon: <NotebookTabs className="size-4" /> },
      { to: "/master-data/bag-rates", label: "Bag Rates", icon: <Tag className="size-4" /> },
      { to: "/master-data/ikp", label: "IKP Master", icon: <MapPinned className="size-4" /> },
      { to: "/master-data/ikp-centers", label: "IKP Centers", icon: <Tag className="size-4" /> },
    ],
  },
];

function MenuLink({ item }: { item: MenuItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          isActive ? "bg-accent text-accent-foreground" : null
        )
      }
      end
    >
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const title = React.useMemo(() => {
    if (dashboardItem.to === location.pathname) return dashboardItem.label;
    const active = sections
      .flatMap((s) => s.items)
      .find((m) => location.pathname === m.to || location.pathname.startsWith(`${m.to}/`));
    return active?.label ?? "Admin";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ToastManager />
      <div className="grid min-h-screen grid-cols-[260px_1fr]">
        <aside className="border-r border-border bg-sidebar text-sidebar-foreground">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex flex-col leading-tight">
              <div className="text-sm font-semibold">KingForge Admin</div>
              <div className="text-xs text-muted-foreground">Master data</div>
            </div>
          </div>
          <div className="px-2">
            <nav className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <MenuLink item={dashboardItem} />
              </div>
              {sections.map((section) => (
                <div key={section.title} className="flex flex-col gap-1">
                  <div className="px-3 pt-2 text-[11px] font-medium tracking-wide text-muted-foreground">
                    {section.title}
                  </div>
                  {section.items.map((m) => (
                    <MenuLink key={m.to} item={m} />
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm">
            <div className="text-sm font-medium">{title}</div>
            <div className="flex items-center gap-3">
              <div className="hidden text-sm text-muted-foreground sm:block">
                {user?.email ?? ""}
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="size-4" />
                <span>Sign out</span>
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

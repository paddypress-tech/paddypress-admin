import * as React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Moon,
  NotebookTabs,
  Sprout,
  Sun,
  Tag,
  MapPinned,
  Wheat,
  Warehouse,
  Package,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { NavUser } from "@/components/layout/NavUser";
import { SidebarFooter, SidebarProvider } from "@/components/ui/sidebar";
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
    ],
  },
  {
    title: "By Products",
    items: [
      { to: "/master-data/by-products", label: "By Products", icon: <Package className="size-4" /> },
    ],
  },
  {
    title: "Locations",
    items: [
      { to: "/master-data/locations", label: "Locations", icon: <MapPinned className="size-4" /> },
      { to: "/master-data/ikp-centers", label: "Centers", icon: <Warehouse className="size-4" /> },
    ],
  },
];

function getInitialIsDark(): boolean {
  const stored = localStorage.getItem("admin-theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

function applyTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem("admin-theme", isDark ? "dark" : "light");
}

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

  const [isDark, setIsDark] = React.useState<boolean>(() => getInitialIsDark());
  const [confirmLogoutOpen, setConfirmLogoutOpen] = React.useState(false);

  React.useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const title = React.useMemo(() => {
    if (dashboardItem.to === location.pathname) return dashboardItem.label;
    const active = sections
      .flatMap((s) => s.items)
      .find((m) => location.pathname === m.to || location.pathname.startsWith(`${m.to}/`));
    return active?.label ?? "Admin";
  }, [location.pathname]);

  const displayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : user?.email ?? "Admin";

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground">
        <ToastManager />
        <div className="grid min-h-screen grid-cols-[260px_1fr]">
          <aside className="flex flex-col border-r border-border bg-sidebar text-sidebar-foreground">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex flex-col leading-tight">
                <div className="text-sm font-semibold">KingForge Admin</div>
                <div className="text-xs text-muted-foreground">Master data</div>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-2">
              <nav className="flex flex-1 flex-col gap-3 overflow-auto pb-2">
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

              <SidebarFooter>
                <NavUser
                  user={{
                    name: displayName,
                    email: user?.email ?? "",
                    avatar: "",
                  }}
                  onLogout={() => setConfirmLogoutOpen(true)}
                />
              </SidebarFooter>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col">
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm">
              <div className="text-sm font-medium">{title}</div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDark((v) => !v)}
                  aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                >
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </div>
            </header>

            <main className="min-w-0 flex-1 p-4">
              <Outlet />
            </main>
          </div>
        </div>

        <AlertDialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to sign out?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setConfirmLogoutOpen(false);
                  logout();
                }}
              >
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarProvider>
  );
}

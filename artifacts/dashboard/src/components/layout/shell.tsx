import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { useLogout } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/revenue", label: "Revenue", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Brand({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="w-6 h-6 rounded bg-primary flex items-center justify-center mx-auto">
        <div className="w-3 h-3 rounded-full bg-background" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
      <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-background" />
      </div>
      Pulse
    </div>
  );
}

function NavList({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  return (
    <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? location === "/" : location.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover-elevate",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}

function UserSummary({ collapsed }: { collapsed?: boolean }) {
  const { user } = useAuth();
  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (collapsed) {
    return (
      <div
        className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-medium mx-auto"
        title={`${user.name} (${user.email})`}
      >
        {initials}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 min-w-0">
      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-medium shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{user.name}</div>
        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [, navigate] = useLocation();
  const { signOutLocal } = useAuth();

  const logoutMutation = useLogout({
    mutation: {
      onSettled: () => {
        signOutLocal();
        setMobileOpen(false);
        navigate("/login", { replace: true });
      },
    },
  });

  const handleLogout = () => {
    if (logoutMutation.isPending) return;
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-sidebar border-sidebar-border transition-all duration-300 h-screen sticky top-0 shrink-0",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-14 items-center px-4 border-b border-sidebar-border/50 justify-between">
          <Brand collapsed={isCollapsed} />
        </div>
        <NavList collapsed={isCollapsed} />
        <div className="p-2 mt-auto border-t border-sidebar-border/50 flex flex-col gap-2">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            className={cn(
              "w-full text-sidebar-foreground/60 justify-start",
              isCollapsed && "justify-center",
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 mr-2" /> Collapse
              </>
            )}
          </Button>
          <UserSummary collapsed={isCollapsed} />
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            className={cn(
              "w-full text-sidebar-foreground/60 justify-start hover:text-destructive hover:bg-destructive/10",
              isCollapsed && "justify-center",
            )}
            title={isCollapsed ? "Log out" : undefined}
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            {!isCollapsed && (logoutMutation.isPending ? "Signing out…" : "Log out")}
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex h-14 items-center justify-between px-4 border-b border-border bg-sidebar shrink-0">
          <Brand />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <SheetHeader className="h-14 px-4 border-b border-sidebar-border/50 flex flex-row items-center">
                <SheetTitle className="text-left">
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-[calc(100vh-3.5rem)]">
                <NavList onNavigate={() => setMobileOpen(false)} />
                <div className="p-2 mt-auto border-t border-sidebar-border/50 flex flex-col gap-2">
                  <UserSummary />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sidebar-foreground/60 justify-start hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    {logoutMutation.isPending ? "Signing out…" : "Log out"}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  );
}

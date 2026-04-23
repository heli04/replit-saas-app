import * as React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/revenue", label: "Revenue", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r bg-sidebar border-sidebar-border transition-all duration-300 h-screen sticky top-0 shrink-0",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-14 items-center px-4 border-b border-sidebar-border/50 justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-background" />
              </div>
              Pulse
            </div>
          )}
          {isCollapsed && (
             <div className="w-6 h-6 rounded bg-primary flex items-center justify-center mx-auto">
               <div className="w-3 h-3 rounded-full bg-background" />
             </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover-elevate",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="p-2 mt-auto border-t border-sidebar-border/50 flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size={isCollapsed ? "icon" : "sm"}
            className={cn("w-full text-sidebar-foreground/60 justify-start", isCollapsed && "justify-center")}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4 mr-2" /> Collapse</>}
          </Button>
          <Button 
            variant="ghost" 
            size={isCollapsed ? "icon" : "sm"}
            className={cn("w-full text-sidebar-foreground/60 justify-start hover:text-destructive hover:bg-destructive/10", isCollapsed && "justify-center")}
            title={isCollapsed ? "Log out" : undefined}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!isCollapsed && "Log out"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

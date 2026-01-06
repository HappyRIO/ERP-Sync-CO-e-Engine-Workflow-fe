import { 
  LayoutDashboard, 
  Plus, 
  Truck, 
  Leaf, 
  FileText, 
  Settings,
  LogOut,
  Building2,
  Users,
  DollarSign,
  Receipt,
  ClipboardList,
  UserPlus,
  MapPin,
  Clock,
  Route as RouteIcon
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantTheme } from "@/contexts/TenantThemeContext";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// Role-based navigation items
const getMainNavItems = (role: string) => {
  const baseItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ['admin', 'client', 'reseller', 'driver'] },
    { title: "New Booking", url: "/booking", icon: Plus, roles: ['admin', 'client'] },
    { title: "Jobs", url: "/jobs", icon: Truck, roles: ['admin', 'client', 'reseller', 'driver'] },
    { title: "Route & Schedule", url: "/driver/schedule", icon: RouteIcon, roles: ['driver'] },
    { title: "Job History", url: "/jobs/history", icon: Clock, roles: ['driver'] },
    { title: "Bookings", url: "/bookings", icon: FileText, roles: ['admin', 'client', 'reseller'] },
    { title: "Booking Queue", url: "/admin/bookings", icon: ClipboardList, roles: ['admin'] },
    { title: "Users", url: "/users", icon: Users, roles: ['admin'] },
    { title: "Clients", url: "/clients", icon: Building2, roles: ['admin', 'reseller'] },
    { title: "Drivers", url: "/admin/drivers", icon: Truck, roles: ['admin'] },
    { title: "Sites", url: "/sites", icon: MapPin, roles: ['client'] },
    { title: "Invoices", url: "/invoices", icon: Receipt, roles: ['admin', 'client', 'reseller'] },
    { title: "Commission", url: "/commission", icon: DollarSign, roles: ['admin', 'reseller'] },
    { title: "CO₂e Dashboard", url: "/co2e", icon: Leaf, roles: ['admin', 'client', 'reseller'] },
    { title: "Documents", url: "/documents", icon: FileText, roles: ['admin', 'client', 'reseller'] },
  ];
  
  return baseItems.filter(item => item.roles.includes(role));
};

const bottomNavItems = [
  { title: "Settings", url: "/settings", icon: Settings, roles: ['admin', 'client', 'reseller', 'driver'] },
];

// Logout Button with Confirmation
function LogoutButton({ isCollapsed }: { isCollapsed: boolean }) {
  const { logout } = useAuth();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <SidebarMenuButton
          tooltip="Logout"
          className="h-11 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full"
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="font-medium ml-3">Logout</span>}
        </SidebarMenuButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout? You'll need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => logout()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const { logo } = useTenantTheme();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const mainNavItems = user ? getMainNavItems(user.role) : [];

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src={logo || '/logo.avif'} 
            alt="Reuse ITAD Platform"
            className={cn(
              "object-contain transition-all duration-200",
              isCollapsed ? "h-8 w-8" : "h-10 w-auto max-w-[140px]"
            )}
            onError={(e) => {
              // Fallback to placeholder if logo fails to load
              e.currentTarget.style.display = 'none';
              const placeholder = document.createElement('div');
              placeholder.className = `flex items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-bold ${isCollapsed ? 'h-8 w-8 text-base' : 'h-10 w-10 text-lg'}`;
              placeholder.textContent = 'R';
              e.currentTarget.parentNode?.insertBefore(placeholder, e.currentTarget);
            }}
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground text-lg">
                Reuse
              </span>
              <span className="text-xs text-sidebar-foreground/60">ITAD Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-3">
            {!isCollapsed && "Main Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "h-11 rounded-lg transition-all duration-200",
                      isActive(item.url) 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md font-semibold" 
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-sm"
                    )}
                  >
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={item.title}
                className="h-11 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <NavLink to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          {/* User/Org section */}
          {user && (
            <>
              <SidebarMenuItem>
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50",
                  isCollapsed && "justify-center p-2"
                )}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary/20 text-sidebar-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        Reuse ITAD Platform
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                        {user.name} • {user.role}
                      </p>
                    </div>
                  )}
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <LogoutButton isCollapsed={isCollapsed} />
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

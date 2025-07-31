import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  CreditCard, 
  Settings,
  Bell,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab?: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
    },
    {
      id: "employees",
      label: "Funcionários",
      icon: Users,
      href: "/employees",
    },
    {
      id: "trainings",
      label: "Treinamentos",
      icon: BookOpen,
      href: "/trainings",
    },
    {
      id: "alerts",
      label: "Alertas",
      icon: AlertTriangle,
      href: "/alerts",
      badge: 0,
    },
    {
      id: "subscription",
      label: "Assinatura",
      icon: CreditCard,
      href: "/subscription",
    },
    {
      id: "billing",
      label: "Cobrança",
      icon: BarChart3,
      href: "/billing",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/" && (location === "/" || activeTab === "dashboard")) {
      return true;
    }
    return location === href || activeTab === menuItems.find(item => item.href === href)?.id;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-gray-100 hidden lg:block">
        <nav className="p-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.id} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                    active
                      ? "text-primary bg-primary/10"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge className="ml-auto bg-red-100 text-red-600 hover:bg-red-100">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.id} href={item.href}>
                <a
                  className={cn(
                    "flex flex-col items-center space-y-1 px-3 py-2 relative",
                    active ? "text-primary" : "text-gray-600"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center p-0">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

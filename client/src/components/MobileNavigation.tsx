import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Menu,
  LayoutDashboard, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  CreditCard, 
  LogOut,
  Bell,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

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
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") {
      return true;
    }
    return location === href;
  };

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TM</span>
          </div>
          <h1 className="font-semibold text-gray-900">TrainManager Pro</h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
            >
              3
            </Badge>
          </Button>

          {/* Menu Toggle */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">TM</span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">TrainManager Pro</h2>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <Link 
                        key={item.id} 
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-between w-full p-3 rounded-xl transition-all duration-200 tap-target",
                            active
                              ? "bg-primary text-white shadow-lg"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge 
                              variant={active ? "secondary" : "destructive"}
                              className="ml-2"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 tap-target"
                    onClick={() => window.location.href = "/api/logout"}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </div>
  );
}
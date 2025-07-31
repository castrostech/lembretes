import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navigation from "../components/Navigation";
import MobileNavigation from "../components/MobileNavigation";
import Sidebar from "../components/Sidebar";
import DashboardStats from "../components/DashboardStats";
import TrainingChart from "../components/TrainingChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, PlusCircle, Upload, CalendarPlus, FileText, Check, AlertTriangle } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Dashboard stats query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login para continuar...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <Navigation />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar activeTab="dashboard" />
        </div>
        
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600 mt-1">Visão geral da sua empresa</p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Button 
                  onClick={() => setLocation('/employees')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Funcionário
                </Button>
                <Button 
                  onClick={() => setLocation('/trainings')}
                  className="bg-green-600 text-white hover:bg-green-700 shadow-lg"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Novo Treinamento
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <DashboardStats stats={stats} isLoading={statsLoading} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Training Progress Chart */}
              <TrainingChart />

              {/* Recent Activity */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Sistema inicializado com sucesso</p>
                        <p className="text-xs text-gray-500 mt-1">Agora mesmo</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Conta criada com sucesso</p>
                        <p className="text-xs text-gray-500 mt-1">Há poucos minutos</p>
                      </div>
                    </div>
                    
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Comece adicionando funcionários e treinamentos para ver mais atividades aqui.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setLocation('/employees')}
                    variant="outline"
                    className="flex items-center justify-center space-x-3 p-6 h-auto border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                    <span className="text-gray-600 group-hover:text-primary font-medium">Funcionários</span>
                  </Button>
                  
                  <Button
                    onClick={() => setLocation('/trainings')}
                    variant="outline"
                    className="flex items-center justify-center space-x-3 p-6 h-auto border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200 group"
                  >
                    <CalendarPlus className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                    <span className="text-gray-600 group-hover:text-green-600 font-medium">Treinamentos</span>
                  </Button>
                  
                  <Button
                    onClick={() => setLocation('/alerts')}
                    variant="outline"
                    className="flex items-center justify-center space-x-3 p-6 h-auto border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 group"
                  >
                    <AlertTriangle className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
                    <span className="text-gray-600 group-hover:text-orange-600 font-medium">Alertas</span>
                  </Button>
                  
                  <Button
                    onClick={() => setLocation('/subscription')}
                    variant="outline"
                    className="flex items-center justify-center space-x-3 p-6 h-auto border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group"
                  >
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
                    <span className="text-gray-600 group-hover:text-purple-600 font-medium">Assinatura</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navigation from "../components/Navigation";
import MobileNavigation from "../components/MobileNavigation";
import Sidebar from "../components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Calendar, User, Search, Filter, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Alerts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterStatus, setFilterStatus] = useState("all");

  // Trainings query to get expiry alerts
  const { data: trainings = [], isLoading: trainingsLoading, error } = useQuery({
    queryKey: ["/api/trainings"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
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
  }, [error, toast]);

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

  // Calculate days until expiry and filter alerts
  const getExpiryStatus = (validUntil: string) => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { status: "expired", days: diffDays, label: "Expirado" };
    if (diffDays <= 5) return { status: "critical", days: diffDays, label: `${diffDays} dias` };
    if (diffDays <= 30) return { status: "warning", days: diffDays, label: `${diffDays} dias` };
    return { status: "ok", days: diffDays, label: `${diffDays} dias` };
  };

  // Filter and sort trainings for alerts
  const alertTrainings = trainings
    .map((training: any) => ({
      ...training,
      expiryInfo: getExpiryStatus(training.validUntil)
    }))
    .filter((training: any) => {
      // Only show trainings that need attention (expired or expiring soon)
      if (training.expiryInfo.status === "ok") return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          training.name.toLowerCase().includes(searchLower) ||
          training.employeeName.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by status
      if (filterStatus !== "all") {
        return training.expiryInfo.status === filterStatus;
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "date":
          return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
        case "employee":
          return a.employeeName.localeCompare(b.employeeName);
        case "training":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "warning":
        return <Badge variant="secondary">Atenção</Badge>;
      default:
        return <Badge variant="default">OK</Badge>;
    }
  };

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
          <Sidebar activeTab="alerts" />
        </div>
        
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Bell className="w-8 h-8 mr-3 text-orange-500" />
                  Alertas de Treinamentos
                </h2>
                <p className="text-gray-600 mt-1">Treinamentos próximos do vencimento</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Badge variant="outline" className="text-lg px-3 py-2">
                  {alertTrainings.length} alertas
                </Badge>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtros e Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por funcionário ou treinamento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Data de vencimento</SelectItem>
                      <SelectItem value="employee">Nome do funcionário</SelectItem>
                      <SelectItem value="training">Nome do treinamento</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="expired">Expirados</SelectItem>
                      <SelectItem value="critical">Críticos (≤ 5 dias)</SelectItem>
                      <SelectItem value="warning">Atenção (≤ 30 dias)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Alerts List */}
            {trainingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : alertTrainings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? "Nenhum alerta encontrado" : "Nenhum alerta pendente"}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? "Tente ajustar os filtros de busca"
                      : "Todos os treinamentos estão em dia! 🎉"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {alertTrainings.map((training: any) => (
                  <Card key={training.id} className="border-l-4 border-l-orange-400">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start sm:items-center gap-3 mb-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500 mt-1 sm:mt-0" />
                            <div>
                              <h3 className="font-semibold text-gray-900">{training.name}</h3>
                              <div className="flex items-center text-gray-600 mt-1">
                                <User className="w-4 h-4 mr-1" />
                                <span>{training.employeeName}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>Vence em: {new Date(training.validUntil).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <span className="text-gray-400 hidden sm:block">•</span>
                            <span className="text-sm text-gray-600">
                              Restam: {training.expiryInfo.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 sm:mt-0 sm:ml-4">
                          {getStatusBadge(training.expiryInfo.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
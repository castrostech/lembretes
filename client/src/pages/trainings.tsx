import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navigation from "../components/Navigation";
import MobileNavigation from "../components/MobileNavigation";
import Sidebar from "../components/Sidebar";
import TrainingForm from "@/components/TrainingForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Edit, Trash2, Calendar, Clock, AlertTriangle } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Training, Employee } from "@shared/schema";

export default function Trainings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch trainings
  const { data: trainings, isLoading: trainingsLoading, error: trainingsError } = useQuery({
    queryKey: ["/api/trainings"],
    retry: false,
  });

  // Fetch employees for the form
  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
    retry: false,
  });

  // Delete training mutation
  const deleteMutation = useMutation({
    mutationFn: async (trainingId: string) => {
      await apiRequest("DELETE", `/api/trainings/${trainingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
      toast({
        title: "Treinamento removido",
        description: "Treinamento removido com sucesso.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao remover treinamento.",
        variant: "destructive",
      });
    },
  });

  // Handle unauthorized error
  useEffect(() => {
    if (trainingsError && isUnauthorizedError(trainingsError)) {
      toast({
        title: "Não autorizado",
        description: "Você foi desconectado. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [trainingsError, toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    setIsFormOpen(true);
  };

  const handleDelete = (trainingId: string) => {
    if (confirm("Tem certeza que deseja remover este treinamento?")) {
      deleteMutation.mutate(trainingId);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTraining(null);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find((emp: Employee) => emp.id === employeeId);
    return employee?.name || "Funcionário não encontrado";
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 5 && diffDays >= 0;
  };

  const isExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const getStatusBadge = (training: Training) => {
    if (isExpired(training.expiryDate)) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Vencido</Badge>;
    }
    if (isExpiringSoon(training.expiryDate)) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Vencendo</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>;
  };

  const filteredTrainings = trainings?.filter((training: Training) =>
    training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getEmployeeName(training.employeeId).toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (authLoading) {
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
          <Sidebar activeTab="trainings" />
        </div>
        
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Treinamentos</h2>
                <p className="text-gray-600 mt-1">Controle os treinamentos da sua equipe</p>
              </div>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 sm:mt-0 bg-green-600 text-white hover:bg-green-700 shadow-lg">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Novo Treinamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTraining ? "Editar Treinamento" : "Novo Treinamento"}
                    </DialogTitle>
                  </DialogHeader>
                  <TrainingForm 
                    training={editingTraining} 
                    employees={employees || []}
                    onClose={handleFormClose}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filters */}
            <Card className="shadow-lg border-0">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Buscar treinamentos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="expiring">Vencendo</SelectItem>
                        <SelectItem value="expired">Vencidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trainings Table */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Treinamento
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Funcionário
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conclusão
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trainingsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-500">Carregando treinamentos...</p>
                        </td>
                      </tr>
                    ) : filteredTrainings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            {searchQuery ? "Nenhum treinamento encontrado." : "Nenhum treinamento cadastrado ainda."}
                          </div>
                          {!searchQuery && (
                            <p className="text-sm text-gray-400 mt-2">
                              Clique em "Novo Treinamento" para começar.
                            </p>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredTrainings.map((training: Training) => (
                        <tr key={training.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{training.title}</div>
                                <div className="text-sm text-gray-500">{training.validityDays} dias de validade</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{getEmployeeName(training.employeeId)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {new Date(training.completionDate).toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {isExpiringSoon(training.expiryDate) && (
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                              )}
                              <span className="text-sm text-gray-900">
                                {new Date(training.expiryDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(training)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(training)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(training.id)}
                              className="text-red-600 hover:text-red-800"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

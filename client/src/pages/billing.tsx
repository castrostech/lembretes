import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, Calendar, Check, Settings } from "lucide-react";

export default function Billing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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
      <Navigation />
      
      <div className="flex">
        <Sidebar activeTab="billing" />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Cobrança e Pagamentos</h2>
              <p className="text-gray-600 mt-1">Gerencie sua assinatura e métodos de pagamento</p>
            </div>

            {/* Current Plan */}
            <Card className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-xl">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Plano Professional - Trial</h3>
                    <p className="text-blue-100 mb-4">Aproveite todos os recursos durante seu período gratuito</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5" />
                        <span>7 dias restantes no trial</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>R$ 100/mês após o trial</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 md:mt-0">
                    <Button className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3 shadow-lg">
                      <Settings className="w-4 h-4 mr-2" />
                      Gerenciar Plano
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Método de Pagamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum cartão cadastrado</h4>
                  <p className="text-gray-600 mb-6">Adicione um cartão de crédito para continuar usando nossos serviços após o trial</p>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Adicionar Cartão
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Histórico de Cobrança</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum histórico de cobrança ainda</p>
                  <p className="text-sm text-gray-500 mt-2">Suas faturas aparecerão aqui após o primeiro pagamento</p>
                </div>
              </CardContent>
            </Card>

            {/* Plan Benefits */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Benefícios do Seu Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Funcionários ilimitados</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Treinamentos ilimitados</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Alertas automáticos por email</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Dashboard com relatórios</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Suporte técnico prioritário</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Backup automático de dados</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Contact */}
            <Card className="bg-blue-50 border-blue-200 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h4 className="font-semibold text-blue-900 mb-2">Precisa de Ajuda?</h4>
                  <p className="text-blue-700 text-sm mb-4">Nossa equipe está pronta para ajudar com questões sobre cobrança e pagamentos.</p>
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    Entrar em Contato
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

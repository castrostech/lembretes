import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Bell, BarChart3, Shield } from "lucide-react";
import { signInWithGoogle } from "../lib/firebase";
import { FcGoogle } from "react-icons/fc";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleGoogleLogin = () => {
    signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-white/5 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Main login card */}
          <Card className="backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl">
            <CardContent className="pt-8 pb-8 px-8">
              {/* Logo and branding */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">TrainManager Pro</h1>
                <p className="text-white/80 text-lg">Gestão inteligente de treinamentos corporativos</p>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-gray-700 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-gray-200"
                >
                  <FcGoogle className="w-5 h-5 mr-3" />
                  Entrar com Google
                </Button>
                
                <Button 
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full bg-transparent text-white border-white/30 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200"
                >
                  Entrar com Replit
                </Button>
              </div>

              {/* Trial info */}
              <div className="text-center mt-6">
                <p className="text-white/70 text-sm">
                  ✨ 7 dias grátis • R$ 100/mês • Cancele quando quiser
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-white/90 text-sm font-medium">Funcionários Ilimitados</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <BookOpen className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-white/90 text-sm font-medium">Controle de Treinamentos</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <Bell className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-white/90 text-sm font-medium">Alertas Automáticos</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-white/90 text-sm font-medium">Dashboard Analítico</p>
              </CardContent>
            </Card>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center mt-8 space-x-2 text-white/60">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Dados seguros e criptografados</span>
          </div>
        </div>
      </div>
    </div>
  );
}

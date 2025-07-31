import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Clock, TrendingUp } from "lucide-react";

interface StatsData {
  totalEmployees: number;
  totalTrainings: number;
  expiringSoon: number;
  completionRate: number;
}

interface DashboardStatsProps {
  stats?: StatsData;
  isLoading: boolean;
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-lg border-0 animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Funcionários",
      value: stats?.totalEmployees || 0,
      change: "+0 este mês",
      changeType: "positive" as const,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
    },
    {
      title: "Treinamentos Ativos",
      value: stats?.totalTrainings || 0,
      change: "+0 esta semana",
      changeType: "positive" as const,
      icon: BookOpen,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Vencendo em 5 dias",
      value: stats?.expiringSoon || 0,
      change: stats?.expiringSoon ? "Requer atenção" : "Tudo em dia",
      changeType: stats?.expiringSoon ? ("warning" as const) : ("positive" as const),
      icon: Clock,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Taxa de Conformidade",
      value: `${stats?.completionRate || 100}%`,
      change: "Excelente",
      changeType: "positive" as const,
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive' 
                      ? 'text-green-600' 
                      : stat.changeType === 'warning'
                        ? 'text-orange-600'
                        : 'text-red-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

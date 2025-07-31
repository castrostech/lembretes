import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertEmployeeSchema, type Employee, type InsertEmployee } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isUnauthorizedError } from "@/lib/authUtils";

interface EmployeeFormProps {
  employee?: Employee | null;
  onClose: () => void;
}

export default function EmployeeForm({ employee, onClose }: EmployeeFormProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: employee?.name || "",
      email: employee?.email || "",
      position: employee?.position || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      if (employee) {
        await apiRequest("PUT", `/api/employees/${employee.id}`, data);
      } else {
        await apiRequest("POST", "/api/employees", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: employee ? "Funcionário atualizado" : "Funcionário criado",
        description: employee 
          ? "Funcionário atualizado com sucesso." 
          : "Funcionário criado com sucesso.",
      });
      onClose();
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
        description: employee 
          ? "Erro ao atualizar funcionário." 
          : "Erro ao criar funcionário.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Ex: João Silva"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder="joao.silva@empresa.com"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Cargo</Label>
        <Input
          id="position"
          {...form.register("position")}
          placeholder="Ex: Analista de Qualidade"
        />
        {form.formState.errors.position && (
          <p className="text-sm text-red-600">{form.formState.errors.position.message}</p>
        )}
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={mutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={mutation.isPending}
        >
          {mutation.isPending 
            ? "Salvando..." 
            : employee 
              ? "Atualizar" 
              : "Salvar"
          }
        </Button>
      </div>
    </form>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertTrainingSchema, type Training, type InsertTraining, type Employee } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isUnauthorizedError } from "@/lib/authUtils";

interface TrainingFormProps {
  training?: Training | null;
  employees: Employee[];
  onClose: () => void;
}

export default function TrainingForm({ training, employees, onClose }: TrainingFormProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertTraining>({
    resolver: zodResolver(insertTrainingSchema),
    defaultValues: {
      title: training?.title || "",
      employeeId: training?.employeeId || "",
      completionDate: training?.completionDate || new Date().toISOString().split('T')[0],
      validityDays: training?.validityDays || 365,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertTraining) => {
      if (training) {
        await apiRequest("PUT", `/api/trainings/${training.id}`, data);
      } else {
        await apiRequest("POST", "/api/trainings", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: training ? "Treinamento atualizado" : "Treinamento cadastrado",
        description: training 
          ? "Treinamento atualizado com sucesso." 
          : "Treinamento cadastrado com sucesso.",
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
        description: training 
          ? "Erro ao atualizar treinamento." 
          : "Erro ao cadastrar treinamento.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTraining) => {
    mutation.mutate(data);
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Você precisa cadastrar funcionários antes de adicionar treinamentos.
        </p>
        <Button onClick={onClose} variant="outline">
          Fechar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título do Treinamento</Label>
        <Input
          id="title"
          {...form.register("title")}
          placeholder="Ex: Treinamento de Segurança do Trabalho"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="employeeId">Funcionário</Label>
        <Select
          value={form.watch("employeeId")}
          onValueChange={(value) => form.setValue("employeeId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name} - {employee.position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.employeeId && (
          <p className="text-sm text-red-600">{form.formState.errors.employeeId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="completionDate">Data de Conclusão</Label>
        <Input
          id="completionDate"
          type="date"
          {...form.register("completionDate")}
        />
        {form.formState.errors.completionDate && (
          <p className="text-sm text-red-600">{form.formState.errors.completionDate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="validityDays">Validade (dias)</Label>
        <Input
          id="validityDays"
          type="number"
          min="1"
          {...form.register("validityDays", { valueAsNumber: true })}
          placeholder="365"
        />
        {form.formState.errors.validityDays && (
          <p className="text-sm text-red-600">{form.formState.errors.validityDays.message}</p>
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
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={mutation.isPending}
        >
          {mutation.isPending 
            ? "Salvando..." 
            : training 
              ? "Atualizar" 
              : "Salvar"
          }
        </Button>
      </div>
    </form>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TarjetaCuota } from "@/types/tarjeta";
import { useToast } from "@/hooks/use-toast";

export const useTarjetaCuotas = (tarjetaId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: cuotas = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tarjeta-cuotas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tarjeta_cuotas")
        .select(`
          *,
          tarjeta:tarjetas_credito(nombre)
        `)
        .order("cantidad_cuotas", { ascending: true });

      if (error) throw error;
      return data as TarjetaCuota[];
    },
  });

  // Get installments by credit card
  const useCuotasByTarjeta = (tarjetaId: string | null) => {
    return useQuery({
      queryKey: ["tarjeta-cuotas", "tarjeta", tarjetaId],
      queryFn: async () => {
        if (!tarjetaId) {
          return [];
        }
        
        if (!tarjetaId) return [];
        
        const { data, error } = await supabase
          .from("tarjeta_cuotas")
          .select("*")
          .eq("tarjeta_id", tarjetaId)
          .eq("activa", true)
          .order("cantidad_cuotas", { ascending: true });

        if (error) throw error;
        return data as TarjetaCuota[];
      },
      enabled: !!tarjetaId,
    });
  };

  const createCuotaMutation = useMutation({
    mutationFn: async (cuota: Omit<TarjetaCuota, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("tarjeta_cuotas")
        .insert([cuota])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjeta-cuotas"] });
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] });
      toast({
        title: "Éxito",
        description: "Configuración de cuotas agregada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al agregar cuotas: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateCuotaMutation = useMutation({
    mutationFn: async ({ id, cuota }: { id: string; cuota: Omit<TarjetaCuota, "id" | "created_at" | "updated_at"> }) => {
      const { data, error } = await supabase
        .from("tarjeta_cuotas")
        .update(cuota)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjeta-cuotas"] });
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] });
      toast({
        title: "Éxito",
        description: "Configuración de cuotas actualizada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar cuotas: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteCuotaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tarjeta_cuotas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjeta-cuotas"] });
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] });
      toast({
        title: "Éxito",
        description: "Configuración de cuotas eliminada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al eliminar cuotas: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    cuotas,
    isLoading,
    error,
    useCuotasByTarjeta,
    createCuota: createCuotaMutation.mutate,
    updateCuota: updateCuotaMutation.mutate,
    deleteCuota: deleteCuotaMutation.mutate,
    isCreating: createCuotaMutation.isPending,
    isUpdating: updateCuotaMutation.isPending,
    isDeleting: deleteCuotaMutation.isPending,
  };
};
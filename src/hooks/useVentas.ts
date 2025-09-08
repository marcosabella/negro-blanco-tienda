import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Venta, VentaItem } from "@/types/venta";
import { useToast } from "@/hooks/use-toast";

export const useVentas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: ventas = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ventas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ventas")
        .select(`
          *,
          cliente:clientes(nombre, apellido),
          venta_items(
            *,
            producto:productos(cod_producto, descripcion)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Venta[];
    },
  });

  const createVentaMutation = useMutation({
    mutationFn: async ({ venta, items }: { venta: Omit<Venta, "id" | "created_at" | "updated_at">; items: Omit<VentaItem, "id" | "venta_id" | "created_at" | "updated_at">[] }) => {
      const { data: ventaData, error: ventaError } = await supabase
        .from("ventas")
        .insert([venta])
        .select()
        .single();

      if (ventaError) throw ventaError;

      if (items.length > 0) {
        const itemsWithVentaId = items.map(item => ({
          ...item,
          venta_id: ventaData.id
        }));

        const { error: itemsError } = await supabase
          .from("venta_items")
          .insert(itemsWithVentaId);

        if (itemsError) throw itemsError;
      }

      return ventaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      toast({
        title: "Éxito",
        description: "Venta registrada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar venta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteVentaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ventas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      toast({
        title: "Éxito",
        description: "Venta eliminada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al eliminar venta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    ventas,
    isLoading,
    error,
    createVenta: createVentaMutation.mutate,
    deleteVenta: deleteVentaMutation.mutate,
    isCreating: createVentaMutation.isPending,
    isDeleting: deleteVentaMutation.isPending,
  };
};
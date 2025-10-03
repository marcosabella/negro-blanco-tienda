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
          banco:bancos(nombre_banco, numero_cuenta),
          tarjeta:tarjetas_credito(nombre),
          venta_items(
            *,
            producto:productos(cod_producto, descripcion, precio_venta, porcentaje_iva)
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

      // If payment type is "cta_cte" and there's a cliente_id, create debit movement
      if (venta.tipo_pago === 'cta_cte' && venta.cliente_id) {
        const { error: cuentaError } = await supabase
          .from("cuenta_corriente")
          .insert([{
            cliente_id: venta.cliente_id,
            tipo_movimiento: 'debito',
            monto: venta.total,
            concepto: 'venta_credito',
            venta_id: ventaData.id,
            fecha_movimiento: venta.fecha_venta,
          }]);

        if (cuentaError) throw cuentaError;
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

  const updateVentaMutation = useMutation({
    mutationFn: async ({ 
      ventaId, 
      venta, 
      items 
    }: { 
      ventaId: string; 
      venta: Omit<Venta, "id" | "created_at" | "updated_at">; 
      items: Omit<VentaItem, "id" | "venta_id" | "created_at" | "updated_at">[] 
    }) => {
      // First, delete any existing cuenta corriente movements for this sale
      const { error: deleteCuentaError } = await supabase
        .from("cuenta_corriente")
        .delete()
        .eq("venta_id", ventaId);

      if (deleteCuentaError) throw deleteCuentaError;

      // Update venta
      const { data: ventaData, error: ventaError } = await supabase
        .from("ventas")
        .update(venta)
        .eq("id", ventaId)
        .select()
        .single();

      if (ventaError) throw ventaError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from("venta_items")
        .delete()
        .eq("venta_id", ventaId);

      if (deleteError) throw deleteError;

      // Insert new items
      if (items.length > 0) {
        const itemsWithVentaId = items.map(item => ({
          ...item,
          venta_id: ventaId
        }));

        const { error: itemsError } = await supabase
          .from("venta_items")
          .insert(itemsWithVentaId);

        if (itemsError) throw itemsError;
      }

      // If the updated payment type is "cta_cte" and there's a cliente_id, create debit movement
      if (venta.tipo_pago === 'cta_cte' && venta.cliente_id) {
        const { error: cuentaError } = await supabase
          .from("cuenta_corriente")
          .insert([{
            cliente_id: venta.cliente_id,
            tipo_movimiento: 'debito',
            monto: venta.total,
            concepto: 'venta_credito',
            venta_id: ventaId,
            fecha_movimiento: venta.fecha_venta,
          }]);

        if (cuentaError) throw cuentaError;
      }

      return ventaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["cuenta-corriente"] });
      toast({
        title: "Éxito",
        description: "Venta actualizada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar venta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteVentaMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete related cuenta corriente movements
      const { error: cuentaError } = await supabase
        .from("cuenta_corriente")
        .delete()
        .eq("venta_id", id);
      
      if (cuentaError) throw cuentaError;

      // Then delete the sale
      const { error } = await supabase.from("ventas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["cuenta-corriente"] });
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
    updateVenta: updateVentaMutation.mutate,
    deleteVenta: deleteVentaMutation.mutate,
    isCreating: createVentaMutation.isPending,
    isUpdating: updateVentaMutation.isPending,
    isDeleting: deleteVentaMutation.isPending,
  };
};
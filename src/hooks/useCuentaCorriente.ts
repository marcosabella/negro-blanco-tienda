import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CuentaCorriente, CuentaCorrienteResumen } from "@/types/cuenta-corriente";
import { useToast } from "@/hooks/use-toast";

export const useCuentaCorriente = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all movements
  const {
    data: movimientos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cuenta-corriente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cuenta_corriente")
        .select(`
          *,
          cliente:clientes(nombre, apellido, cuit),
          venta:ventas(numero_comprobante)
        `)
        .order("fecha_movimiento", { ascending: false });

      if (error) throw error;
      return data as CuentaCorriente[];
    },
  });

  // Get movements by client
  const getMovimientosByCliente = (clienteId: string) => {
    return useQuery({
      queryKey: ["cuenta-corriente", "cliente", clienteId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("cuenta_corriente")
          .select(`
            *,
            cliente:clientes(nombre, apellido, cuit),
            venta:ventas(numero_comprobante)
          `)
          .eq("cliente_id", clienteId)
          .order("fecha_movimiento", { ascending: false });

        if (error) throw error;
        return data as CuentaCorriente[];
      },
    });
  };

  // Get account summary by client
  const getResumenCuentaCorreinte = () => {
    return useQuery({
      queryKey: ["cuenta-corriente", "resumen"],
      queryFn: async () => {
        // Manual calculation since RPC function doesn't exist yet
        const { data: movimientos, error: movError } = await supabase
          .from("cuenta_corriente")
          .select(`
            cliente_id,
            tipo_movimiento,
            monto,
            fecha_movimiento,
            cliente:clientes(nombre, apellido, cuit)
          `);

        if (movError) throw movError;

        // Group by cliente_id and calculate totals
        const resumenMap = new Map<string, any>();
        
        movimientos?.forEach((mov) => {
          const key = mov.cliente_id;
          if (!resumenMap.has(key)) {
            resumenMap.set(key, {
              cliente_id: mov.cliente_id,
              cliente_nombre: mov.cliente?.nombre || '',
              cliente_apellido: mov.cliente?.apellido || '',
              cliente_cuit: mov.cliente?.cuit || '',
              total_debitos: 0,
              total_creditos: 0,
              saldo_actual: 0,
              ultimo_movimiento: mov.fecha_movimiento,
            });
          }

          const resumen = resumenMap.get(key);
          if (mov.tipo_movimiento === 'debito') {
            resumen.total_debitos += Number(mov.monto);
          } else {
            resumen.total_creditos += Number(mov.monto);
          }
          resumen.saldo_actual = resumen.total_debitos - resumen.total_creditos;
          
          // Update last movement date if newer
          if (new Date(mov.fecha_movimiento) > new Date(resumen.ultimo_movimiento)) {
            resumen.ultimo_movimiento = mov.fecha_movimiento;
          }
        });

        return Array.from(resumenMap.values()) as CuentaCorrienteResumen[];
      },
    });
  };

  const createMovimientoMutation = useMutation({
    mutationFn: async (movimiento: Omit<CuentaCorriente, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("cuenta_corriente")
        .insert([movimiento])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuenta-corriente"] });
      toast({
        title: "Éxito",
        description: "Movimiento registrado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar movimiento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMovimientoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cuenta_corriente").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuenta-corriente"] });
      toast({
        title: "Éxito",
        description: "Movimiento eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al eliminar movimiento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    movimientos,
    isLoading,
    error,
    getMovimientosByCliente,
    getResumenCuentaCorreinte,
    createMovimiento: createMovimientoMutation.mutate,
    deleteMovimiento: deleteMovimientoMutation.mutate,
    isCreating: createMovimientoMutation.isPending,
    isDeleting: deleteMovimientoMutation.isPending,
  };
};
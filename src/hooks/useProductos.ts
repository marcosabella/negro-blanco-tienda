import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Producto } from "@/types/producto";
import { useToast } from "@/hooks/use-toast";

export const useProductos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: productos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select(`
          *,
          proveedor:proveedores(nombre, apellido, razon_social),
          marca:marcas(nombre),
          rubro:rubros(nombre),
          subrubro:subrubros(nombre)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Producto[];
    },
  });

  const createProductoMutation = useMutation({
    mutationFn: async (producto: Omit<Producto, "id" | "created_at" | "updated_at" | "precio_venta">) => {
      const { data, error } = await supabase
        .from("productos")
        .insert([producto])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast({
        title: "Éxito",
        description: "Producto creado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear producto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateProductoMutation = useMutation({
    mutationFn: async ({ id, ...producto }: Partial<Producto> & { id: string }) => {
      const { data, error } = await supabase
        .from("productos")
        .update(producto)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar producto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteProductoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al eliminar producto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    productos,
    isLoading,
    error,
    createProducto: createProductoMutation.mutate,
    updateProducto: updateProductoMutation.mutate,
    deleteProducto: deleteProductoMutation.mutate,
    isCreating: createProductoMutation.isPending,
    isUpdating: updateProductoMutation.isPending,
    isDeleting: deleteProductoMutation.isPending,
  };
};
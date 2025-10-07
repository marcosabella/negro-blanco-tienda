import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Comercio, ComercioFormData } from "@/types/comercio";
import { useToast } from "@/hooks/use-toast";

export const useComercio = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comercio, isLoading } = useQuery({
    queryKey: ["comercio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comercio")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Comercio | null;
    },
  });

  const createComercio = useMutation({
    mutationFn: async (formData: ComercioFormData) => {
      const { data, error } = await supabase
        .from("comercio")
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comercio"] });
      toast({
        title: "Éxito",
        description: "Datos del comercio guardados correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo guardar: ${error.message}`,
      });
    },
  });

  const updateComercio = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ComercioFormData }) => {
      const { data, error } = await supabase
        .from("comercio")
        .update(formData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comercio"] });
      toast({
        title: "Éxito",
        description: "Datos del comercio actualizados correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo actualizar: ${error.message}`,
      });
    },
  });

  return {
    comercio,
    isLoading,
    createComercio,
    updateComercio,
  };
};

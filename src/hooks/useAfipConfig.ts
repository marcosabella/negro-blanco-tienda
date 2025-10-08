import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AfipConfig, AfipConfigInsert, AfipConfigUpdate } from '@/types/afip';
import { useToast } from '@/hooks/use-toast';

export const useAfipConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['afip-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('afip_config')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data as AfipConfig | null;
    },
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (config: AfipConfigInsert | AfipConfigUpdate) => {
      const existingConfig = await supabase
        .from('afip_config')
        .select('id')
        .maybeSingle();

      if (existingConfig.data) {
        const { data, error } = await supabase
          .from('afip_config')
          .update(config)
          .eq('id', existingConfig.data.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('afip_config')
          .insert(config as AfipConfigInsert)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afip-config'] });
      toast({
        title: 'Configuración guardada',
        description: 'La configuración de AFIP se guardó correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `No se pudo guardar la configuración: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    config,
    isLoading,
    createOrUpdate: createOrUpdateMutation.mutate,
    isCreatingOrUpdating: createOrUpdateMutation.isPending,
  };
};

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DatosArca {
  nombre: string;
  apellido: string;
  razonSocial?: string;
  tipoPersona: 'fisica' | 'juridica';
  situacionAfip: string;
  domicilioFiscal?: {
    calle?: string;
    numero?: string;
    localidad?: string;
    provincia?: string;
    codigoPostal?: string;
  };
}

export function useConsultarArca() {
  const [isLoading, setIsLoading] = useState(false);

  const consultarCuit = async (cuit: string): Promise<DatosArca | null> => {
    if (!cuit || cuit.replace(/[-\s]/g, '').length < 11) {
      toast({
        title: "CUIT inválido",
        description: "Ingrese un CUIT válido de 11 dígitos",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('consultar-arca', {
        body: { cuit },
      });

      if (error) {
        // Si hay error de función, mostrar mensaje amigable
        console.error('Error de función:', error);
        toast({
          title: "Servicio no disponible",
          description: "El servicio de ARCA no está disponible. Ingrese los datos manualmente.",
          variant: "destructive",
        });
        return null;
      }

      if (!data || !data.success) {
        toast({
          title: "CUIT no encontrado",
          description: data?.error || "No se encontraron datos. Ingrese los datos manualmente.",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Datos obtenidos",
        description: "Se completaron los datos desde ARCA",
      });

      return data.data as DatosArca;

    } catch (error: any) {
      console.error('Error consultando ARCA:', error);
      toast({
        title: "Servicio no disponible",
        description: "No se pudo conectar con ARCA. Ingrese los datos manualmente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    consultarCuit,
    isLoading,
  };
}

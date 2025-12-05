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

// Detectar tipo de persona por prefijo del CUIT
function detectarTipoPersona(cuit: string): 'fisica' | 'juridica' {
  const cuitLimpio = cuit.replace(/[-\s]/g, '');
  const prefijo = cuitLimpio.substring(0, 2);
  return ['30', '33', '34'].includes(prefijo) ? 'juridica' : 'fisica';
}

export function useConsultarArca() {
  const [isLoading, setIsLoading] = useState(false);

  const consultarCuit = async (cuit: string): Promise<DatosArca | null> => {
    const cuitLimpio = cuit.replace(/[-\s]/g, '');
    
    if (!cuit || cuitLimpio.length < 11) {
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
        console.error('Error de función:', error);
        // Si hay error, al menos devolver el tipo de persona
        const tipoPersona = detectarTipoPersona(cuit);
        toast({
          title: "Servicio limitado",
          description: `Se detectó persona ${tipoPersona === 'juridica' ? 'jurídica' : 'física'}. Complete los demás datos.`,
        });
        return {
          nombre: '',
          apellido: '',
          tipoPersona,
          situacionAfip: '',
        };
      }

      if (!data || !data.success) {
        // Usar el tipo de persona del response si está disponible
        const tipoPersona = data?.tipoPersona || detectarTipoPersona(cuit);
        toast({
          title: "Datos parciales",
          description: `Tipo: persona ${tipoPersona === 'juridica' ? 'jurídica' : 'física'}. Complete los demás datos.`,
        });
        return {
          nombre: '',
          apellido: '',
          tipoPersona,
          situacionAfip: '',
        };
      }

      toast({
        title: "Datos obtenidos",
        description: "Se completaron los datos desde ARCA",
      });

      return data.data as DatosArca;

    } catch (error: any) {
      console.error('Error consultando ARCA:', error);
      const tipoPersona = detectarTipoPersona(cuit);
      toast({
        title: "Servicio no disponible",
        description: `Se detectó persona ${tipoPersona === 'juridica' ? 'jurídica' : 'física'}. Complete manualmente.`,
      });
      return {
        nombre: '',
        apellido: '',
        tipoPersona,
        situacionAfip: '',
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    consultarCuit,
    isLoading,
  };
}

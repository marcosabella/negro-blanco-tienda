import { useState } from 'react';
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
  // 30, 33, 34 son personas jurídicas
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

    // Detectar tipo de persona por el CUIT
    const tipoPersona = detectarTipoPersona(cuit);

    // Simular delay para UX
    await new Promise(resolve => setTimeout(resolve, 500));

    setIsLoading(false);

    // Como las APIs públicas no funcionan, devolver datos básicos detectados
    toast({
      title: "Tipo de persona detectado",
      description: `CUIT corresponde a persona ${tipoPersona === 'juridica' ? 'jurídica' : 'física'}. Complete los demás datos manualmente.`,
    });

    return {
      nombre: '',
      apellido: '',
      tipoPersona,
      situacionAfip: '',
    };
  };

  return {
    consultarCuit,
    isLoading,
  };
}

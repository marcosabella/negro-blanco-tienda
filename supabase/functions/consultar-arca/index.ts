import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArcaResponse {
  success: boolean;
  data?: {
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
  };
  error?: string;
}

// Mapeo de códigos de categoría AFIP a nombres
const CATEGORIAS_AFIP: Record<string, string> = {
  'AC': 'Responsable Inscripto',
  'RI': 'Responsable Inscripto',
  'CF': 'Consumidor Final',
  'EX': 'Exento',
  'RS': 'Monotributista',
  'MT': 'Monotributista',
  'NR': 'No Responsable',
  'NA': 'No Alcanzado',
  'NC': 'No Categorizado',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cuit } = await req.json();

    if (!cuit) {
      return new Response(
        JSON.stringify({ success: false, error: "CUIT es requerido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Limpiar CUIT (remover guiones y espacios)
    const cuitLimpio = cuit.replace(/[-\s]/g, '');

    if (cuitLimpio.length !== 11) {
      return new Response(
        JSON.stringify({ success: false, error: "CUIT debe tener 11 dígitos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Consultar API pública de ARCA/AFIP (usando servicio de terceros confiable)
    // Usamos la API de AFIP Constancia de Inscripción
    const response = await fetch(
      `https://afip.tangofactura.com/Rest/GetContribuyenteFull?cuit=${cuitLimpio}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Si falla el primer servicio, intentar con alternativa
      const altResponse = await fetch(
        `https://soa.afip.gob.ar/sr-padron/v2/persona/${cuitLimpio}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!altResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: "No se pudo consultar ARCA. Intente nuevamente." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      const altData = await altResponse.json();
      
      if (altData.success === false || !altData.data) {
        return new Response(
          JSON.stringify({ success: false, error: "CUIT no encontrado en ARCA" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      const persona = altData.data;
      const esJuridica = persona.tipoClave === 'CUIT' && persona.tipoPersona === 'JURIDICA';

      const result: ArcaResponse = {
        success: true,
        data: {
          nombre: esJuridica ? (persona.razonSocial || '') : (persona.nombre || ''),
          apellido: esJuridica ? '' : (persona.apellido || ''),
          razonSocial: persona.razonSocial,
          tipoPersona: esJuridica ? 'juridica' : 'fisica',
          situacionAfip: mapearSituacionAfip(persona.estadoClave),
          domicilioFiscal: persona.domicilioFiscal ? {
            calle: persona.domicilioFiscal.direccion,
            localidad: persona.domicilioFiscal.localidad,
            provincia: mapearProvincia(persona.domicilioFiscal.idProvincia),
            codigoPostal: persona.domicilioFiscal.codPostal,
          } : undefined,
        },
      };

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (!data || data.errorGetData) {
      return new Response(
        JSON.stringify({ success: false, error: data.errorMessage || "CUIT no encontrado en ARCA" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Determinar tipo de persona
    const esJuridica = data.tipoPersona === 'JURIDICA' || 
                       (data.tipoClave === '80' || cuitLimpio.startsWith('30') || cuitLimpio.startsWith('33'));

    // Mapear situación AFIP
    let situacionAfip = 'Consumidor Final';
    if (data.impuestos && Array.isArray(data.impuestos)) {
      const tieneIVA = data.impuestos.some((i: any) => i.idImpuesto === 30 || i.idImpuesto === 32);
      const tieneMonotributo = data.impuestos.some((i: any) => i.idImpuesto === 20);
      
      if (tieneIVA) {
        situacionAfip = 'Responsable Inscripto';
      } else if (tieneMonotributo) {
        situacionAfip = 'Monotributista';
      } else if (data.categoriasMonotributo && data.categoriasMonotributo.length > 0) {
        situacionAfip = 'Monotributista';
      }
    }

    // Extraer nombre y apellido
    let nombre = '';
    let apellido = '';
    
    if (esJuridica) {
      nombre = data.razonSocial || data.nombre || '';
      apellido = '';
    } else {
      if (data.nombre) {
        const partes = data.nombre.split(' ');
        if (data.apellido) {
          nombre = data.nombre;
          apellido = data.apellido;
        } else if (partes.length > 1) {
          apellido = partes[0];
          nombre = partes.slice(1).join(' ');
        } else {
          nombre = data.nombre;
          apellido = '';
        }
      }
    }

    const result: ArcaResponse = {
      success: true,
      data: {
        nombre,
        apellido,
        razonSocial: data.razonSocial,
        tipoPersona: esJuridica ? 'juridica' : 'fisica',
        situacionAfip,
        domicilioFiscal: data.domicilioFiscal ? {
          calle: data.domicilioFiscal.calle || data.domicilioFiscal.direccion,
          numero: data.domicilioFiscal.numero,
          localidad: data.domicilioFiscal.localidad,
          provincia: mapearProvincia(data.domicilioFiscal.idProvincia || data.domicilioFiscal.provincia),
          codigoPostal: data.domicilioFiscal.codigoPostal || data.domicilioFiscal.codPostal,
        } : undefined,
      },
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error consultando ARCA:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function mapearSituacionAfip(estado: string): string {
  const mapeo: Record<string, string> = {
    'ACTIVO': 'Responsable Inscripto',
    'ACTIVA': 'Responsable Inscripto',
    'INACTIVO': 'Consumidor Final',
    'INACTIVA': 'Consumidor Final',
  };
  return mapeo[estado?.toUpperCase()] || 'Consumidor Final';
}

function mapearProvincia(idProvincia: string | number): string {
  const provincias: Record<string, string> = {
    '0': 'Ciudad Autónoma de Buenos Aires',
    '1': 'Buenos Aires',
    '2': 'Catamarca',
    '3': 'Córdoba',
    '4': 'Corrientes',
    '5': 'Entre Ríos',
    '6': 'Jujuy',
    '7': 'Mendoza',
    '8': 'La Rioja',
    '9': 'Salta',
    '10': 'San Juan',
    '11': 'San Luis',
    '12': 'Santa Fe',
    '13': 'Santiago del Estero',
    '14': 'Tucumán',
    '15': 'Chaco',
    '16': 'Chubut',
    '17': 'Formosa',
    '18': 'Misiones',
    '19': 'Neuquén',
    '20': 'La Pampa',
    '21': 'Río Negro',
    '22': 'Santa Cruz',
    '23': 'Tierra del Fuego',
  };
  return provincias[String(idProvincia)] || '';
}

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

serve(async (req) => {
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

    const cuitLimpio = cuit.replace(/[-\s]/g, '');

    if (cuitLimpio.length !== 11) {
      return new Response(
        JSON.stringify({ success: false, error: "CUIT debe tener 11 dígitos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Consultando CUIT: ${cuitLimpio}`);

    const prefijo = cuitLimpio.substring(0, 2);
    const esJuridica = ['30', '33', '34'].includes(prefijo);

    let data = null;

    // Intentar con API de AFIP pública (padron alcanzados)
    try {
      const response = await fetch(
        `https://afip.puc.gob.ar/buscar?q=${cuitLimpio}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/html',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          },
        }
      );

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          console.log("AFIP JSON:", JSON.stringify(json));
          if (json && json.persona) {
            data = parseAfipJson(json, cuitLimpio);
          }
        }
      }
    } catch (e) {
      console.log("Error con AFIP puc:", e);
    }

    // Intentar con API gratuita de Apis Datos Argentina
    if (!data) {
      try {
        const response = await fetch(
          `https://apis.datos.gob.ar/georef/api/provincias`,
          { method: 'GET' }
        );
        // Esta API es solo para referencia de provincias, no tiene datos de CUIT
        console.log("APIs datos.gob.ar disponible");
      } catch (e) {
        console.log("Error con datos.gob.ar:", e);
      }
    }

    // Usar servicio alternativo - Cuit Argentina API
    if (!data) {
      try {
        const response = await fetch(
          `https://cuit.ar/api/v1/cuit/${cuitLimpio}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const json = await response.json();
          console.log("cuit.ar response:", JSON.stringify(json));
          if (json && (json.nombre || json.razonSocial || json.denominacion)) {
            data = parseCuitArResponse(json, cuitLimpio);
          }
        }
      } catch (e) {
        console.log("Error con cuit.ar:", e);
      }
    }

    // Usar Cuitonline API
    if (!data) {
      try {
        const response = await fetch(
          `https://www.cuitonline.com/detalle/${cuitLimpio}.json`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const json = await response.json();
          console.log("cuitonline response:", JSON.stringify(json));
          if (json && json.razonSocial) {
            data = {
              nombre: esJuridica ? json.razonSocial : (json.nombre || json.razonSocial.split(' ').slice(1).join(' ')),
              apellido: esJuridica ? '' : (json.apellido || json.razonSocial.split(' ')[0] || ''),
              razonSocial: json.razonSocial,
              tipoPersona: esJuridica ? 'juridica' as const : 'fisica' as const,
              situacionAfip: mapearCondicionIva(json.condicionIva || json.categoriaIva),
              domicilioFiscal: json.domicilio ? {
                calle: json.domicilio.calle,
                numero: json.domicilio.numero,
                localidad: json.domicilio.localidad,
                provincia: json.domicilio.provincia,
                codigoPostal: json.domicilio.codigoPostal,
              } : undefined,
            };
          }
        }
      } catch (e) {
        console.log("Error con cuitonline:", e);
      }
    }

    if (!data) {
      console.log("No se encontraron datos en ninguna API");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No se pudieron obtener datos. Complete manualmente.",
          tipoPersona: esJuridica ? 'juridica' : 'fisica'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Validar datos antes de devolver
    if (data.nombre && (data.nombre.includes('[') || data.nombre.includes('{'))) {
      console.log("Datos inválidos detectados, descartando");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Datos inválidos. Complete manualmente.",
          tipoPersona: esJuridica ? 'juridica' : 'fisica'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const result: ArcaResponse = {
      success: true,
      data: data,
    };

    console.log("Datos obtenidos exitosamente:", JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error general:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno. Complete manualmente." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function parseAfipJson(json: any, cuit: string) {
  const prefijo = cuit.substring(0, 2);
  const esJuridica = ['30', '33', '34'].includes(prefijo);
  
  const persona = json.persona;
  
  return {
    nombre: esJuridica ? (persona.razonSocial || persona.denominacion) : persona.nombre,
    apellido: esJuridica ? '' : (persona.apellido || ''),
    razonSocial: persona.razonSocial || persona.denominacion,
    tipoPersona: esJuridica ? 'juridica' as const : 'fisica' as const,
    situacionAfip: mapearCondicionIva(persona.categoriaIva || persona.condicionIva),
    domicilioFiscal: persona.domicilio ? {
      calle: persona.domicilio.direccion || persona.domicilio.calle,
      numero: persona.domicilio.numero,
      localidad: persona.domicilio.localidad,
      provincia: persona.domicilio.provincia,
      codigoPostal: persona.domicilio.codigoPostal || persona.domicilio.cp,
    } : undefined,
  };
}

function parseCuitArResponse(json: any, cuit: string) {
  const prefijo = cuit.substring(0, 2);
  const esJuridica = ['30', '33', '34'].includes(prefijo);
  
  const denominacion = json.denominacion || json.razonSocial || json.nombre || '';
  
  let nombre = '';
  let apellido = '';
  
  if (esJuridica) {
    nombre = denominacion;
  } else {
    const partes = denominacion.split(/\s+/);
    if (partes.length >= 2) {
      apellido = partes[0];
      nombre = partes.slice(1).join(' ');
    } else {
      nombre = denominacion;
    }
  }
  
  return {
    nombre,
    apellido,
    razonSocial: esJuridica ? denominacion : undefined,
    tipoPersona: esJuridica ? 'juridica' as const : 'fisica' as const,
    situacionAfip: mapearCondicionIva(json.categoriaIva || json.condicionIva || json.categoria),
    domicilioFiscal: json.domicilio ? {
      calle: json.domicilio.calle || json.domicilio.direccion,
      localidad: json.domicilio.localidad,
      provincia: json.domicilio.provincia,
      codigoPostal: json.domicilio.codigoPostal,
    } : undefined,
  };
}

function mapearCondicionIva(condicion: string | undefined): string {
  if (!condicion) return 'Consumidor Final';
  
  const cond = condicion.toUpperCase();
  
  if (cond.includes('RESPONSABLE INSCRIPTO') || cond.includes('RI') || cond === 'AC') {
    return 'Responsable Inscripto';
  }
  if (cond.includes('MONOTRIBUTO') || cond.includes('MONOTRIBUTISTA') || cond.includes('RS') || cond === 'M') {
    return 'Monotributista';
  }
  if (cond.includes('EXENTO') || cond.includes('EX')) {
    return 'Exento';
  }
  if (cond.includes('CONSUMIDOR FINAL') || cond.includes('CF')) {
    return 'Consumidor Final';
  }
  
  return 'Consumidor Final';
}

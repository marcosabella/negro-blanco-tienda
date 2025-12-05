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

    console.log(`Consultando CUIT: ${cuitLimpio}`);

    // Intentar con API pública de cuitonline
    let data = null;
    let apiError = null;

    try {
      const response = await fetch(
        `https://cuitonline.com/search.php?q=${cuitLimpio}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml',
            'User-Agent': 'Mozilla/5.0 (compatible; AFIP-Consulta/1.0)',
          },
        }
      );

      if (response.ok) {
        const html = await response.text();
        data = parseHtmlResponse(html, cuitLimpio);
      }
    } catch (e) {
      console.log("Error con cuitonline:", e);
      apiError = e;
    }

    // Si no funcionó, intentar con datosabiertos
    if (!data) {
      try {
        const response = await fetch(
          `https://www.datosabiertos.gob.ar/api/3/action/datastore_search?resource_id=8f6e3d82-c3de-4d68-8b22-4d3e30c64ad5&q=${cuitLimpio}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const jsonData = await response.json();
          if (jsonData.success && jsonData.result?.records?.length > 0) {
            const record = jsonData.result.records[0];
            data = {
              nombre: record.nombre || '',
              apellido: record.apellido || '',
              tipoPersona: record.tipo_persona === 'JURIDICA' ? 'juridica' : 'fisica',
              situacionAfip: mapearSituacionFromCategoria(record.categoria),
            };
          }
        }
      } catch (e) {
        console.log("Error con datosabiertos:", e);
      }
    }

    // Si aún no hay datos, retornar error pero permitir ingreso manual
    if (!data) {
      console.log("No se pudieron obtener datos de ARCA");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No se encontraron datos para este CUIT. Por favor ingrese los datos manualmente." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const result: ArcaResponse = {
      success: true,
      data: data,
    };

    console.log("Datos obtenidos:", JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error consultando ARCA:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor. Ingrese los datos manualmente." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function parseHtmlResponse(html: string, cuit: string): any | null {
  try {
    // Buscar el nombre/razón social en el HTML
    const nombreMatch = html.match(/class="denomination"[^>]*>([^<]+)</i) ||
                       html.match(/Razón Social[^:]*:\s*([^<\n]+)/i) ||
                       html.match(/Denominación[^:]*:\s*([^<\n]+)/i);
    
    if (!nombreMatch) {
      return null;
    }

    const nombreCompleto = nombreMatch[1].trim();
    
    // Determinar tipo de persona por el prefijo del CUIT
    const prefijo = cuit.substring(0, 2);
    const esJuridica = ['30', '33', '34'].includes(prefijo);
    
    // Buscar situación fiscal
    let situacionAfip = 'Consumidor Final';
    if (html.includes('RESPONSABLE INSCRIPTO') || html.includes('Responsable Inscripto')) {
      situacionAfip = 'Responsable Inscripto';
    } else if (html.includes('MONOTRIBUTO') || html.includes('Monotributo')) {
      situacionAfip = 'Monotributista';
    } else if (html.includes('EXENTO') || html.includes('Exento')) {
      situacionAfip = 'Exento';
    }

    let nombre = '';
    let apellido = '';

    if (esJuridica) {
      nombre = nombreCompleto;
      apellido = '';
    } else {
      // Para personas físicas, separar apellido y nombre
      const partes = nombreCompleto.split(/\s+/);
      if (partes.length >= 2) {
        // Generalmente viene como "APELLIDO NOMBRE"
        apellido = partes[0];
        nombre = partes.slice(1).join(' ');
      } else {
        nombre = nombreCompleto;
        apellido = '';
      }
    }

    return {
      nombre,
      apellido,
      razonSocial: esJuridica ? nombreCompleto : undefined,
      tipoPersona: esJuridica ? 'juridica' : 'fisica',
      situacionAfip,
    };
  } catch (e) {
    console.error("Error parseando HTML:", e);
    return null;
  }
}

function mapearSituacionFromCategoria(categoria: string): string {
  if (!categoria) return 'Consumidor Final';
  
  const cat = categoria.toUpperCase();
  if (cat.includes('RI') || cat.includes('RESPONSABLE INSCRIPTO')) {
    return 'Responsable Inscripto';
  }
  if (cat.includes('MONO') || cat.includes('RS')) {
    return 'Monotributista';
  }
  if (cat.includes('EX')) {
    return 'Exento';
  }
  return 'Consumidor Final';
}

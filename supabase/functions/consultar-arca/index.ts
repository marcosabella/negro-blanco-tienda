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

    // Usar API de consultas.afip.gob.ar (padrón público)
    let data = null;

    try {
      // Intentar con nosis API (más confiable)
      const response = await fetch(
        `https://www.nosis.com/es/Buscar/buscar?buscar=${cuitLimpio}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (response.ok) {
        const html = await response.text();
        console.log("HTML length:", html.length);
        
        // Buscar nombre en el resultado de nosis
        const nombreMatch = html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                           html.match(/<span[^>]*class="[^"]*nombre[^"]*"[^>]*>([^<]+)<\/span>/i);
        
        if (nombreMatch && nombreMatch[1]) {
          const nombreCompleto = nombreMatch[1].trim();
          if (nombreCompleto && !nombreCompleto.includes('[') && nombreCompleto.length > 2) {
            data = parseNombreCompleto(nombreCompleto, cuitLimpio, html);
          }
        }
      }
    } catch (e) {
      console.log("Error con nosis:", e);
    }

    // Intentar con constancia AFIP directo si no funcionó
    if (!data) {
      try {
        const response = await fetch(
          `https://seti.afip.gob.ar/padron-puc-constancia-internet/ConsultaConstanciaAction.do?cuit=${cuitLimpio}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'text/html',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );

        if (response.ok) {
          const html = await response.text();
          console.log("AFIP HTML length:", html.length);
          data = parseAfipConstancia(html, cuitLimpio);
        }
      } catch (e) {
        console.log("Error con AFIP constancia:", e);
      }
    }

    // Si no funcionó ninguna API, usar lógica basada en el CUIT
    if (!data) {
      const prefijo = cuitLimpio.substring(0, 2);
      const esJuridica = ['30', '33', '34'].includes(prefijo);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No se pudieron obtener datos de ARCA. Por favor ingrese los datos manualmente.",
          hint: esJuridica ? 'juridica' : 'fisica'
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
      JSON.stringify({ success: false, error: "Error interno. Ingrese los datos manualmente." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function parseNombreCompleto(nombreCompleto: string, cuit: string, html: string) {
  const prefijo = cuit.substring(0, 2);
  const esJuridica = ['30', '33', '34'].includes(prefijo);
  
  let situacionAfip = 'Consumidor Final';
  const htmlLower = html.toLowerCase();
  if (htmlLower.includes('responsable inscripto')) {
    situacionAfip = 'Responsable Inscripto';
  } else if (htmlLower.includes('monotributo') || htmlLower.includes('monotributista')) {
    situacionAfip = 'Monotributista';
  } else if (htmlLower.includes('exento')) {
    situacionAfip = 'Exento';
  }

  let nombre = '';
  let apellido = '';

  if (esJuridica) {
    nombre = nombreCompleto;
  } else {
    const partes = nombreCompleto.split(/\s+/);
    if (partes.length >= 2) {
      apellido = partes[0];
      nombre = partes.slice(1).join(' ');
    } else {
      nombre = nombreCompleto;
    }
  }

  return {
    nombre,
    apellido,
    razonSocial: esJuridica ? nombreCompleto : undefined,
    tipoPersona: esJuridica ? 'juridica' as const : 'fisica' as const,
    situacionAfip,
  };
}

function parseAfipConstancia(html: string, cuit: string) {
  // Buscar apellido y nombre en constancia AFIP
  const apellidoMatch = html.match(/Apellido[^:]*:\s*<[^>]*>([^<]+)</i) ||
                       html.match(/<td[^>]*>Apellido[^<]*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  
  const nombreMatch = html.match(/Nombre[^:]*:\s*<[^>]*>([^<]+)</i) ||
                     html.match(/<td[^>]*>Nombre[^<]*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  
  const razonSocialMatch = html.match(/Raz[oó]n\s*Social[^:]*:\s*<[^>]*>([^<]+)</i) ||
                          html.match(/<td[^>]*>Raz[oó]n\s*Social[^<]*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);

  const prefijo = cuit.substring(0, 2);
  const esJuridica = ['30', '33', '34'].includes(prefijo);

  let nombre = '';
  let apellido = '';
  let razonSocial = '';

  if (razonSocialMatch && razonSocialMatch[1]) {
    razonSocial = razonSocialMatch[1].trim();
    nombre = razonSocial;
  }
  
  if (nombreMatch && nombreMatch[1]) {
    nombre = nombreMatch[1].trim();
  }
  
  if (apellidoMatch && apellidoMatch[1]) {
    apellido = apellidoMatch[1].trim();
  }

  // Validar que tengamos datos válidos
  if (!nombre && !apellido && !razonSocial) {
    return null;
  }

  // Evitar datos inválidos
  if (nombre.includes('[') || nombre.includes('{') || nombre.length < 2) {
    return null;
  }

  let situacionAfip = 'Consumidor Final';
  const htmlLower = html.toLowerCase();
  if (htmlLower.includes('iva responsable inscripto') || htmlLower.includes('responsable inscripto')) {
    situacionAfip = 'Responsable Inscripto';
  } else if (htmlLower.includes('monotributo') || htmlLower.includes('régimen simplificado')) {
    situacionAfip = 'Monotributista';
  } else if (htmlLower.includes('iva exento') || htmlLower.includes('exento')) {
    situacionAfip = 'Exento';
  }

  return {
    nombre,
    apellido,
    razonSocial: esJuridica ? razonSocial || nombre : undefined,
    tipoPersona: esJuridica ? 'juridica' as const : 'fisica' as const,
    situacionAfip,
  };
}

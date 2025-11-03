import { useState } from 'react';
import { useAfipConfig, useCreateAfipConfig, useUpdateAfipConfig } from '@/hooks/useAfipConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AMBIENTES_AFIP } from '@/types/afip';
import { FileKey, Save, RefreshCw } from 'lucide-react';

const Afip = () => {
  const { data: config, isLoading } = useAfipConfig();
  const createConfig = useCreateAfipConfig();
  const updateConfig = useUpdateAfipConfig();

  const [puntoVenta, setPuntoVenta] = useState(config?.punto_venta || 1);
  const [cuitEmisor, setCuitEmisor] = useState(config?.cuit_emisor || '');
  const [ambiente, setAmbiente] = useState<'homologacion' | 'produccion'>(config?.ambiente || 'homologacion');
  const [certificadoCrt, setCertificadoCrt] = useState(config?.certificado_crt || '');
  const [certificadoKey, setCertificadoKey] = useState(config?.certificado_key || '');
  const [nombreCertificadoCrt, setNombreCertificadoCrt] = useState(config?.nombre_certificado_crt || '');
  const [nombreCertificadoKey, setNombreCertificadoKey] = useState(config?.nombre_certificado_key || '');
  const [activo, setActivo] = useState(config?.activo ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const configData = {
      punto_venta: puntoVenta,
      cuit_emisor: cuitEmisor,
      ambiente,
      certificado_crt: certificadoCrt,
      certificado_key: certificadoKey,
      nombre_certificado_crt: nombreCertificadoCrt,
      nombre_certificado_key: nombreCertificadoKey,
      activo,
    };

    if (config?.id) {
      updateConfig.mutate({ id: config.id, ...configData });
    } else {
      createConfig.mutate(configData);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <FileKey className="h-8 w-8" />
            Configuración AFIP
          </h1>
          <p className="text-muted-foreground">
            Configure los parámetros de conexión con AFIP para facturación electrónica
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos de Configuración</CardTitle>
            <CardDescription>
              Ingrese los datos necesarios para la integración con AFIP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="puntoVenta">Punto de Venta *</Label>
                  <Input
                    id="puntoVenta"
                    type="number"
                    min="1"
                    value={puntoVenta}
                    onChange={(e) => setPuntoVenta(parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuitEmisor">CUIT Emisor *</Label>
                  <Input
                    id="cuitEmisor"
                    type="text"
                    placeholder="XX-XXXXXXXX-X"
                    value={cuitEmisor}
                    onChange={(e) => setCuitEmisor(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ambiente">Ambiente *</Label>
                  <Select value={ambiente} onValueChange={(value: 'homologacion' | 'produccion') => setAmbiente(value)}>
                    <SelectTrigger id="ambiente">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AMBIENTES_AFIP.map((amb) => (
                        <SelectItem key={amb.value} value={amb.value}>
                          {amb.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex items-center justify-between">
                  <Label htmlFor="activo">Configuración Activa</Label>
                  <Switch
                    id="activo"
                    checked={activo}
                    onCheckedChange={setActivo}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Certificados</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="nombreCertificadoCrt">Nombre Certificado CRT</Label>
                  <Input
                    id="nombreCertificadoCrt"
                    type="text"
                    placeholder="certificado.crt"
                    value={nombreCertificadoCrt}
                    onChange={(e) => setNombreCertificadoCrt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificadoCrt">Contenido Certificado CRT</Label>
                  <Textarea
                    id="certificadoCrt"
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    value={certificadoCrt}
                    onChange={(e) => setCertificadoCrt(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombreCertificadoKey">Nombre Certificado KEY</Label>
                  <Input
                    id="nombreCertificadoKey"
                    type="text"
                    placeholder="private.key"
                    value={nombreCertificadoKey}
                    onChange={(e) => setNombreCertificadoKey(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificadoKey">Contenido Certificado KEY</Label>
                  <Textarea
                    id="certificadoKey"
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    value={certificadoKey}
                    onChange={(e) => setCertificadoKey(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createConfig.isPending || updateConfig.isPending}
                >
                  {createConfig.isPending || updateConfig.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {config?.id ? 'Actualizar' : 'Guardar'} Configuración
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Afip;

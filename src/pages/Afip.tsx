import { useState, useEffect, useRef } from 'react';
import { useAfipConfig, useCreateAfipConfig, useUpdateAfipConfig } from '@/hooks/useAfipConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AMBIENTES_AFIP } from '@/types/afip';
import { FileKey, Save, RefreshCw, Upload, CheckCircle, Folder } from 'lucide-react';

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
  const [crtError, setCrtError] = useState('');
  const [keyError, setKeyError] = useState('');

  const inputCrtRef = useRef<HTMLInputElement>(null);
  const inputKeyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) {
      setPuntoVenta(config.punto_venta);
      setCuitEmisor(config.cuit_emisor);
      setAmbiente(config.ambiente);
      setCertificadoCrt(config.certificado_crt || '');
      setCertificadoKey(config.certificado_key || '');
      setNombreCertificadoCrt(config.nombre_certificado_crt || '');
      setNombreCertificadoKey(config.nombre_certificado_key || '');
      setActivo(config.activo ?? true);
    }
  }, [config]);

  const handleCrtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCrtError('');

    if (!file) return;

    if (!file.name.endsWith('.crt')) {
      setCrtError('El archivo debe tener extensión .crt');
      return;
    }

    if (file.size > 100 * 1024) {
      setCrtError('El archivo no puede exceder 100 KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCertificadoCrt(content);
      setNombreCertificadoCrt(file.name);
    };
    reader.onerror = () => {
      setCrtError('Error al leer el archivo');
    };
    reader.readAsText(file);
  };

  const handleKeyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setKeyError('');

    if (!file) return;

    if (!file.name.endsWith('.key')) {
      setKeyError('El archivo debe tener extensión .key');
      return;
    }

    if (file.size > 100 * 1024) {
      setKeyError('El archivo no puede exceder 100 KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCertificadoKey(content);
      setNombreCertificadoKey(file.name);
    };
    reader.onerror = () => {
      setKeyError('Error al leer el archivo');
    };
    reader.readAsText(file);
  };

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
                  <p className="text-xs text-muted-foreground">Número asignado por AFIP (1-9999)</p>
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
                  <p className="text-xs text-muted-foreground">Formato: XX-XXXXXXXX-X</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ambiente">Ambiente *</Label>
                  <Select value={ambiente} onValueChange={(value: any) => setAmbiente(value)}>
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
                  <p className="text-xs text-muted-foreground">Homologación para pruebas, Producción para facturas reales</p>
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

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Certificados Digitales</h3>

                <Alert className="mb-4">
                  <FileKey className="h-4 w-4" />
                  <AlertDescription>
                    Cargue los archivos de certificado (.crt) y clave privada (.key) obtenidos de AFIP
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6">
                  <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="crtFile" className="text-base font-semibold">Certificado Digital (.crt)</Label>
                        {nombreCertificadoCrt && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {nombreCertificadoCrt}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <input
                      ref={inputCrtRef}
                      id="crtFile"
                      type="file"
                      accept=".crt"
                      onChange={handleCrtFileUpload}
                      className="hidden"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => inputCrtRef.current?.click()}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      Buscar archivo .crt
                    </Button>

                    {crtError && (
                      <p className="text-sm text-destructive">{crtError}</p>
                    )}

                    {certificadoCrt && (
                      <Textarea
                        value={certificadoCrt}
                        onChange={(e) => setCertificadoCrt(e.target.value)}
                        rows={4}
                        className="font-mono text-xs"
                        placeholder="Contenido del certificado..."
                      />
                    )}
                  </div>

                  <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="keyFile" className="text-base font-semibold">Clave Privada (.key)</Label>
                        {nombreCertificadoKey && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {nombreCertificadoKey}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <input
                      ref={inputKeyRef}
                      id="keyFile"
                      type="file"
                      accept=".key"
                      onChange={handleKeyFileUpload}
                      className="hidden"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => inputKeyRef.current?.click()}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      Buscar archivo .key
                    </Button>

                    {keyError && (
                      <p className="text-sm text-destructive">{keyError}</p>
                    )}

                    {certificadoKey && (
                      <Textarea
                        value={certificadoKey}
                        onChange={(e) => setCertificadoKey(e.target.value)}
                        rows={4}
                        className="font-mono text-xs"
                        placeholder="Contenido de la clave..."
                      />
                    )}
                  </div>
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

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAfipConfig } from '@/hooks/useAfipConfig';
import { FileKey, CheckCircle, XCircle, Upload } from 'lucide-react';

const Afip = () => {
  const { config, isLoading, createOrUpdate, isCreatingOrUpdating } = useAfipConfig();
  const [puntoVenta, setPuntoVenta] = useState('');
  const [cuitEmisor, setCuitEmisor] = useState('');
  const [ambiente, setAmbiente] = useState<'produccion' | 'homologacion'>('homologacion');
  const [certificadoCrt, setCertificadoCrt] = useState<string | null>(null);
  const [claveKey, setClaveKey] = useState<string | null>(null);
  const [certificadoFileName, setCertificadoFileName] = useState<string>('');
  const [claveFileName, setClaveFileName] = useState<string>('');

  useEffect(() => {
    if (config) {
      setPuntoVenta(config.punto_venta.toString());
      setCuitEmisor(config.cuit_emisor);
      setAmbiente(config.ambiente);
      setCertificadoCrt(config.certificado_crt);
      setClaveKey(config.clave_key);
      if (config.certificado_crt) setCertificadoFileName('Certificado cargado');
      if (config.clave_key) setClaveFileName('Clave cargada');
    }
  }, [config]);

  const handleCertificadoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCertificadoCrt(content);
        setCertificadoFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleClaveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setClaveKey(content);
        setClaveFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrUpdate({
      punto_venta: parseInt(puntoVenta),
      cuit_emisor: cuitEmisor,
      ambiente,
      certificado_crt: certificadoCrt,
      clave_key: claveKey,
      activo: true,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configuración AFIP</h1>
        <p className="text-muted-foreground">
          Configure los parámetros para facturación electrónica
        </p>
      </div>

      <div className="grid gap-6">
        {config && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileKey className="h-5 w-5" />
                Estado Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Punto de Venta:</span>
                  <Badge variant="outline">{config.punto_venta}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CUIT:</span>
                  <Badge variant="outline">{config.cuit_emisor}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ambiente:</span>
                  <Badge variant={config.ambiente === 'produccion' ? 'default' : 'secondary'}>
                    {config.ambiente === 'produccion' ? 'Producción' : 'Homologación'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Certificado (.crt):</span>
                  {config.certificado_crt ? (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Cargado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      No cargado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Clave (.key):</span>
                  {config.clave_key ? (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Cargada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      No cargada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  <Badge variant={config.activo ? 'default' : 'secondary'}>
                    {config.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Configurar AFIP</CardTitle>
            <CardDescription>
              Complete los datos para la facturación electrónica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <FileKey className="h-4 w-4" />
              <AlertDescription>
                Los certificados digitales deben ser obtenidos desde el sitio de AFIP. Asegúrese de cargar
                los archivos correctos (.crt y .key) correspondientes a su CUIT.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="puntoVenta">Punto de Venta *</Label>
                  <Input
                    id="puntoVenta"
                    type="number"
                    placeholder="Ej: 1"
                    value={puntoVenta}
                    onChange={(e) => setPuntoVenta(e.target.value)}
                    required
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground">
                    Número de punto de venta asignado por AFIP
                  </p>
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
                    maxLength={13}
                  />
                  <p className="text-sm text-muted-foreground">
                    CUIT del comercio emisor de facturas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ambiente">Ambiente *</Label>
                  <Select value={ambiente} onValueChange={(value: 'produccion' | 'homologacion') => setAmbiente(value)}>
                    <SelectTrigger id="ambiente">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacion">Homologación (Testing)</SelectItem>
                      <SelectItem value="produccion">Producción</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Use homologación para pruebas y producción para facturas reales
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificado">Certificado Digital (.crt) *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="certificado"
                      type="file"
                      accept=".crt"
                      onChange={handleCertificadoUpload}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" disabled>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {certificadoFileName && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>{certificadoFileName}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Archivo de certificado obtenido desde AFIP
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clave">Clave Privada (.key) *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="clave"
                      type="file"
                      accept=".key"
                      onChange={handleClaveUpload}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" disabled>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {claveFileName && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>{claveFileName}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Archivo de clave privada correspondiente al certificado
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="submit" disabled={isCreatingOrUpdating}>
                  {isCreatingOrUpdating ? 'Guardando...' : 'Guardar Configuración'}
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

import { useClientes } from "@/hooks/useClientes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ListadoClientes = () => {
  const { data: clientes, isLoading } = useClientes();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Listado de Clientes</h1>
            <p className="text-muted-foreground">
              Reporte completo de todos los clientes registrados
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Listado de Clientes</h1>
          <p className="text-muted-foreground">
            Reporte completo de todos los clientes registrados
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Total de Clientes: {clientes?.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            {!clientes || clientes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay clientes registrados
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>CUIT</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Situación AFIP</TableHead>
                      <TableHead>Tipo Persona</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">
                          {cliente.nombre} {cliente.apellido}
                        </TableCell>
                        <TableCell>{cliente.cuit}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{cliente.calle} {cliente.numero}</div>
                            <div className="text-muted-foreground">
                              {cliente.localidad}, {cliente.provincia} ({cliente.codigo_postal})
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {cliente.telefono && <div>Tel: {cliente.telefono}</div>}
                            {cliente.email && <div>{cliente.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{cliente.situacion_afip}</TableCell>
                        <TableCell>
                          <Badge variant={cliente.tipo_persona === 'fisica' ? 'default' : 'secondary'}>
                            {cliente.tipo_persona === 'fisica' ? 'Física' : 'Jurídica'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListadoClientes;

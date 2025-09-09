import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Trash2, Eye } from "lucide-react";
import { useCuentaCorriente } from "@/hooks/useCuentaCorriente";
import { CuentaCorrienteForm } from "./CuentaCorrienteForm";
import { CONCEPTOS_MOVIMIENTO } from "@/types/cuenta-corriente";
import { format } from "date-fns";

export const CuentaCorrienteList = () => {
  const { 
    movimientos, 
    isLoading, 
    deleteMovimiento, 
    getResumenCuentaCorreinte 
  } = useCuentaCorriente();
  
  const { data: resumen = [], isLoading: isLoadingResumen } = getResumenCuentaCorreinte();
  
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const filteredMovimientos = movimientos.filter(mov =>
    mov.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.cliente?.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.cliente?.cuit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.concepto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredResumen = resumen.filter(res =>
    res.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.cliente_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.cliente_cuit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConceptoLabel = (concepto: string) => {
    return CONCEPTOS_MOVIMIENTO.find(c => c.value === concepto)?.label || concepto;
  };

  const getTipoMovimientoBadgeVariant = (tipo: string) => {
    return tipo === 'debito' ? 'destructive' : 'default';
  };

  const getSaldoBadgeVariant = (saldo: number) => {
    if (saldo > 0) return 'destructive';
    if (saldo < 0) return 'default';
    return 'secondary';
  };

  if (isLoading || isLoadingResumen) {
    return (
      <div className="flex justify-center items-center h-48">
        <p>Cargando cuenta corriente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gestión de Cuenta Corriente</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Movimiento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, CUIT o concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Tabs defaultValue="resumen" className="w-full">
            <TabsList>
              <TabsTrigger value="resumen">Resumen por Cliente</TabsTrigger>
              <TabsTrigger value="movimientos">Todos los Movimientos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resumen">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CUIT</TableHead>
                      <TableHead>Total Débitos</TableHead>
                      <TableHead>Total Créditos</TableHead>
                      <TableHead>Saldo Actual</TableHead>
                      <TableHead>Último Movimiento</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResumen.map((res) => (
                      <TableRow key={res.cliente_id}>
                        <TableCell className="font-medium">
                          {res.cliente_nombre} {res.cliente_apellido}
                        </TableCell>
                        <TableCell>{res.cliente_cuit}</TableCell>
                        <TableCell className="text-red-600">
                          ${res.total_debitos.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          ${res.total_creditos.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSaldoBadgeVariant(res.saldo_actual)}>
                            ${Math.abs(res.saldo_actual).toFixed(2)} {res.saldo_actual > 0 ? '(Debe)' : res.saldo_actual < 0 ? '(Favor)' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {res.ultimo_movimiento && format(new Date(res.ultimo_movimiento), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedClientId(res.cliente_id);
                              // You can add a detailed view here
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="movimientos">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovimientos.map((movimiento) => (
                      <TableRow key={movimiento.id}>
                        <TableCell>
                          {format(new Date(movimiento.fecha_movimiento), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {movimiento.cliente?.nombre} {movimiento.cliente?.apellido}
                          <div className="text-sm text-muted-foreground">
                            CUIT: {movimiento.cliente?.cuit}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTipoMovimientoBadgeVariant(movimiento.tipo_movimiento)}>
                            {movimiento.tipo_movimiento === 'debito' ? 'Débito' : 'Crédito'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getConceptoLabel(movimiento.concepto)}</TableCell>
                        <TableCell className={`font-semibold ${
                          movimiento.tipo_movimiento === 'debito' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ${movimiento.monto.toFixed(2)}
                        </TableCell>
                        <TableCell>{movimiento.observaciones}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMovimiento(movimiento.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          {filteredMovimientos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron movimientos</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento</DialogTitle>
          </DialogHeader>
          <CuentaCorrienteForm onSuccess={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
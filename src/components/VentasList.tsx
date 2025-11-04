import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, Printer } from "lucide-react";
import { useVentas } from "@/hooks/useVentas";
import { useComercio } from "@/hooks/useComercio";
import { useClientes } from "@/hooks/useClientes";
import VentaForm from "./VentaForm"
import { InvoicePrint } from "./InvoicePrint";
import { Venta, TIPOS_PAGO, TIPOS_COMPROBANTE } from "@/types/venta";
import { format } from "date-fns";

export const VentasList = () => {
  const { ventas, isLoading, deleteVenta } = useVentas();
  const { comercio } = useComercio();
  const { data: clientes } = useClientes();
  const [showForm, setShowForm] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVentas = ventas.filter(venta =>
    venta.numero_comprobante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTipoComprobanteBadgeVariant = (tipo: string) => {
    if (tipo.includes('factura')) return 'default';
    if (tipo.includes('nota')) return 'secondary';
    if (tipo.includes('recibo')) return 'outline';
    return 'default';
  };

  const getTipoPagoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'contado': return 'default';
      case 'tarjeta': return 'secondary';
      case 'transferencia': return 'outline';
      default: return 'destructive';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <p>Cargando ventas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Ventas</CardTitle>
            <Button onClick={() => {
              setEditingVenta(null);
              setShowForm(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Venta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de comprobante o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>N° Comprobante</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo Pago</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVentas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell>
                      {format(new Date(venta.fecha_venta), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {venta.numero_comprobante}
                    </TableCell>
                    <TableCell>{venta.cliente_nombre}</TableCell>
                    <TableCell>
                      <Badge variant={getTipoPagoBadgeVariant(venta.tipo_pago)}>
                        {TIPOS_PAGO.find(t => t.value === venta.tipo_pago)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTipoComprobanteBadgeVariant(venta.tipo_comprobante)}>
                        {TIPOS_COMPROBANTE.find(t => t.value === venta.tipo_comprobante)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${venta.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVenta(venta);
                            setShowPrint(true);
                          }}
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVenta(venta);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingVenta(venta);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteVenta(venta.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredVentas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron ventas</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingVenta(null);
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVenta ? "Editar Venta" : "Nueva Venta"}</DialogTitle>
          </DialogHeader>
          <VentaForm 
            venta={editingVenta} 
            onSuccess={() => {
              setShowForm(false);
              setEditingVenta(null);
            }} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showPrint} onOpenChange={setShowPrint}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Imprimir Factura</DialogTitle>
          </DialogHeader>
          {selectedVenta && clientes && (
            <InvoicePrint 
              venta={selectedVenta} 
              comercio={comercio || null}
              cliente={clientes.find(c => c.id === selectedVenta.cliente_id) || null}
            />
          )}
          {selectedVenta && !clientes && (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Cargando datos...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
          </DialogHeader>
          {selectedVenta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>N° Comprobante:</strong> {selectedVenta.numero_comprobante}</p>
                  <p><strong>Fecha:</strong> {format(new Date(selectedVenta.fecha_venta), "dd/MM/yyyy HH:mm")}</p>
                  <p><strong>Cliente:</strong> {selectedVenta.cliente_nombre}</p>
                </div>
                <div>
                  <p><strong>Tipo Pago:</strong> {TIPOS_PAGO.find(t => t.value === selectedVenta.tipo_pago)?.label}</p>
                  <p><strong>Comprobante:</strong> {TIPOS_COMPROBANTE.find(t => t.value === selectedVenta.tipo_comprobante)?.label}</p>
                </div>
              </div>

              {selectedVenta.venta_items && selectedVenta.venta_items.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>P.U.</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>IVA</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedVenta.venta_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.producto?.cod_producto}</TableCell>
                          <TableCell>{item.producto?.descripcion}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>${item.precio_unitario.toFixed(2)}</TableCell>
                          <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                          <TableCell>${item.monto_iva.toFixed(2)}</TableCell>
                          <TableCell>${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p><strong>Subtotal:</strong> ${selectedVenta.subtotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p><strong>IVA:</strong> ${selectedVenta.total_iva.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-lg"><strong>Total:</strong> ${selectedVenta.total.toFixed(2)}</p>
                    {selectedVenta.tipo_pago === 'tarjeta' && selectedVenta.tarjeta && (
                      <>
                        <p><strong>Tarjeta:</strong> {selectedVenta.tarjeta.nombre}</p>
                        <p><strong>Cuotas:</strong> {selectedVenta.cuotas}</p>
                        {selectedVenta.recargo_cuotas && selectedVenta.recargo_cuotas > 0 && (
                          <p><strong>Recargo:</strong> ${selectedVenta.recargo_cuotas.toFixed(2)}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedVenta.observaciones && (
                <div>
                  <p><strong>Observaciones:</strong> {selectedVenta.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
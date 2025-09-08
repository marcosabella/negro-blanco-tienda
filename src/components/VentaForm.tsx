import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Trash2 } from "lucide-react";
import { useVentas } from "@/hooks/useVentas";
import { useClientes } from "@/hooks/useClientes";
import { useProductos } from "@/hooks/useProductos";
import { TIPOS_PAGO, TIPOS_COMPROBANTE, Venta, VentaItem } from "@/types/venta";
import { Cliente } from "@/types/cliente";
import { format } from "date-fns";

const ventaSchema = z.object({
  fecha_venta: z.string(),
  tipo_pago: z.enum(['contado', 'transferencia', 'tarjeta', 'cheque', 'cta_cte']),
  tipo_comprobante: z.enum([
    'factura_a', 'factura_b', 'factura_c', 'nota_credito_a', 'nota_credito_b',
    'nota_credito_c', 'nota_debito_a', 'nota_debito_b', 'nota_debito_c',
    'recibo_a', 'recibo_b', 'recibo_c', 'ticket_fiscal', 'factura_exportacion'
  ]),
  cliente_id: z.string().optional(),
  cliente_nombre: z.string().min(1, "Cliente es requerido"),
  observaciones: z.string().optional(),
});

interface VentaFormProps {
  venta?: Venta;
  onSuccess: () => void;
}

export const VentaForm = ({ venta, onSuccess }: VentaFormProps) => {
  const { createVenta, isCreating } = useVentas();
  const clientesQuery = useClientes();
  const { productos } = useProductos();
  
  const clientes = clientesQuery.data || [];
  
  const [items, setItems] = useState<(Omit<VentaItem, "id" | "venta_id" | "created_at" | "updated_at"> & { tempId: string })[]>([]);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; nombre: string; apellido: string } | null>(null);

  const form = useForm<z.infer<typeof ventaSchema>>({
    resolver: zodResolver(ventaSchema),
    defaultValues: {
      fecha_venta: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      tipo_pago: "contado",
      tipo_comprobante: "ticket_fiscal",
      cliente_nombre: "Consumidor Final",
      observaciones: "",
    },
  });

  const addProductToCart = (producto: any, cantidad: number) => {
    const precioUnitario = producto.precio_venta || 0;
    const porcentajeIva = producto.porcentaje_iva || 0;
    const subtotal = precioUnitario * cantidad;
    const montoIva = subtotal * (porcentajeIva / 100);
    const total = subtotal + montoIva;

    const newItem = {
      tempId: crypto.randomUUID(),
      producto_id: producto.id,
      cantidad,
      precio_unitario: precioUnitario,
      porcentaje_iva: porcentajeIva,
      monto_iva: montoIva,
      subtotal,
      total,
      producto: {
        cod_producto: producto.cod_producto,
        descripcion: producto.descripcion,
        precio_venta: producto.precio_venta,
        porcentaje_iva: producto.porcentaje_iva,
      },
    };

    setItems(prev => [...prev, newItem]);
    setProductSearchOpen(false);
  };

  const removeItem = (tempId: string) => {
    setItems(prev => prev.filter(item => item.tempId !== tempId));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalIva = items.reduce((sum, item) => sum + item.monto_iva, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, totalIva, total };
  };

  const onSubmit = (values: z.infer<typeof ventaSchema>) => {
    const { subtotal, totalIva, total } = calculateTotals();
    const numeroComprobante = `${values.tipo_comprobante.toUpperCase()}-${Date.now()}`;
    
    const ventaData = {
      numero_comprobante: numeroComprobante,
      fecha_venta: new Date(values.fecha_venta).toISOString(),
      tipo_pago: values.tipo_pago,
      tipo_comprobante: values.tipo_comprobante,
      cliente_id: selectedClient?.id,
      cliente_nombre: values.cliente_nombre,
      subtotal,
      total_iva: totalIva,
      total,
      observaciones: values.observaciones,
    };

    const itemsData = items.map(item => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      porcentaje_iva: item.porcentaje_iva,
      monto_iva: item.monto_iva,
      subtotal: item.subtotal,
      total: item.total,
    }));

    createVenta({ venta: ventaData, items: itemsData });
    onSuccess();
  };

  const { subtotal, totalIva, total } = calculateTotals();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Venta</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fecha_venta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Venta</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_pago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo de pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_PAGO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_comprobante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comprobante</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar comprobante" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_COMPROBANTE.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cliente_nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <Dialog open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Seleccionar Cliente</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                setSelectedClient(null);
                                form.setValue("cliente_nombre", "Consumidor Final");
                                form.setValue("cliente_id", undefined);
                                setClientSearchOpen(false);
                              }}
                            >
                              Consumidor Final
                            </Button>
                            {clientes.map((cliente) => (
                              <Button
                                key={cliente.id}
                                type="button"
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                  if (cliente.id) {
                                    setSelectedClient({
                                      id: cliente.id,
                                      nombre: cliente.nombre,
                                      apellido: cliente.apellido
                                    });
                                    form.setValue("cliente_nombre", `${cliente.nombre} ${cliente.apellido}`);
                                    form.setValue("cliente_id", cliente.id);
                                    setClientSearchOpen(false);
                                  }
                                }}
                              >
                                {cliente.nombre} {cliente.apellido} - {cliente.cuit}
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Items de Venta</h3>
                <Dialog open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Agregar Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Seleccionar Producto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {productos.map((producto) => (
                        <ProductSearchItem
                          key={producto.id}
                          producto={producto}
                          onAdd={addProductToCart}
                        />
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border rounded-lg">
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
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.tempId}>
                        <TableCell>{item.producto?.cod_producto}</TableCell>
                        <TableCell>{item.producto?.descripcion}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>${item.precio_unitario.toFixed(2)}</TableCell>
                        <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                        <TableCell>${item.monto_iva.toFixed(2)}</TableCell>
                        <TableCell>${item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.tempId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Subtotal: </span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="font-semibold">IVA: </span>
                    <span>${totalIva.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Total: </span>
                    <span className="text-lg">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isCreating || items.length === 0}>
              {isCreating ? "Guardando..." : "Guardar Venta"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

interface ProductSearchItemProps {
  producto: any;
  onAdd: (producto: any, cantidad: number) => void;
}

const ProductSearchItem = ({ producto, onAdd }: ProductSearchItemProps) => {
  const [cantidad, setCantidad] = useState(1);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <h4 className="font-semibold">{producto.descripcion}</h4>
        <p className="text-sm text-muted-foreground">
          Código: {producto.cod_producto} | Precio: ${producto.precio_venta?.toFixed(2)} | Stock: {producto.stock}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="1"
          max={producto.stock}
          value={cantidad}
          onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
          className="w-20"
        />
        <Button
          type="button"
          onClick={() => onAdd(producto, cantidad)}
          disabled={producto.stock < cantidad}
        >
          Agregar
        </Button>
      </div>
    </div>
  );
};
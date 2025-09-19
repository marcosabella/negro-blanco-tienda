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
import { useTarjetas } from "@/hooks/useTarjetas";
import { useTarjetaCuotas } from "@/hooks/useTarjetaCuotas";
import { TIPOS_PAGO, TIPOS_COMPROBANTE, Venta, VentaItem } from "@/types/venta";
import { Cliente } from "@/types/cliente";
import { useBancos } from "@/hooks/useBancos";
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
  banco_id: z.string().optional(),
  tarjeta_id: z.string().optional(),
  cuotas: z.number().optional(),
  observaciones: z.string().optional(),
}).refine((data) => {
  if (data.tipo_pago === 'transferencia' && !data.banco_id) {
    return false;
  }
  if (data.tipo_pago === 'tarjeta' && !data.tarjeta_id) {
    return false;
  }
  return true;
}, {
  message: "Banco es requerido para transferencias",
  path: ["banco_id"],
}).refine((data) => {
  if (data.tipo_pago === 'tarjeta' && !data.tarjeta_id) {
    return false;
  }
  return true;
}, {
  message: "Tarjeta es requerida para pagos con tarjeta",
  path: ["tarjeta_id"],
});

interface VentaFormProps {
  venta?: Venta;
  onSuccess: () => void;
}

export const VentaForm = ({ venta, onSuccess }: VentaFormProps) => {
  const { createVenta, updateVenta, isCreating, isUpdating } = useVentas();
  const clientesQuery = useClientes();
  const { productos } = useProductos();
  const { bancosActivos } = useBancos();
  const { tarjetasActivas } = useTarjetas();
  const { useCuotasByTarjeta } = useTarjetaCuotas();
  
  const clientes = clientesQuery.data || [];

  const [items, setItems] = useState<(Omit<VentaItem, "id" | "venta_id" | "created_at" | "updated_at"> & { tempId: string })[]>(
    venta?.venta_items?.map(item => ({
      tempId: crypto.randomUUID(),
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      porcentaje_iva: item.porcentaje_iva,
      monto_iva: item.monto_iva,
      subtotal: item.subtotal,
      total: item.total,
      producto: item.producto,
    })) || []
  );
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<{ id: string; nombre: string; apellido: string } | null>(
    venta?.cliente_id ? {
      id: venta.cliente_id,
      nombre: venta.cliente?.nombre || "",
      apellido: venta.cliente?.apellido || ""
    } : null
  );
  const [selectedTarjetaId, setSelectedTarjetaId] = useState<string | null>(
    venta?.tarjeta_id || null
  );

  // Get installments for selected credit card
  const { data: cuotasDisponibles = [] } = useCuotasByTarjeta(selectedTarjetaId);
  // Filter clients based on search term
  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    cliente.apellido.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    cliente.cuit.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const form = useForm<z.infer<typeof ventaSchema>>({
    resolver: zodResolver(ventaSchema),
    defaultValues: venta ? {
      fecha_venta: format(new Date(venta.fecha_venta), "yyyy-MM-dd'T'HH:mm"),
      tipo_pago: venta.tipo_pago,
      tipo_comprobante: venta.tipo_comprobante,
      cliente_id: venta.cliente_id,
      cliente_nombre: venta.cliente_nombre || "Consumidor Final",
      banco_id: venta.banco_id,
      tarjeta_id: venta.tarjeta_id,
      cuotas: venta.cuotas || 1,
      observaciones: venta.observaciones || "",
    } : {
      fecha_venta: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      tipo_pago: "contado",
      tipo_comprobante: "ticket_fiscal",
      cliente_nombre: "Consumidor Final",
      banco_id: "",
      tarjeta_id: "",
      cuotas: 1,
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
    
    // Calculate credit card surcharge if applicable
    let recargoTarjeta = 0;
    if (values.tipo_pago === 'tarjeta' && values.tarjeta_id && values.cuotas) {
      const cuotaConfig = cuotasDisponibles.find(c => c.cantidad_cuotas === values.cuotas);
      if (cuotaConfig) {
        recargoTarjeta = total * (cuotaConfig.porcentaje_recargo / 100);
      }
    }
    
    const totalConRecargo = total + recargoTarjeta;
    
    const ventaData = {
      numero_comprobante: venta?.numero_comprobante || `${values.tipo_comprobante.toUpperCase()}-${Date.now()}`,
      fecha_venta: new Date(values.fecha_venta).toISOString(),
      tipo_pago: values.tipo_pago,
      tipo_comprobante: values.tipo_comprobante,
      cliente_id: selectedClient?.id,
      cliente_nombre: values.cliente_nombre,
      banco_id: values.tipo_pago === 'transferencia' ? values.banco_id : undefined,
      tarjeta_id: values.tipo_pago === 'tarjeta' ? values.tarjeta_id : undefined,
      cuotas: values.tipo_pago === 'tarjeta' ? values.cuotas : undefined,
      recargo_cuotas: recargoTarjeta,
      subtotal,
      total_iva: totalIva,
      total: totalConRecargo,
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

    if (venta?.id) {
      updateVenta({ ventaId: venta.id, venta: ventaData, items: itemsData });
    } else {
      createVenta({ venta: ventaData, items: itemsData });
    }
    onSuccess();
  };

  const { subtotal, totalIva, total } = calculateTotals();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{venta ? "Editar Venta" : "Nueva Venta"}</CardTitle>
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
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar por nombre, apellido o CUIT..."
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                className="pl-8"
                              />
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                  setSelectedClient(null);
                                  form.setValue("cliente_nombre", "Consumidor Final");
                                  form.setValue("cliente_id", undefined);
                                  setClientSearchOpen(false);
                                  setClientSearchTerm("");
                                }}
                              >
                                Consumidor Final
                              </Button>
                              {filteredClientes.map((cliente) => (
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
                                      setClientSearchTerm("");
                                    }
                                  }}
                                >
                                  <div className="text-left">
                                    <div className="font-medium">{cliente.nombre} {cliente.apellido}</div>
                                    <div className="text-sm text-muted-foreground">CUIT: {cliente.cuit}</div>
                                  </div>
                                </Button>
                              ))}
                              {filteredClientes.length === 0 && clientSearchTerm && (
                                <p className="text-center text-muted-foreground py-4">
                                  No se encontraron clientes que coincidan con la búsqueda
                                </p>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("tipo_pago") === "transferencia" && (
                <FormField
                  control={form.control}
                  name="banco_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco de Destino</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar banco" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bancosActivos.map((banco) => (
                            <SelectItem key={banco.id} value={banco.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{banco.nombre_banco}</span>
                                <span className="text-sm text-muted-foreground">
                                  {banco.sucursal} - Cta: {banco.numero_cuenta}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {form.watch("tipo_pago") === "tarjeta" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tarjeta_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarjeta de Crédito</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedTarjetaId(value);
                          form.setValue("cuotas", 1);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tarjeta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tarjetasActivas.map((tarjeta) => (
                            <SelectItem key={tarjeta.id} value={tarjeta.id}>
                              {tarjeta.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedTarjetaId && cuotasDisponibles.length > 0 && (
                  <FormField
                    control={form.control}
                    name="cuotas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad de Cuotas</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar cuotas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cuotasDisponibles.map((cuota) => (
                              <SelectItem key={cuota.id} value={cuota.cantidad_cuotas.toString()}>
                                <div className="flex flex-col">
                                  <span>
                                    {cuota.cantidad_cuotas} {cuota.cantidad_cuotas === 1 ? 'cuota' : 'cuotas'}
                                  </span>
                                  {cuota.porcentaje_recargo > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                      +{cuota.porcentaje_recargo}% recargo
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

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
                    <span className="text-lg">
                      ${(() => {
                        let finalTotal = total;
                        if (form.watch("tipo_pago") === 'tarjeta' && selectedTarjetaId && form.watch("cuotas")) {
                          const cuotaConfig = cuotasDisponibles.find(c => c.cantidad_cuotas === form.watch("cuotas"));
                          if (cuotaConfig) {
                            const recargo = total * (cuotaConfig.porcentaje_recargo / 100);
                            finalTotal = total + recargo;
                          }
                        }
                        return finalTotal.toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
                {form.watch("tipo_pago") === 'tarjeta' && selectedTarjetaId && form.watch("cuotas") && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      {(() => {
                        const cuotaConfig = cuotasDisponibles.find(c => c.cantidad_cuotas === form.watch("cuotas"));
                        if (cuotaConfig && cuotaConfig.porcentaje_recargo > 0) {
                          const recargo = total * (cuotaConfig.porcentaje_recargo / 100);
                          return `Recargo por cuotas: $${recargo.toFixed(2)} (${cuotaConfig.porcentaje_recargo}%)`;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
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

            <Button type="submit" disabled={isCreating || isUpdating || items.length === 0}>
              {isCreating || isUpdating ? "Guardando..." : venta ? "Actualizar Venta" : "Guardar Venta"}
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
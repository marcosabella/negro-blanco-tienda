import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/integrations/supabase/client"
import { useVentas } from "@/hooks/useVentas"
import { useClientes } from "@/hooks/useClientes"
import { useProductos } from "@/hooks/useProductos"
import { Venta, VentaItem, PagoVenta, TIPOS_COMPROBANTE } from "@/types/venta"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Plus, Search } from "lucide-react"
import { PagosVentaManager } from "@/components/PagosVentaManager"

const ventaSchema = z.object({
  numero_comprobante: z.string().min(1, "Número de comprobante requerido"),
  fecha_venta: z.string().min(1, "Fecha requerida"),
  tipo_comprobante: z.enum([
    "factura_a", "factura_b", "factura_c", "nota_credito_a", "nota_credito_b", 
    "nota_credito_c", "nota_debito_a", "nota_debito_b", "nota_debito_c", 
    "recibo_a", "recibo_b", "recibo_c", "ticket_fiscal", "factura_exportacion"
  ]),
  cliente_id: z.string().optional(),
  cliente_nombre: z.string().min(1, "Nombre del cliente requerido"),
  subtotal: z.number().min(0, "Subtotal debe ser mayor a 0"),
  total_iva: z.number().min(0, "IVA debe ser mayor o igual a 0"),
  total: z.number().min(0, "Total debe ser mayor a 0"),
  observaciones: z.string().optional(),
});

type VentaFormData = z.infer<typeof ventaSchema>;

type VentaFormProps = {
  venta?: Venta | null
  onSuccess: () => void
}

const VentaForm: React.FC<VentaFormProps> = ({ venta, onSuccess }) => {
  const { toast } = useToast()
  const { createVenta, updateVenta } = useVentas()
  const { data: clientes = [] } = useClientes()
  const { productos } = useProductos()
  
  // Estado para items de venta
  const [ventaItems, setVentaItems] = useState<Omit<VentaItem, "id" | "venta_id" | "created_at" | "updated_at">[]>([])
  const [selectedProductoId, setSelectedProductoId] = useState<string>("")
  const [selectedProducto, setSelectedProducto] = useState<{ id: string; cod_producto: string; descripcion: string; precio_venta: number } | null>(null)
  const [cantidad, setCantidad] = useState<number>(1)
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState("")
  
  // Estado para búsqueda de clientes
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false)
  const [clienteSearchTerm, setClienteSearchTerm] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<{ id: string; nombre: string; apellido: string; cuit: string } | null>(null)
  
  // Estado para pagos
  const [pagosVenta, setPagosVenta] = useState<Omit<PagoVenta, "id" | "venta_id" | "created_at" | "updated_at">[]>([])

  const form = useForm<VentaFormData>({
    resolver: zodResolver(ventaSchema),
    defaultValues: {
      numero_comprobante: "",
      fecha_venta: new Date().toISOString().split('T')[0],
      tipo_comprobante: "ticket_fiscal",
      cliente_nombre: "Consumidor Final",
      subtotal: 0,
      total_iva: 0,
      total: 0,
      observaciones: "",
    },
  })

  const watchTipoComprobante = form.watch("tipo_comprobante")

  // Generar número de comprobante automático cuando cambia el tipo
  useEffect(() => {
    const generarNumeroComprobante = async () => {
      if (venta) return;
      
      const tipoComprobante = watchTipoComprobante;
      if (!tipoComprobante) return;

      try {
        const puntoVenta = "0001";
        
        const { data, error } = await supabase
          .from("ventas")
          .select("numero_comprobante")
          .eq("tipo_comprobante", tipoComprobante)
          .like("numero_comprobante", `${puntoVenta}-%`)
          .order("numero_comprobante", { ascending: false })
          .limit(1);

        if (error) throw error;

        let nuevoNumero = "00000001";
        if (data && data.length > 0) {
          const partes = data[0].numero_comprobante.split("-");
          if (partes.length === 2) {
            const ultimoNumero = parseInt(partes[1]) || 0;
            nuevoNumero = String(ultimoNumero + 1).padStart(8, "0");
          }
        }

        form.setValue("numero_comprobante", `${puntoVenta}-${nuevoNumero}`);
      } catch (error) {
        console.error("Error generando número de comprobante:", error);
      }
    };

    generarNumeroComprobante();
  }, [watchTipoComprobante, venta, form]);

  useEffect(() => {
    if (venta) {
      form.reset({
        numero_comprobante: venta.numero_comprobante,
        fecha_venta: new Date(venta.fecha_venta).toISOString().split('T')[0],
        tipo_comprobante: venta.tipo_comprobante,
        cliente_id: venta.cliente_id || undefined,
        cliente_nombre: venta.cliente_nombre,
        subtotal: Number(venta.subtotal),
        total_iva: Number(venta.total_iva),
        total: Number(venta.total),
        observaciones: venta.observaciones || "",
      })
      
      if (venta.venta_items) {
        setVentaItems(venta.venta_items.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          porcentaje_iva: item.porcentaje_iva,
          monto_iva: item.monto_iva,
          subtotal: item.subtotal,
          total: item.total,
        })))
      }
      
      if (venta.pagos_venta) {
        setPagosVenta(venta.pagos_venta.map(pago => ({
          tipo_pago: pago.tipo_pago,
          monto: pago.monto,
          banco_id: pago.banco_id,
          tarjeta_id: pago.tarjeta_id,
          cuotas: pago.cuotas,
          recargo_cuotas: pago.recargo_cuotas,
          cheque_id: pago.cheque_id,
        })))
      }
    }
  }, [venta, form])

  // Calcular totales cuando cambian los items
  useEffect(() => {
    const subtotal = ventaItems.reduce((sum, item) => sum + item.subtotal, 0)
    const totalIva = ventaItems.reduce((sum, item) => sum + item.monto_iva, 0)
    const total = subtotal + totalIva
    
    form.setValue("subtotal", subtotal)
    form.setValue("total_iva", totalIva)
    form.setValue("total", total)
  }, [ventaItems, form])

  // Filtrar productos por término de búsqueda
  const filteredProductos = productos.filter(producto =>
    producto.descripcion.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    producto.cod_producto.toLowerCase().includes(productSearchTerm.toLowerCase())
  )
  
  // Filtrar clientes por término de búsqueda
  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
    cliente.apellido.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
    cliente.cuit.includes(clienteSearchTerm)
  )

  // Función para agregar producto
  const agregarProducto = () => {
    if (!selectedProductoId || cantidad <= 0) {
      toast({
        title: "Error",
        description: "Seleccione un producto y cantidad válida",
        variant: "destructive",
      })
      return
    }

    const producto = productos.find(p => p.id === selectedProductoId)
    if (!producto) return

    const precioUnitario = Number(producto.precio_venta)
    const porcentajeIva = Number(producto.porcentaje_iva)
    const subtotal = precioUnitario * cantidad
    const montoIva = (subtotal * porcentajeIva) / 100
    const total = subtotal + montoIva

    const nuevoItem: Omit<VentaItem, "id" | "venta_id" | "created_at" | "updated_at"> = {
      producto_id: selectedProductoId,
      cantidad,
      precio_unitario: precioUnitario,
      porcentaje_iva: porcentajeIva,
      monto_iva: montoIva,
      subtotal,
      total,
    }

    setVentaItems([...ventaItems, nuevoItem])
    setSelectedProductoId("")
    setSelectedProducto(null)
    setCantidad(1)
  }

  // Función para eliminar producto
  const eliminarProducto = (index: number) => {
    const nuevosItems = ventaItems.filter((_, i) => i !== index)
    setVentaItems(nuevosItems)
  }

  const onSubmit = async (data: VentaFormData) => {
    if (ventaItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto a la venta",
        variant: "destructive",
      })
      return
    }

    if (pagosVenta.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un método de pago",
        variant: "destructive",
      })
      return
    }

    const totalPagos = pagosVenta.reduce((sum, p) => sum + p.monto, 0)
    if (Math.abs(totalPagos - data.total) > 0.01) {
      toast({
        title: "Error",
        description: `El total de pagos ($${totalPagos.toFixed(2)}) debe coincidir con el total de la venta ($${data.total.toFixed(2)})`,
        variant: "destructive",
      })
      return
    }

    try {
      const ventaData: Omit<Venta, "id" | "created_at" | "updated_at"> = {
        numero_comprobante: data.numero_comprobante,
        fecha_venta: new Date(data.fecha_venta).toISOString(),
        tipo_pago: pagosVenta[0].tipo_pago, // Por compatibilidad, usar el primer método de pago
        tipo_comprobante: data.tipo_comprobante,
        cliente_nombre: data.cliente_nombre,
        subtotal: data.subtotal,
        total_iva: data.total_iva,
        total: data.total,
        cliente_id: data.cliente_id || undefined,
        observaciones: data.observaciones,
      }

      if (venta?.id) {
        // Eliminar pagos anteriores
        await supabase
          .from("pagos_venta")
          .delete()
          .eq("venta_id", venta.id)

        await updateVenta({
          ventaId: venta.id,
          venta: ventaData,
          items: ventaItems,
          pagos: pagosVenta
        })
      } else {
        await createVenta({
          venta: ventaData,
          items: ventaItems,
          pagos: pagosVenta
        })
      }
      
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la venta.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{venta ? "Editar Venta" : "Nueva Venta"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Datos principales */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero_comprobante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Comprobante</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fecha_venta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_comprobante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comprobante</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
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

              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          value={selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellido} - ${selectedCliente.cuit}` : "Consumidor Final"}
                          readOnly
                          placeholder="Seleccionar cliente..."
                        />
                      </FormControl>
                      <Dialog open={clienteSearchOpen} onOpenChange={setClienteSearchOpen}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setClienteSearchOpen(true)}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Buscar
                        </Button>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Seleccionar Cliente</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar por nombre, apellido o CUIT..."
                                value={clienteSearchTerm}
                                onChange={(e) => setClienteSearchTerm(e.target.value)}
                                className="pl-8"
                              />
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start text-left h-auto py-3"
                                onClick={() => {
                                  field.onChange(undefined);
                                  form.setValue("cliente_nombre", "Consumidor Final");
                                  setSelectedCliente(null);
                                  setClienteSearchOpen(false);
                                  setClienteSearchTerm("");
                                }}
                              >
                                <div className="font-medium">Consumidor Final</div>
                              </Button>
                              {filteredClientes.map((cliente) => (
                                <Button
                                  key={cliente.id}
                                  type="button"
                                  variant="outline"
                                  className="w-full justify-start text-left h-auto py-3"
                                  onClick={() => {
                                    field.onChange(cliente.id);
                                    form.setValue("cliente_nombre", `${cliente.nombre} ${cliente.apellido}`);
                                    setSelectedCliente({
                                      id: cliente.id!,
                                      nombre: cliente.nombre,
                                      apellido: cliente.apellido,
                                      cuit: cliente.cuit
                                    });
                                    setClienteSearchOpen(false);
                                    setClienteSearchTerm("");
                                  }}
                                >
                                  <div className="flex flex-col gap-1">
                                    <div className="font-medium">{cliente.nombre} {cliente.apellido}</div>
                                    <div className="text-sm text-muted-foreground">
                                      CUIT: {cliente.cuit} | {cliente.localidad}, {cliente.provincia}
                                    </div>
                                  </div>
                                </Button>
                              ))}
                              {filteredClientes.length === 0 && clienteSearchTerm && (
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
            </div>

            {/* Selección de Productos */}
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-lg">Productos de la Venta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-7">
                    <label className="text-sm font-medium">Producto</label>
                    <div className="flex gap-2">
                      <Input
                        value={selectedProducto ? `${selectedProducto.cod_producto} - ${selectedProducto.descripcion}` : ""}
                        readOnly
                        placeholder="Seleccionar producto..."
                      />
                      <Dialog open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setProductSearchOpen(true)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Seleccionar Producto</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar por código o descripción..."
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                className="pl-8"
                              />
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {filteredProductos.map((producto) => (
                                <Button
                                  key={producto.id}
                                  type="button"
                                  variant="outline"
                                  className="w-full justify-start text-left h-auto py-3"
                                  onClick={() => {
                                    setSelectedProductoId(producto.id);
                                    setSelectedProducto({
                                      id: producto.id,
                                      cod_producto: producto.cod_producto,
                                      descripcion: producto.descripcion,
                                      precio_venta: Number(producto.precio_venta)
                                    });
                                    setProductSearchOpen(false);
                                    setProductSearchTerm("");
                                  }}
                                >
                                  <div className="flex flex-col gap-1">
                                    <div className="font-medium">{producto.cod_producto} - {producto.descripcion}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Precio: ${Number(producto.precio_venta).toFixed(2)} | Stock: {producto.stock}
                                    </div>
                                  </div>
                                </Button>
                              ))}
                              {filteredProductos.length === 0 && productSearchTerm && (
                                <p className="text-center text-muted-foreground py-4">
                                  No se encontraron productos que coincidan con la búsqueda
                                </p>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <label className="text-sm font-medium">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2 flex items-end">
                    <Button type="button" onClick={agregarProducto} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>

                {/* Tabla de items */}
                {ventaItems.length > 0 && (
                  <div className="border rounded-lg bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-right">IVA %</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ventaItems.map((item, index) => {
                          const producto = productos.find(p => p.id === item.producto_id)
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {producto ? `${producto.cod_producto} - ${producto.descripcion}` : 'Producto no encontrado'}
                              </TableCell>
                              <TableCell className="text-right">{item.cantidad}</TableCell>
                              <TableCell className="text-right">${item.precio_unitario.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.porcentaje_iva}%</TableCell>
                              <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-semibold">${item.total.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarProducto(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {/* Totales */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Subtotal</label>
                    <Input
                      type="number"
                      value={form.watch("subtotal").toFixed(2)}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">IVA</label>
                    <Input
                      type="number"
                      value={form.watch("total_iva").toFixed(2)}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Total</label>
                    <Input
                      type="number"
                      value={form.watch("total").toFixed(2)}
                      disabled
                      className="bg-muted font-semibold text-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métodos de pago */}
            <PagosVentaManager
              totalVenta={form.watch("total")}
              clienteId={form.watch("cliente_id")}
              pagos={pagosVenta}
              onChange={setPagosVenta}
            />

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones de acción */}
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancelar
              </Button>
              <Button type="submit">
                {venta ? "Actualizar Venta" : "Registrar Venta"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default VentaForm

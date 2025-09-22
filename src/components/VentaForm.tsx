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
import { useVentas } from "@/hooks/useVentas"
import { useClientes } from "@/hooks/useClientes"
import { useTarjetas } from "@/hooks/useTarjetas"
import { useTarjetaCuotas } from "@/hooks/useTarjetaCuotas"
import { useBancos } from "@/hooks/useBancos"
import { Venta, TIPOS_PAGO, TIPOS_COMPROBANTE } from "@/types/venta"
import { useToast } from "@/hooks/use-toast"

const ventaSchema = z.object({
  numero_comprobante: z.string().min(1, "Número de comprobante requerido"),
  fecha_venta: z.string().min(1, "Fecha requerida"),
  tipo_pago: z.enum(["contado", "transferencia", "tarjeta", "cheque", "cta_cte"]),
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
  banco_id: z.string().optional(),
  tarjeta_id: z.string().optional(),
  cuotas: z.number().optional(),
  recargo_cuotas: z.number().optional(),
}).refine((data) => {
  if (data.tipo_pago === "transferencia" && !data.banco_id) {
    return false;
  }
  if (data.tipo_pago === "tarjeta" && !data.tarjeta_id) {
    return false;
  }
  return true;
}, {
  message: "Campos requeridos según el tipo de pago",
  path: ["tipo_pago"]
});

type VentaFormData = z.infer<typeof ventaSchema>;

type VentaFormProps = {
  venta?: Venta | null
  onSuccess: () => void
}

const VentaForm: React.FC<VentaFormProps> = ({ venta, onSuccess }) => {
  const { toast } = useToast()
  const { createVenta, updateVenta } = useVentas()
  const { clientes } = useClientes()
  const { tarjetas } = useTarjetas()
  const { bancos } = useBancos()
  const [selectedTarjetaId, setSelectedTarjetaId] = useState<string>("")
  const { tarjetaCuotas = [] } = useTarjetaCuotas(selectedTarjetaId)

  const form = useForm<VentaFormData>({
    resolver: zodResolver(ventaSchema),
    defaultValues: {
      numero_comprobante: "",
      fecha_venta: new Date().toISOString().split('T')[0],
      tipo_pago: "contado",
      tipo_comprobante: "ticket_fiscal",
      cliente_nombre: "Consumidor Final",
      subtotal: 0,
      total_iva: 0,
      total: 0,
      observaciones: "",
      cuotas: 1,
      recargo_cuotas: 0,
    },
  })

  const watchTipoPago = form.watch("tipo_pago")
  const watchTarjetaId = form.watch("tarjeta_id")
  const watchCuotas = form.watch("cuotas")

  useEffect(() => {
    if (venta) {
      form.reset({
        numero_comprobante: venta.numero_comprobante,
        fecha_venta: new Date(venta.fecha_venta).toISOString().split('T')[0],
        tipo_pago: venta.tipo_pago,
        tipo_comprobante: venta.tipo_comprobante,
        cliente_id: venta.cliente_id || undefined,
        cliente_nombre: venta.cliente_nombre,
        subtotal: Number(venta.subtotal),
        total_iva: Number(venta.total_iva),
        total: Number(venta.total),
        observaciones: venta.observaciones || "",
        banco_id: venta.banco_id || undefined,
        tarjeta_id: venta.tarjeta_id || undefined,
        cuotas: venta.cuotas || 1,
        recargo_cuotas: Number(venta.recargo_cuotas) || 0,
      })
      if (venta.tarjeta_id) {
        setSelectedTarjetaId(venta.tarjeta_id)
      }
    }
  }, [venta, form])

  // Limpiar campos cuando cambia el tipo de pago
  useEffect(() => {
    if (watchTipoPago !== "transferencia") {
      form.setValue("banco_id", undefined)
    }
    if (watchTipoPago !== "tarjeta") {
      form.setValue("tarjeta_id", undefined)
      form.setValue("cuotas", 1)
      form.setValue("recargo_cuotas", 0)
      setSelectedTarjetaId("")
    }
  }, [watchTipoPago, form])

  // Actualizar tarjeta seleccionada
  useEffect(() => {
    if (watchTarjetaId) {
      setSelectedTarjetaId(watchTarjetaId)
    }
  }, [watchTarjetaId])

  // Calcular recargo cuando cambian las cuotas
  useEffect(() => {
    if (watchTarjetaId && watchCuotas && tarjetaCuotas.length > 0) {
      const cuotaConfig = tarjetaCuotas.find(c => c.cantidad_cuotas === watchCuotas)
      if (cuotaConfig) {
        const subtotal = form.getValues("subtotal")
        const recargo = (subtotal * cuotaConfig.porcentaje_recargo) / 100
        form.setValue("recargo_cuotas", recargo)
        
        // Recalcular total
        const totalIva = form.getValues("total_iva")
        const nuevoTotal = subtotal + totalIva + recargo
        form.setValue("total", nuevoTotal)
      }
    } else {
      form.setValue("recargo_cuotas", 0)
    }
  }, [watchTarjetaId, watchCuotas, tarjetaCuotas, form])

  const onSubmit = async (data: VentaFormData) => {
    try {
      const ventaData = {
        ...data,
        fecha_venta: new Date(data.fecha_venta).toISOString(),
        cliente_id: data.cliente_id || null,
        banco_id: data.banco_id || null,
        tarjeta_id: data.tarjeta_id || null,
        cuotas: data.cuotas || 1,
        recargo_cuotas: data.recargo_cuotas || 0,
      }

      if (venta?.id) {
        await updateVenta(venta.id, ventaData)
        toast({
          title: "Venta actualizada",
          description: "La venta se ha actualizado correctamente.",
        })
      } else {
        await createVenta(ventaData)
        toast({
          title: "Venta creada",
          description: "La venta se ha creado correctamente.",
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
                      <Input {...field} />
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
                    <Select onValueChange={(value) => {
                      field.onChange(value)
                      const cliente = clientes.find(c => c.id === value)
                      if (cliente) {
                        form.setValue("cliente_nombre", `${cliente.nombre} ${cliente.apellido}`)
                      }
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Consumidor Final</SelectItem>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id!}>
                            {cliente.nombre} {cliente.apellido} - {cliente.cuit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cliente_nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Cliente</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Métodos de pago */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-4">Método de Pago</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_pago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Pago</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
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
                  name="subtotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtotal</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total_iva"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IVA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Selector de banco para transferencias */}
              {watchTipoPago === "transferencia" && (
                <div className="mt-4">
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
                            {bancos.filter(banco => banco.activo).map((banco) => (
                              <SelectItem key={banco.id} value={banco.id!}>
                                {banco.nombre_banco} - {banco.sucursal} - {banco.numero_cuenta}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Selector de tarjeta y cuotas */}
              {watchTipoPago === "tarjeta" && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tarjeta_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tarjeta</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tarjeta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tarjetas.filter(tarjeta => tarjeta.activa).map((tarjeta) => (
                                <SelectItem key={tarjeta.id} value={tarjeta.id!}>
                                  {tarjeta.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedTarjetaId && (
                      <FormField
                        control={form.control}
                        name="cuotas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cuotas</FormLabel>
                            <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar cuotas" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tarjetaCuotas.filter(cuota => cuota.activa).map((cuota) => (
                                  <SelectItem key={cuota.id} value={cuota.cantidad_cuotas.toString()}>
                                    {cuota.cantidad_cuotas} cuotas 
                                    {cuota.porcentaje_recargo > 0 && ` (+${cuota.porcentaje_recargo}%)`}
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

                  {form.watch("recargo_cuotas") > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        Recargo por cuotas: ${form.watch("recargo_cuotas").toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="font-semibold text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

            {/* Botones */}
            <div className="flex justify-end gap-2">
              <Button type="submit">
                {venta ? "Actualizar" : "Guardar"}
              </Button>
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default VentaForm
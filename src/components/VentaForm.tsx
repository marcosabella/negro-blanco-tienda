import React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"

type VentaFormProps = {
  form: any
  onSubmit: (data: any) => void
  selectedTarjetaId?: string
}

const VentaForm: React.FC<VentaFormProps> = ({ form, onSubmit, selectedTarjetaId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Venta</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Datos principales */}
            <div className="grid grid-cols-2 gap-4">
              {/* Ejemplo: campo cliente */}
              <div>
                <label>Cliente</label>
                <input {...form.register("cliente")} className="input" />
              </div>
              {/* Ejemplo: campo fecha */}
              <div>
                <label>Fecha</label>
                <input type="date" {...form.register("fecha")} className="input" />
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <label>Tipo de Pago</label>
                  <select {...form.register("tipo_pago")} className="input">
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label>Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register("monto")}
                    className="input"
                  />
                </div>
                <div>
                  <label>Cuotas</label>
                  <input
                    type="number"
                    {...form.register("cuotas")}
                    className="input"
                  />
                </div>
              </div>

              {form.watch("tipo_pago") === "tarjeta" &&
                selectedTarjetaId &&
                form.watch("cuotas") && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Pagando con tarjeta seleccionada en{" "}
                      {form.watch("cuotas")} cuotas.
                    </p>
                  </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="outline">
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


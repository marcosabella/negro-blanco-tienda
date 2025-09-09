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
import { Search } from "lucide-react";
import { useCuentaCorriente } from "@/hooks/useCuentaCorriente";
import { useClientes } from "@/hooks/useClientes";
import { CONCEPTOS_MOVIMIENTO } from "@/types/cuenta-corriente";
import { format } from "date-fns";

const movimientoSchema = z.object({
  cliente_id: z.string().min(1, "Cliente es requerido"),
  tipo_movimiento: z.enum(['debito', 'credito']),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  concepto: z.string().min(1, "Concepto es requerido"),
  fecha_movimiento: z.string(),
  observaciones: z.string().optional(),
});

interface CuentaCorrienteFormProps {
  onSuccess: () => void;
}

export const CuentaCorrienteForm = ({ onSuccess }: CuentaCorrienteFormProps) => {
  const { createMovimiento, isCreating } = useCuentaCorriente();
  const clientesQuery = useClientes();
  
  const clientes = clientesQuery.data || [];
  
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<{ id: string; nombre: string; apellido: string } | null>(null);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    cliente.apellido.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    cliente.cuit.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const form = useForm<z.infer<typeof movimientoSchema>>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      tipo_movimiento: "credito",
      monto: 0,
      concepto: "",
      fecha_movimiento: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      observaciones: "",
    },
  });

  const onSubmit = (values: z.infer<typeof movimientoSchema>) => {
    createMovimiento({
      cliente_id: values.cliente_id,
      tipo_movimiento: values.tipo_movimiento,
      monto: values.monto,
      concepto: values.concepto,
      fecha_movimiento: new Date(values.fecha_movimiento).toISOString(),
      observaciones: values.observaciones,
    });
    onSuccess();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo Movimiento de Cuenta Corriente</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          value={selectedClient ? `${selectedClient.nombre} ${selectedClient.apellido}` : ""}
                          readOnly 
                          placeholder="Seleccionar cliente..."
                        />
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

              <FormField
                control={form.control}
                name="fecha_movimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del Movimiento</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="tipo_movimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimiento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="debito">Débito (Cargo)</SelectItem>
                        <SelectItem value="credito">Crédito (Pago)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="concepto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concepto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar concepto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONCEPTOS_MOVIMIENTO.map((concepto) => (
                          <SelectItem key={concepto.value} value={concepto.value}>
                            {concepto.label}
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

            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Guardando..." : "Guardar Movimiento"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
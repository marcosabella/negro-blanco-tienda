import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProveedor, useUpdateProveedor, type Proveedor } from '@/hooks/useProveedores';

const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().optional(),
  razon_social: z.string().optional(),
  cuit: z.string().min(1, 'El CUIT es requerido'),
  calle: z.string().min(1, 'La calle es requerida'),
  numero: z.string().min(1, 'El número es requerido'),
  codigo_postal: z.string().min(1, 'El código postal es requerido'),
  localidad: z.string().min(1, 'La localidad es requerida'),
  provincia: z.string().min(1, 'La provincia es requerida'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  situacion_afip: z.string().min(1, 'La situación AFIP es requerida'),
  ingresos_brutos: z.string().optional(),
  tipo_persona: z.enum(['fisica', 'juridica'], { required_error: 'El tipo de persona es requerido' }),
});

type ProveedorFormData = z.infer<typeof proveedorSchema>;

interface ProveedorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor?: Proveedor;
}

export function ProveedorForm({ open, onOpenChange, proveedor }: ProveedorFormProps) {
  const createProveedor = useCreateProveedor();
  const updateProveedor = useUpdateProveedor();
  
  const form = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: proveedor?.nombre || '',
      apellido: proveedor?.apellido || '',
      razon_social: proveedor?.razon_social || '',
      cuit: proveedor?.cuit || '',
      calle: proveedor?.calle || '',
      numero: proveedor?.numero || '',
      codigo_postal: proveedor?.codigo_postal || '',
      localidad: proveedor?.localidad || '',
      provincia: proveedor?.provincia || '',
      telefono: proveedor?.telefono || '',
      email: proveedor?.email || '',
      situacion_afip: proveedor?.situacion_afip || '',
      ingresos_brutos: proveedor?.ingresos_brutos || '',
      tipo_persona: proveedor?.tipo_persona || 'fisica',
    },
  });

  const onSubmit = (data: ProveedorFormData) => {
    const proveedorData: Proveedor = {
      ...data,
      nombre: data.nombre,
      apellido: data.apellido || undefined,
      razon_social: data.razon_social || undefined,
      cuit: data.cuit,
      calle: data.calle,
      numero: data.numero,
      codigo_postal: data.codigo_postal,
      localidad: data.localidad,
      provincia: data.provincia,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
      situacion_afip: data.situacion_afip,
      ingresos_brutos: data.ingresos_brutos || undefined,
      tipo_persona: data.tipo_persona,
    };

    if (proveedor) {
      updateProveedor.mutate({ ...proveedorData, id: proveedor.id! } as Proveedor);
    } else {
      createProveedor.mutate(proveedorData as Omit<Proveedor, 'id'>);
    }
    
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_persona"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Persona</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fisica">Persona Física</SelectItem>
                        <SelectItem value="juridica">Persona Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cuit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CUIT</FormLabel>
                    <FormControl>
                      <Input placeholder="XX-XXXXXXXX-X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch('tipo_persona') === 'juridica' ? (
              <FormField
                control={form.control}
                name="razon_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="calle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calle</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo_postal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Postal</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="localidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localidad</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provincia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="situacion_afip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situación AFIP</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar situación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="responsable_inscripto">Responsable Inscripto</SelectItem>
                        <SelectItem value="monotributo">Monotributo</SelectItem>
                        <SelectItem value="exento">Exento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ingresos_brutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingresos Brutos</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProveedor.isPending || updateProveedor.isPending}>
                {proveedor ? 'Actualizar' : 'Crear'} Proveedor
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
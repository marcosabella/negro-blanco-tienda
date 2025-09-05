import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductos } from "@/hooks/useProductos";
import { useProveedores } from "@/hooks/useProveedores";
import { useMarcas } from "@/hooks/useMarcas";
import { useRubros } from "@/hooks/useRubros";
import { useSubRubros } from "@/hooks/useSubRubros";
import { Producto } from "@/types/producto";

interface ProductoFormProps {
  producto?: Producto;
  onClose?: () => void;
}

export const ProductoForm = ({ producto, onClose }: ProductoFormProps) => {
  const { createProducto, updateProducto, isCreating, isUpdating } = useProductos();
  const { data: proveedores = [] } = useProveedores();
  const { marcas } = useMarcas();
  const { rubros } = useRubros();
  const { subrubros } = useSubRubros();
  
  const [selectedRubro, setSelectedRubro] = useState<string>("");
  const [filteredSubRubros, setFilteredSubRubros] = useState(subrubros);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<Producto>({
    defaultValues: producto || {
      cod_producto: "",
      cod_barras: "",
      descripcion: "",
      proveedor_id: "",
      marca_id: "",
      rubro_id: "",
      subrubro_id: "",
      precio_costo: 0,
      porcentaje_iva: 21,
      porcentaje_utilidad: 0,
      porcentaje_descuento: 0,
      stock: 0,
      tipo_moneda: "ARS",
      observaciones: "",
    },
  });

  // Watch rubro changes to filter subrubros
  const rubroId = watch("rubro_id");

  useEffect(() => {
    if (rubroId) {
      setFilteredSubRubros(subrubros.filter(sr => sr.rubro_id === rubroId));
    } else {
      setFilteredSubRubros([]);
    }
  }, [rubroId, subrubros]);

  const onSubmit = (data: Producto) => {
    if (producto) {
      updateProducto({ ...data, id: producto.id });
    } else {
      createProducto(data);
    }
    
    if (!producto) {
      reset();
    }
    onClose?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{producto ? "Editar Producto" : "Nuevo Producto"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cod_producto">Código Producto *</Label>
              <Input
                id="cod_producto"
                {...register("cod_producto", { required: "El código es requerido" })}
                placeholder="Código del producto"
              />
              {errors.cod_producto && (
                <p className="text-sm text-destructive">{errors.cod_producto.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cod_barras">Código de Barras</Label>
              <Input
                id="cod_barras"
                {...register("cod_barras")}
                placeholder="Código de barras"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Input
                id="descripcion"
                {...register("descripcion", { required: "La descripción es requerida" })}
                placeholder="Descripción del producto"
              />
              {errors.descripcion && (
                <p className="text-sm text-destructive">{errors.descripcion.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedor_id">Proveedor *</Label>
              <Select onValueChange={(value) => setValue("proveedor_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((proveedor) => (
                    <SelectItem key={proveedor.id} value={proveedor.id}>
                      {proveedor.razon_social || `${proveedor.nombre} ${proveedor.apellido || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca_id">Marca *</Label>
              <Select onValueChange={(value) => setValue("marca_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((marca) => (
                    <SelectItem key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rubro_id">Rubro *</Label>
              <Select onValueChange={(value) => setValue("rubro_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rubro" />
                </SelectTrigger>
                <SelectContent>
                  {rubros.map((rubro) => (
                    <SelectItem key={rubro.id} value={rubro.id}>
                      {rubro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subrubro_id">SubRubro *</Label>
              <Select onValueChange={(value) => setValue("subrubro_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar subrubro" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubRubros.map((subrubro) => (
                    <SelectItem key={subrubro.id} value={subrubro.id}>
                      {subrubro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio_costo">Precio Costo *</Label>
              <Input
                id="precio_costo"
                type="number"
                step="0.01"
                {...register("precio_costo", { 
                  required: "El precio costo es requerido",
                  min: { value: 0, message: "El precio debe ser mayor a 0" }
                })}
                placeholder="0.00"
              />
              {errors.precio_costo && (
                <p className="text-sm text-destructive">{errors.precio_costo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="porcentaje_iva">% IVA</Label>
              <Input
                id="porcentaje_iva"
                type="number"
                step="0.01"
                {...register("porcentaje_iva", { 
                  min: { value: 0, message: "El porcentaje debe ser mayor a 0" }
                })}
                placeholder="21.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="porcentaje_utilidad">% Utilidad</Label>
              <Input
                id="porcentaje_utilidad"
                type="number"
                step="0.01"
                {...register("porcentaje_utilidad", { 
                  min: { value: 0, message: "El porcentaje debe ser mayor a 0" }
                })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="porcentaje_descuento">% Descuento</Label>
              <Input
                id="porcentaje_descuento"
                type="number"
                step="0.01"
                {...register("porcentaje_descuento", { 
                  min: { value: 0, message: "El porcentaje debe ser mayor a 0" }
                })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                {...register("stock", { 
                  required: "El stock es requerido",
                  min: { value: 0, message: "El stock debe ser mayor o igual a 0" }
                })}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_moneda">Tipo de Moneda</Label>
              <Select onValueChange={(value) => setValue("tipo_moneda", value as "ARS" | "USD" | "USD_BLUE")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS ($)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="USD_BLUE">USD Blue ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                {...register("observaciones")}
                placeholder="Observaciones adicionales"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isCreating || isUpdating}
            >
              {producto ? "Actualizar" : "Crear"} Producto
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
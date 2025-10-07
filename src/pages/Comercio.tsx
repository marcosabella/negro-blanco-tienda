import { ComercioForm } from "@/components/ComercioForm";
import { useComercio } from "@/hooks/useComercio";
import { ComercioFormData } from "@/types/comercio";

const Comercio = () => {
  const { comercio, isLoading, createComercio, updateComercio } = useComercio();

  const handleSubmit = (data: ComercioFormData) => {
    if (comercio) {
      updateComercio.mutate({ id: comercio.id, formData: data });
    } else {
      createComercio.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Mi Comercio</h1>
      <ComercioForm
        initialData={comercio || undefined}
        onSubmit={handleSubmit}
        isLoading={createComercio.isPending || updateComercio.isPending}
      />
    </div>
  );
};

export default Comercio;

import ConcursoQuiebra from "@/components/estudio/ConcursoQuiebra";

export default function ConcursoQuiebraPage() {
  return (
    <div className="p-6 lg:p-8 space-y-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold">Concurso y Quiebra</h1>
        <p className="text-muted-foreground mt-1">
          Especialista IA en derecho concursal · Normativa vigente San Luis y Córdoba
        </p>
      </div>
      <ConcursoQuiebra caso={null} />
    </div>
  );
}
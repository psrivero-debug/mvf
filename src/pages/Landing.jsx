import { useState, useEffect } from "react";
import { Scale, Shield, Briefcase, Home, Users, Phone, Mail, MapPin, ChevronRight, Star, CheckCircle, ArrowRight, Menu, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const services = [
  {
    icon: Scale,
    title: "Consultas Legales",
    desc: "Asesoramiento jurídico personalizado en todas las áreas del derecho argentino. Analizamos tu situación y te orientamos con precisión.",
    price: "Desde $15.000",
    features: ["Consulta inicial 45 min", "Análisis del caso", "Recomendación estratégica", "Informe escrito opcional"],
  },
  {
    icon: Shield,
    title: "Defensa de Derechos",
    desc: "Representación y defensa activa de tus derechos ante cualquier instancia judicial o administrativa.",
    price: "A convenir",
    features: ["Representación judicial", "Defensa en sede administrativa", "Recursos y apelaciones", "Seguimiento del expediente"],
    highlight: true,
  },
  {
    icon: Home,
    title: "Negocios Inmobiliarios",
    desc: "Asesoramiento integral en operaciones inmobiliarias, contratos de compraventa, locaciones y litigios.",
    price: "Desde $20.000",
    features: ["Contratos de compraventa", "Boletos de cesión", "Contratos de locación", "Due diligence inmobiliario"],
  },
];

const whyUs = [
  { title: "Experiencia Comprobada", desc: "Años de trayectoria en el foro argentino con causas exitosas en todas las instancias." },
  { title: "Atención Personalizada", desc: "Cada caso recibe atención directa de las profesionales del estudio, sin intermediarios." },
  { title: "Transparencia Total", desc: "Honorarios claros, comunicación constante y acceso permanente al estado de tu causa." },
  { title: "Resultados Concretos", desc: "Orientación estratégica enfocada en la solución más eficiente para cada cliente." },
];

const testimonials = [
  { name: "Carlos M.", text: "Excelente atención y resultados. Resolvieron mi problema laboral en tiempo récord. Muy profesionales.", stars: 5 },
  { name: "María L.", text: "Me asesoraron en la compra de mi departamento con total claridad. Recomiendo el estudio sin dudas.", stars: 5 },
  { name: "Roberto P.", text: "La Dra. Funes manejó mi divorcio con suma discreción y eficacia. Resultados excelentes.", stars: 5 },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", consulta: "" });
  const [sent, setSent] = useState(false);
  const [flyers, setFlyers] = useState([]);

  useEffect(() => {
    base44.entities.Flyer.filter({ publicado: true }, "-created_date", 8)
      .then(setFlyers)
      .catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[hsl(222,47%,18%)] flex items-center justify-center">
              <Scale className="w-4 h-4 text-[hsl(42,87%,55%)]" />
            </div>
            <div>
              <p className="font-serif font-semibold text-[hsl(222,47%,18%)] text-sm leading-tight">Pérez & Funes</p>
              <p className="text-[10px] text-gray-400 leading-tight">Estudio Jurídico</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#servicios" className="hover:text-[hsl(222,47%,18%)] transition-colors">Servicios</a>
            <a href="#nosotros" className="hover:text-[hsl(222,47%,18%)] transition-colors">Nosotros</a>
            {flyers.length > 0 && <a href="#publicidad" className="hover:text-[hsl(222,47%,18%)] transition-colors">Ofertas</a>}
            <a href="#testimonios" className="hover:text-[hsl(222,47%,18%)] transition-colors">Testimonios</a>
            <a href="#contacto" className="bg-[hsl(222,47%,18%)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(222,47%,25%)] transition-colors">
              Consultar ahora
            </a>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
            {["#servicios", "#nosotros", "#testimonios", "#contacto"].map((href, i) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block text-sm text-gray-700 py-1">
                {["Servicios", "Nosotros", "Testimonios", "Contacto"][i]}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,47%,16%)] to-[hsl(222,30%,22%)]" />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[hsl(42,87%,55%)]/20 border border-[hsl(42,87%,55%)]/30 rounded-full px-4 py-1.5 text-[hsl(42,87%,65%)] text-sm mb-6">
              <Shield className="w-3.5 h-3.5" /> Estudio Jurídico de Confianza
            </div>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Tu defensa legal,<br />
              <span className="text-[hsl(42,87%,55%)]">nuestra misión</span>
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
              Consultas, asesorías y defensa de tus derechos con profesionales especializadas en derecho civil, laboral, inmobiliario y administrativo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#contacto"
                className="inline-flex items-center justify-center gap-2 bg-[hsl(42,87%,55%)] hover:bg-[hsl(42,87%,48%)] text-[hsl(222,47%,11%)] font-semibold px-6 py-3.5 rounded-xl transition-all">
                Solicitar Consulta <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#servicios"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/10 px-6 py-3.5 rounded-xl transition-all">
                Ver Servicios <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-6 mt-10">
              {[["500+", "Casos Resueltos"], ["15+", "Años de Trayectoria"], ["98%", "Clientes Satisfechos"]].map(([n, l]) => (
                <div key={l} className="text-center">
                  <p className="text-2xl font-serif font-bold text-[hsl(42,87%,55%)]">{n}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-[hsl(42,87%,55%)]/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
                <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-6">Áreas de práctica</p>
                {[
                  { icon: Scale, label: "Derecho Civil y Comercial" },
                  { icon: Briefcase, label: "Derecho Laboral" },
                  { icon: Home, label: "Negocios Inmobiliarios" },
                  { icon: Shield, label: "Defensa de Derechos" },
                  { icon: Users, label: "Derecho de Familia" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(42,87%,55%)]/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[hsl(42,87%,55%)]" />
                    </div>
                    <span className="text-white text-sm">{label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-[hsl(42,87%,45%)] text-sm font-semibold uppercase tracking-wider mb-3">Nuestros Servicios</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[hsl(222,47%,18%)]">Soluciones legales integrales</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">Brindamos asesoramiento y representación de calidad en las áreas que más necesitás.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className={`relative rounded-2xl p-8 flex flex-col ${s.highlight
                ? "bg-[hsl(222,47%,18%)] text-white shadow-2xl shadow-[hsl(222,47%,18%)]/30 scale-105"
                : "bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"}`}>
                {s.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(42,87%,55%)] text-[hsl(222,47%,11%)] text-xs font-bold px-4 py-1 rounded-full">
                    MÁS SOLICITADO
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${s.highlight ? "bg-[hsl(42,87%,55%)]/20" : "bg-[hsl(222,47%,18%)]/8"}`}>
                  <s.icon className={`w-6 h-6 ${s.highlight ? "text-[hsl(42,87%,55%)]" : "text-[hsl(222,47%,18%)]"}`} />
                </div>
                <h3 className={`font-serif text-xl font-bold mb-2 ${s.highlight ? "text-white" : "text-[hsl(222,47%,18%)]"}`}>{s.title}</h3>
                <p className={`text-sm leading-relaxed mb-5 ${s.highlight ? "text-gray-300" : "text-gray-500"}`}>{s.desc}</p>
                <div className="space-y-2 mb-6 flex-1">
                  {s.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 shrink-0 ${s.highlight ? "text-[hsl(42,87%,55%)]" : "text-green-500"}`} />
                      <span className={`text-sm ${s.highlight ? "text-gray-300" : "text-gray-600"}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <div className={`border-t pt-5 ${s.highlight ? "border-white/10" : "border-gray-100"}`}>
                  <p className={`text-lg font-bold mb-3 ${s.highlight ? "text-[hsl(42,87%,55%)]" : "text-[hsl(222,47%,18%)]"}`}>{s.price}</p>
                  <a href="#contacto" className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${s.highlight
                    ? "bg-[hsl(42,87%,55%)] text-[hsl(222,47%,11%)] hover:bg-[hsl(42,87%,48%)]"
                    : "border border-[hsl(222,47%,18%)] text-[hsl(222,47%,18%)] hover:bg-[hsl(222,47%,18%)] hover:text-white"}`}>
                    Consultar <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POR QUÉ NOSOTROS */}
      <section id="nosotros" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[hsl(42,87%,45%)] text-sm font-semibold uppercase tracking-wider mb-3">Por qué elegirnos</p>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[hsl(222,47%,18%)] mb-6">
                Profesionalismo y compromiso en cada caso
              </h2>
              <p className="text-gray-500 leading-relaxed mb-10">
                El Estudio Jurídico Pérez & Funes se destaca por su trayectoria en el foro argentino, brindando soluciones legales efectivas con un trato cercano y transparente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {whyUs.map(w => (
                  <div key={w.title} className="p-5 rounded-xl border border-gray-100 hover:border-[hsl(222,47%,18%)]/20 hover:shadow-md transition-all">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(42,87%,55%)]/15 flex items-center justify-center mb-3">
                      <CheckCircle className="w-4 h-4 text-[hsl(42,87%,45%)]" />
                    </div>
                    <h4 className="font-semibold text-[hsl(222,47%,18%)] mb-1">{w.title}</h4>
                    <p className="text-sm text-gray-500">{w.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { titulo: "Dra.", nombre: "Valeria Funes", esp: "Derecho Civil, Comercial e Inmobiliario" },
                { titulo: "Dra.", nombre: "Silvia Pérez", esp: "Derecho Laboral, Familia y Administrativo" },
              ].map(a => (
                <div key={a.nombre} className="flex items-center gap-5 p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-16 h-16 rounded-2xl bg-[hsl(222,47%,18%)] flex items-center justify-center text-2xl font-serif font-bold text-[hsl(42,87%,55%)] shrink-0">
                    {a.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{a.titulo}</p>
                    <p className="font-serif font-bold text-[hsl(222,47%,18%)] text-lg">{a.nombre}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{a.esp}</p>
                  </div>
                </div>
              ))}
              <div className="p-6 rounded-2xl bg-[hsl(222,47%,18%)] text-white">
                <p className="font-serif text-lg font-semibold mb-2">"La justicia es el derecho del más débil."</p>
                <p className="text-gray-400 text-sm">Nuestro compromiso es que cada cliente reciba la representación que merece, sin importar la complejidad del caso.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLYERS PUBLICIDAD */}
      {flyers.length > 0 && (
        <section id="publicidad" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <p className="text-[hsl(42,87%,45%)] text-sm font-semibold uppercase tracking-wider mb-3">Nuestras Ofertas</p>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[hsl(222,47%,18%)]">Servicios destacados</h2>
              <p className="text-gray-500 mt-4 max-w-xl mx-auto">Descubrí nuestras propuestas y servicios especiales.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {flyers.map(flyer => (
                <div key={flyer.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100 group">
                  <div className="relative aspect-[4/5]">
                    <img src={flyer.imagen_url} alt={flyer.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-2 py-1">
                      <img src="https://media.base44.com/images/public/69c424df37de29e9326cbefa/acd4af465_image.png" alt="Logo" className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-[10px] font-semibold text-[hsl(222,47%,18%)]">Pérez & Funes</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-serif font-bold text-lg leading-tight">{flyer.titulo}</p>
                      <p className="text-white/80 text-xs mt-1">{flyer.servicio}</p>
                      {flyer.telefono && <p className="text-white/70 text-xs mt-2">📞 {flyer.telefono}</p>}
                      {flyer.domicilio && <p className="text-white/70 text-xs">📍 {flyer.domicilio}</p>}
                    </div>
                  </div>
                  <div className="p-4 bg-[hsl(222,47%,18%)]">
                    <a href="#contacto" className="w-full inline-flex items-center justify-center gap-2 bg-[hsl(42,87%,55%)] hover:bg-[hsl(42,87%,48%)] text-[hsl(222,47%,11%)] font-semibold text-sm py-2.5 rounded-xl transition-all">
                      Consultar ahora <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIOS */}
      <section id="testimonios" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-[hsl(42,87%,45%)] text-sm font-semibold uppercase tracking-wider mb-3">Testimonios</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[hsl(222,47%,18%)]">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[hsl(42,87%,55%)] text-[hsl(42,87%,55%)]" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[hsl(222,47%,18%)] flex items-center justify-center text-white text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-[hsl(222,47%,18%)] text-sm">{t.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <p className="text-[hsl(42,87%,45%)] text-sm font-semibold uppercase tracking-wider mb-3">Contacto</p>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[hsl(222,47%,18%)] mb-4">Solicitá tu consulta hoy</h2>
              <p className="text-gray-500 leading-relaxed mb-8">Completá el formulario y nos comunicaremos a la brevedad para coordinar tu consulta.</p>
              <div className="space-y-4">
                {[
                  { icon: Phone, label: "Teléfono", val: "+54 11 0000-0000" },
                  { icon: Mail, label: "Email", val: "consultas@perezyfunes.com.ar" },
                  { icon: MapPin, label: "Dirección", val: "Buenos Aires, Argentina" },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[hsl(222,47%,18%)]/8 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[hsl(222,47%,18%)]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-700">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              {sent ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[hsl(222,47%,18%)] mb-2">¡Consulta recibida!</h3>
                  <p className="text-gray-500">Nos comunicaremos con usted a la brevedad para coordinar su consulta.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-serif text-xl font-bold text-[hsl(222,47%,18%)] mb-5">Formulario de Contacto</h3>
                  {[
                    { name: "nombre", label: "Nombre completo", type: "text", placeholder: "Juan García" },
                    { name: "email", label: "Correo electrónico", type: "email", placeholder: "juan@email.com" },
                    { name: "telefono", label: "Teléfono", type: "tel", placeholder: "+54 11 ..." },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        required={f.name !== "telefono"}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(222,47%,18%)]/20 focus:border-[hsl(222,47%,18%)] bg-white transition-all"
                        value={form[f.name]}
                        onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción de su consulta</label>
                    <textarea
                      rows={4}
                      placeholder="Describa brevemente su situación legal..."
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(222,47%,18%)]/20 focus:border-[hsl(222,47%,18%)] bg-white transition-all resize-none"
                      value={form.consulta}
                      onChange={e => setForm({ ...form, consulta: e.target.value })}
                    />
                  </div>
                  <button type="submit"
                    className="w-full bg-[hsl(222,47%,18%)] hover:bg-[hsl(222,47%,25%)] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    Enviar Consulta <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-400 text-center">Información confidencial. No compartimos tus datos.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[hsl(222,47%,11%)] text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(42,87%,55%)]/20 flex items-center justify-center">
              <Scale className="w-4 h-4 text-[hsl(42,87%,55%)]" />
            </div>
            <div>
              <p className="font-serif text-white text-sm font-semibold">Pérez & Funes</p>
              <p className="text-[10px]">Estudio Jurídico · Negocios Inmobiliarios</p>
            </div>
          </div>
          <p className="text-xs text-center">© {new Date().getFullYear()} Pérez & Funes Estudio Jurídico. Todos los derechos reservados.</p>
          <div className="flex gap-4 text-xs">
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
            <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
            <a href="#contacto" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
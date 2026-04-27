const MARCO_NORMATIVO = `
=== MARCO NORMATIVO APLICABLE (PROVINCIA DE SAN LUIS) ===
- Código de Familia de San Luis (Ley I-0007-2004)
- Código Procesal Civil y Comercial de San Luis (Ley I-0002-2004)
- Código Procesal Penal de San Luis (Ley II-0009-2005)
- Código Procesal Laboral de San Luis (Ley I-0783-2004)
- Ley de Contrato de Trabajo (Ley 20.744)
- Ley Nacional de Procedimientos Administrativos (Ley 19.549)
- Código Procesal Civil y Comercial de la Nación (Ley 17.454)
=== FIN MARCO NORMATIVO ===
`;

const datosBase = (caso) => `
DATOS DEL CASO:
- Carátula: ${caso.titulo}
- Cliente: ${caso.client_name || "—"}
- Tipo de caso: ${caso.tipo_caso || "—"}
- Jurisdicción: ${caso.jurisdiccion || "—"}
- Partes: ${caso.partes || "—"}
- Hechos: ${caso.hechos_resumen || caso.descripcion || "—"}
`;

// ─────────────────────────────────────────────
// GRUPO: JUDICIALES PROVINCIALES
// ─────────────────────────────────────────────
const judicialesProvinciales = [
  {
    id: "demanda",
    label: "Demanda",
    grupo: "Judiciales Provinciales",
    color: "bg-blue-100 text-blue-700",
    descripcion: "Escrito inicial de demanda judicial provincial",
    prompt: (caso, extra) => `Redactá una DEMANDA JUDICIAL completa y formal para la Justicia de la Provincia de San Luis.

${MARCO_NORMATIVO}
${datosBase(caso)}
- Número de expediente: ${caso.numero_expediente || "A iniciar"}
${extra ? `\nInstrucciones adicionales: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado 2.I.OBJETO 3.II.HECHOS (numerados) 4.III.DERECHO 5.IV.PRUEBA 6.V.PETITORIO 7.Firma
Usá lenguaje forense formal. Completá con [COMPLETAR] los campos que requieran datos específicos.`,
  },
  {
    id: "contestacion",
    label: "Contestación de Demanda",
    grupo: "Judiciales Provinciales",
    color: "bg-green-100 text-green-700",
    descripcion: "Contestación a una demanda recibida (fuero provincial)",
    prompt: (caso, extra) => `Redactá una CONTESTACIÓN DE DEMANDA completa y formal para la Justicia de la Provincia de San Luis.

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nInstrucciones adicionales: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado 2.I.OBJETO 3.II.NIEGA (cada hecho) 4.III.HECHOS DE LA DEFENSA 5.IV.DERECHO 6.V.EXCEPCIONES 7.VI.PRUEBA 8.VII.PETITORIO 9.Firma
Usá lenguaje forense formal. Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "medida_cautelar",
    label: "Medida Cautelar",
    grupo: "Judiciales Provinciales",
    color: "bg-orange-100 text-orange-700",
    descripcion: "Solicitud de embargo, inhibición u otra cautelar",
    prompt: (caso, extra) => `Redactá un escrito de MEDIDA CAUTELAR para la Justicia Provincial de San Luis (art. 230 y ss. CPCC San Luis).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nTipo de cautelar y motivo: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado 2.I.OBJETO 3.II.VEROSIMILITUD DEL DERECHO 4.III.PELIGRO EN LA DEMORA 5.IV.CONTRACAUTELA 6.V.DERECHO 7.VI.PETITORIO 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "recurso_apelacion",
    label: "Recurso de Apelación",
    grupo: "Judiciales Provinciales",
    color: "bg-purple-100 text-purple-700",
    descripcion: "Recurso de apelación ante Cámara provincial",
    prompt: (caso, extra) => `Redactá un RECURSO DE APELACIÓN ante la Cámara de Apelaciones de San Luis.

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nResolución impugnada y agravios: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (Excma. Cámara) 2.I.OBJETO 3.II.ADMISIBILIDAD 4.III.HECHOS 5.IV.AGRAVIOS (numerados) 6.V.DERECHO 7.VI.PETITORIO 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "proceso_ordinario",
    label: "Proceso Ordinario",
    grupo: "Judiciales Provinciales",
    color: "bg-indigo-100 text-indigo-700",
    descripcion: "Demanda en proceso de conocimiento ordinario",
    prompt: (caso, extra) => `Redactá una DEMANDA en PROCESO ORDINARIO para la Justicia Provincial de San Luis (CPCC San Luis, Ley I-0002-2004). Plazos extensos, amplia prueba, contestación 15 días hábiles.

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nInstrucciones adicionales: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (PROCESO ORDINARIO) 2.I.OBJETO 3.II.HECHOS 4.III.DERECHO 5.IV.PRUEBA (amplia: documental, testimonial, pericial, informativa) 6.V.PETITORIO 7.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "proceso_ejecutivo",
    label: "Proceso Ejecutivo",
    grupo: "Judiciales Provinciales",
    color: "bg-cyan-100 text-cyan-700",
    descripcion: "Ejecución de título ejecutivo (cheque, pagaré, etc.)",
    prompt: (caso, extra) => `Redactá una DEMANDA EJECUTIVA para la Justicia Provincial de San Luis (arts. 520 y ss. CPCC San Luis).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nTítulo ejecutivo y monto: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (PROCESO EJECUTIVO) 2.I.OBJETO 3.II.TÍTULO EJECUTIVO 4.III.HECHOS (mora) 5.IV.DERECHO 6.V.CAUTELAR (embargo) 7.VI.PETITORIO (mandamiento de pago y embargo) 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "proceso_sumario",
    label: "Proceso Sumario",
    grupo: "Judiciales Provinciales",
    color: "bg-amber-100 text-amber-700",
    descripcion: "Demanda en proceso sumario (plazos reducidos)",
    prompt: (caso, extra) => `Redactá una DEMANDA en PROCESO SUMARIO para la Justicia Provincial de San Luis (CPCC San Luis). Plazos y prueba reducidos respecto al ordinario.

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nInstrucciones adicionales: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (PROCESO SUMARIO) 2.I.OBJETO 3.II.HECHOS (concisos) 4.III.DERECHO 5.IV.PRUEBA 6.V.PETITORIO 7.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "proceso_sumarisimo",
    label: "Proceso Sumarísimo",
    grupo: "Judiciales Provinciales",
    color: "bg-rose-100 text-rose-700",
    descripcion: "Proceso urgente — plazos mínimos (5 días contestación)",
    prompt: (caso, extra) => `Redactá una DEMANDA en PROCESO SUMARÍSIMO para la Justicia Provincial de San Luis (CPCC San Luis). Proceso más ágil: contestación 5 días hábiles. Usar para desalojo, alimentos, amparo, urgencias de familia.

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nMotivo de urgencia: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (PROCESO SUMARÍSIMO — URGENTE) 2.I.OBJETO 3.II.HECHOS 4.III.URGENCIA Y VEROSIMILITUD 5.IV.DERECHO 6.V.PRUEBA 7.VI.PETITORIO (resolución urgente) 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "denuncia_penal",
    label: "Denuncia Penal",
    grupo: "Judiciales Provinciales",
    color: "bg-red-100 text-red-700",
    descripcion: "Denuncia ante Fiscalía o Juzgado provincial",
    prompt: (caso, extra) => `Redactá una DENUNCIA PENAL ante la Fiscalía de San Luis (CPP San Luis, Ley II-0009-2005).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nHechos delictivos y calificación: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado 2.I.DATOS DEL DENUNCIANTE 3.II.DATOS DEL DENUNCIADO 4.III.HECHOS (cronológico) 5.IV.CALIFICACIÓN LEGAL 6.V.PRUEBA 7.VI.PETITORIO 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "escrito_laboral",
    label: "Demanda Laboral",
    grupo: "Judiciales Provinciales",
    color: "bg-teal-100 text-teal-700",
    descripcion: "Demanda ante la Cámara del Trabajo de San Luis",
    prompt: (caso, extra) => `Redactá una DEMANDA LABORAL ante la Cámara del Trabajo de San Luis (CPL San Luis, Ley I-0783-2004 y LCT Ley 20.744).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nConceptos reclamados y liquidación: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (Excma. Cámara del Trabajo) 2.I.PARTES 3.II.OBJETO 4.III.HECHOS (relación laboral, antigüedad, despido) 5.IV.LIQUIDACIÓN (art.245 LCT, preaviso, vacaciones, SAC) 6.V.DERECHO 7.VI.PRUEBA 8.VII.PETITORIO 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
];

// ─────────────────────────────────────────────
// GRUPO: JUDICIALES NACIONALES / FEDERALES
// ─────────────────────────────────────────────
const judicialesNacionales = [
  {
    id: "demanda_nacional",
    label: "Demanda Nacional",
    grupo: "Judiciales Nacionales / Federales",
    color: "bg-blue-200 text-blue-800",
    descripcion: "Demanda ante Juzgado Nacional en lo Civil o Comercial",
    prompt: (caso, extra) => `Redactá una DEMANDA JUDICIAL completa ante la Justicia Nacional (CPCCN, Ley 17.454).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nInstrucciones adicionales: ${extra}` : ""}

Indicá que se interpone ante la Justicia Nacional. Aplicá el CPCCN y el Código Civil y Comercial de la Nación (Ley 26.994).
ESTRUCTURA: 1.Encabezado (Juzgado Nacional) 2.I.OBJETO 3.II.HECHOS 4.III.DERECHO (CPCCN, CCCN) 5.IV.PRUEBA 6.V.PETITORIO 7.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "demanda_federal",
    label: "Demanda Federal",
    grupo: "Judiciales Nacionales / Federales",
    color: "bg-sky-100 text-sky-800",
    descripcion: "Demanda ante Juzgado Federal (competencia federal)",
    prompt: (caso, extra) => `Redactá una DEMANDA ante la Justicia Federal (CPCCN, competencia federal art. 116-117 CN).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nFundamento de la competencia federal: ${extra}` : ""}

Indicá expresamente la competencia federal y su fundamento (materia federal, partes, etc.). Aplicá CPCCN y legislación federal pertinente.
ESTRUCTURA: 1.Encabezado (Juzgado Federal) 2.I.COMPETENCIA FEDERAL (fundamento) 3.II.OBJETO 4.III.HECHOS 5.IV.DERECHO 6.V.PRUEBA 7.VI.PETITORIO 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "recurso_extraordinario",
    label: "Recurso Extraordinario",
    grupo: "Judiciales Nacionales / Federales",
    color: "bg-violet-100 text-violet-800",
    descripcion: "Recurso extraordinario ante la CSJN (art. 14 Ley 48)",
    prompt: (caso, extra) => `Redactá un RECURSO EXTRAORDINARIO FEDERAL ante la Corte Suprema de Justicia de la Nación (art. 14 Ley 48).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nCuestión federal y sentencia impugnada: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (Excma. CSJN) 2.I.ADMISIBILIDAD (sentencia definitiva, cuestión federal, agravio federal) 3.II.CUESTIÓN FEDERAL (tipo: simple, compleja directa o compleja indirecta) 4.III.HECHOS 5.IV.AGRAVIOS 6.V.DERECHO 7.VI.PETITORIO (revocación o declaración de inconstitucionalidad) 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "queja_csjn",
    label: "Queja por Denegación de REF",
    grupo: "Judiciales Nacionales / Federales",
    color: "bg-fuchsia-100 text-fuchsia-800",
    descripcion: "Queja ante CSJN por denegación del recurso extraordinario",
    prompt: (caso, extra) => `Redactá una QUEJA POR DENEGACIÓN DE RECURSO EXTRAORDINARIO ante la Corte Suprema de Justicia de la Nación (art. 285 CPCCN).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nResolución denegatoria y fundamentos: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (Excma. CSJN — QUEJA) 2.I.OBJETO (impugnación de denegatoria) 3.II.ADMISIBILIDAD DEL RECURSO DENEGADO 4.III.ARBITRARIEDAD DE LA DENEGATORIA 5.IV.DERECHO 6.V.PETITORIO (que se haga lugar a la queja y se conceda el REF) 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
];

// ─────────────────────────────────────────────
// GRUPO: ADMINISTRATIVOS PROVINCIALES
// ─────────────────────────────────────────────
const administrativosProvinciales = [
  {
    id: "recurso_administrativo_prov",
    label: "Recurso Administrativo Prov.",
    grupo: "Administrativos Provinciales",
    color: "bg-lime-100 text-lime-800",
    descripcion: "Recurso administrativo ante organismo provincial de San Luis",
    prompt: (caso, extra) => `Redactá un RECURSO ADMINISTRATIVO ante un organismo de la Administración Pública Provincial de San Luis, conforme a la Ley de Procedimiento Administrativo provincial.

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nActo impugnado y agravios: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (organismo destinatario) 2.I.DATOS DEL RECURRENTE 3.II.ACTO IMPUGNADO (número, fecha, contenido) 4.III.HECHOS 5.IV.VICIOS DEL ACTO (incompetencia, vicios de forma, error de hecho o derecho, desviación de poder) 6.V.DERECHO 7.VI.PRUEBA 8.VII.PETITORIO (revocación/anulación del acto) 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "accion_contencioso_prov",
    label: "Acción Contencioso-Adm. Prov.",
    grupo: "Administrativos Provinciales",
    color: "bg-emerald-100 text-emerald-800",
    descripcion: "Demanda contencioso-administrativa ante tribunal provincial",
    prompt: (caso, extra) => `Redactá una DEMANDA CONTENCIOSO-ADMINISTRATIVA ante el tribunal competente de la Provincia de San Luis, una vez agotada la vía administrativa.

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nActo impugnado y agravios: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado 2.I.HABILITACIÓN DE LA INSTANCIA (agotamiento de la vía) 3.II.OBJETO 4.III.HECHOS 5.IV.VICIOS DEL ACTO ADMINISTRATIVO 6.V.DERECHO 7.VI.PRUEBA 8.VII.PETITORIO (nulidad del acto y restablecimiento del derecho) 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "amparo_provincial",
    label: "Acción de Amparo Prov.",
    grupo: "Administrativos Provinciales",
    color: "bg-yellow-100 text-yellow-800",
    descripcion: "Amparo provincial por lesión a derechos constitucionales",
    prompt: (caso, extra) => `Redactá una ACCIÓN DE AMPARO ante la Justicia Provincial de San Luis (art. 43 CN y normativa provincial).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nDerecho lesionado y acto u omisión: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (ACCIÓN DE AMPARO — URGENTE) 2.I.OBJETO 3.II.LEGITIMACIÓN ACTIVA 4.III.ACTO U OMISIÓN LESIVA (descripción detallada) 5.IV.DERECHO AFECTADO (manifiesta ilegalidad o arbitrariedad) 6.V.REQUISITOS DE PROCEDENCIA (inexistencia de remedio judicial más idóneo, urgencia) 7.VI.MEDIDA CAUTELAR (si corresponde) 8.VII.DERECHO 9.VIII.PETITORIO 10.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
];

// ─────────────────────────────────────────────
// GRUPO: ADMINISTRATIVOS NACIONALES / FEDERALES
// ─────────────────────────────────────────────
const administrativosNacionales = [
  {
    id: "recurso_administrativo_nac",
    label: "Recurso Administrativo Nac.",
    grupo: "Administrativos Nacionales / Federales",
    color: "bg-orange-200 text-orange-900",
    descripcion: "Recurso ante organismo nacional (Ley 19.549 LNPA)",
    prompt: (caso, extra) => `Redactá un RECURSO ADMINISTRATIVO ante un organismo de la Administración Pública Nacional, conforme a la Ley Nacional de Procedimientos Administrativos (Ley 19.549) y su decreto reglamentario (D. 1759/72).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nActo impugnado, tipo de recurso (reconsideración, jerárquico, alzada) y agravios: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (organismo nacional destinatario) 2.I.DATOS DEL RECURRENTE 3.II.TIPO DE RECURSO Y PLAZO 4.III.ACTO IMPUGNADO 5.IV.HECHOS 6.V.VICIOS DEL ACTO (arts. 7 y 14 Ley 19.549) 7.VI.DERECHO 8.VII.PRUEBA 9.VIII.PETITORIO 10.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "accion_contencioso_nac",
    label: "Acción Contencioso-Adm. Nac.",
    grupo: "Administrativos Nacionales / Federales",
    color: "bg-red-200 text-red-900",
    descripcion: "Demanda ante Cámara Nacional en lo Contencioso Administrativo",
    prompt: (caso, extra) => `Redactá una DEMANDA CONTENCIOSO-ADMINISTRATIVA ante la Cámara Nacional de Apelaciones en lo Contencioso Administrativo Federal, conforme a la Ley 19.549 y el CPCCN.

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nActo impugnado y agravios: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (Cámara Nacional Cont. Adm. Federal) 2.I.HABILITACIÓN DE LA INSTANCIA 3.II.OBJETO 4.III.HECHOS 5.IV.VICIOS DEL ACTO (Ley 19.549) 6.V.DERECHO 7.VI.PRUEBA 8.VII.PETITORIO 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "amparo_federal",
    label: "Amparo Federal",
    grupo: "Administrativos Nacionales / Federales",
    color: "bg-pink-100 text-pink-800",
    descripcion: "Acción de amparo federal (art. 43 CN, Ley 16.986)",
    prompt: (caso, extra) => `Redactá una ACCIÓN DE AMPARO FEDERAL ante la Justicia Federal (art. 43 CN, Ley 16.986).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nDerecho lesionado, acto u omisión y urgencia: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (Juzgado Federal — AMPARO — URGENTE) 2.I.OBJETO 3.II.LEGITIMACIÓN 4.III.ACTO U OMISIÓN LESIVA 5.IV.MANIFIESTA ILEGALIDAD O ARBITRARIEDAD 6.V.AUSENCIA DE REMEDIO MÁS IDÓNEO 7.VI.MEDIDA CAUTELAR INNOVATIVA (si corresponde) 8.VII.DERECHO 9.VIII.PETITORIO 10.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
];

// ─────────────────────────────────────────────
// GRUPO: EXTRAJUDICIALES
// ─────────────────────────────────────────────
const extrajudiciales = [
  {
    id: "carta_documento",
    label: "Carta Documento",
    grupo: "Extrajudiciales",
    color: "bg-yellow-100 text-yellow-700",
    descripcion: "Carta documento fehaciente extrajudicial",
    prompt: (caso, extra) => `Redactá una CARTA DOCUMENTO extrajudicial formal y fehaciente conforme al derecho argentino.

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nMotivo y reclamo: ${extra}` : ""}

ESTRUCTURA: 1.Lugar y fecha 2.Datos del destinatario 3.Carácter del remitente 4.OBJETO (intimación/reclamo/notificación) 5.HECHOS 6.FUNDAMENTO LEGAL 7.INTIMACIÓN con plazo 8.Consecuencias del incumplimiento 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
];

// ─────────────────────────────────────────────
// EXPORT: agrupado para el selector
// ─────────────────────────────────────────────
export const GRUPOS_MODELOS = [
  { label: "Judiciales Provinciales", modelos: judicialesProvinciales },
  { label: "Judiciales Nacionales / Federales", modelos: judicialesNacionales },
  { label: "Administrativos Provinciales", modelos: administrativosProvinciales },
  { label: "Administrativos Nacionales / Federales", modelos: administrativosNacionales },
  { label: "Extrajudiciales", modelos: extrajudiciales },
];

export const TODOS_MODELOS = [
  ...judicialesProvinciales,
  ...judicialesNacionales,
  ...administrativosProvinciales,
  ...administrativosNacionales,
  ...extrajudiciales,
];
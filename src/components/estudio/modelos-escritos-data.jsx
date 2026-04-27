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
// GRUPO: DERECHOS POSESORIOS, POSESORIOS Y SUCESORIOS
// ─────────────────────────────────────────────
const posesoriasYSucesorios = [
  {
    id: "accion_reivindicatoria",
    label: "Acción Reivindicatoria",
    grupo: "Posesorios, Reales y Sucesorios",
    color: "bg-stone-100 text-stone-800",
    descripcion: "Reivindicación de inmueble por el propietario desposeído",
    prompt: (caso, extra) => `Redactá una ACCIÓN REIVINDICATORIA completa ante la Justicia Provincial de San Luis (arts. 2252 y ss. CCCN, CPCC San Luis).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nInmueble a reivindicar, poseedor demandado y situación registral: ${extra}` : ""}

El actor debe acreditar ser titular del dominio (título) y que el demandado posee sin derecho.
ESTRUCTURA: 1.Encabezado 2.I.OBJETO (restitución del inmueble) 3.II.LEGITIMACIÓN ACTIVA (título de dominio) 4.III.HECHOS (desposesión, identificación catastral del inmueble) 5.IV.DERECHO (arts. 2252-2254 CCCN) 6.V.PRUEBA (escritura, informes registrales, pericia, testimonial) 7.VI.PETITORIO (restitución + daños si corresponde) 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "accion_posesoria",
    label: "Acción Posesoria",
    grupo: "Posesorios, Reales y Sucesorios",
    color: "bg-amber-200 text-amber-900",
    descripcion: "Acción posesoria por turbación o desposesión (art. 2238 CCCN)",
    prompt: (caso, extra) => `Redactá una ACCIÓN POSESORIA ante la Justicia Provincial de San Luis (arts. 2238 y ss. CCCN, CPCC San Luis).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nTipo de acción (manutención o recuperación) y hechos perturbatorios: ${extra}` : ""}

Distinguir si es acción de manutención (turbación sin desposesión) o de recuperación (desposesión consumada).
ESTRUCTURA: 1.Encabezado 2.I.OBJETO 3.II.LEGITIMACIÓN (posesión actual o anterior) 4.III.HECHOS (turbación o desposesión, fecha, autor) 5.IV.DERECHO (arts. 2238-2246 CCCN) 6.V.MEDIDA CAUTELAR (si corresponde: restitución urgente) 7.VI.PRUEBA 8.VII.PETITORIO 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "usucapion",
    label: "Usucapión / Prescripción Adquisitiva",
    grupo: "Posesorios, Reales y Sucesorios",
    color: "bg-lime-200 text-lime-900",
    descripcion: "Demanda de prescripción adquisitiva (usucapión) de inmueble",
    prompt: (caso, extra) => `Redactá una DEMANDA DE PRESCRIPCIÓN ADQUISITIVA (USUCAPIÓN) ante la Justicia Provincial de San Luis (arts. 1897-1905 CCCN).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nInmueble, años de posesión y condiciones: ${extra}` : ""}

Acreditá posesión pública, pacífica, continua e ininterrumpida por el plazo legal (20 años para la ordinaria, 10 años para la breve con justo título y buena fe).
ESTRUCTURA: 1.Encabezado 2.I.OBJETO (declaración de prescripción adquisitiva e inscripción registral) 3.II.LEGITIMACIÓN 4.III.HECHOS (descripción del inmueble, inicio de la posesión, actos posesorios, plazo) 5.IV.CONDICIONES DE LA POSESIÓN (pública, pacífica, continua) 6.V.DERECHO (arts. 1897 y ss. CCCN) 7.VI.PRUEBA (testimonial, pericial, informes municipales) 8.VII.PETITORIO (sentencia declarativa + oficio al Registro) 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "interdicto_recobrar",
    label: "Interdicto de Recobrar",
    grupo: "Posesorios, Reales y Sucesorios",
    color: "bg-orange-100 text-orange-800",
    descripcion: "Interdicto para recuperar la posesión despojada (CPCC)",
    prompt: (caso, extra) => `Redactá un INTERDICTO DE RECOBRAR LA POSESIÓN ante la Justicia Provincial de San Luis (arts. 604 y ss. CPCC San Luis).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nDespojo y circunstancias: ${extra}` : ""}

El interdicto es un proceso rápido para recuperar la posesión despojada. No discute el derecho real, solo la posesión.
ESTRUCTURA: 1.Encabezado (INTERDICTO DE RECOBRAR) 2.I.OBJETO 3.II.POSESIÓN ACTUAL O ANTERIOR (acreditación) 4.III.HECHOS DEL DESPOJO (fecha, autor, modo) 5.IV.DERECHO (arts. 604 y ss. CPCC San Luis, arts. 2238 y ss. CCCN) 6.V.MEDIDA CAUTELAR URGENTE (restitución provisional) 7.VI.PRUEBA 8.VII.PETITORIO 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "interdicto_retener",
    label: "Interdicto de Retener",
    grupo: "Posesorios, Reales y Sucesorios",
    color: "bg-yellow-200 text-yellow-900",
    descripcion: "Interdicto para hacer cesar turbaciones a la posesión",
    prompt: (caso, extra) => `Redactá un INTERDICTO DE RETENER LA POSESIÓN ante la Justicia Provincial de San Luis (CPCC San Luis).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nActos de turbación y autor: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (INTERDICTO DE RETENER) 2.I.OBJETO (cesar turbaciones) 3.II.POSESIÓN ACTUAL (acreditación) 4.III.HECHOS (actos turbatorios, fecha, autor) 5.IV.DERECHO 6.V.MEDIDA CAUTELAR (prohibición de innovar) 7.VI.PRUEBA 8.VII.PETITORIO 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "desalojo",
    label: "Demanda de Desalojo",
    grupo: "Posesorios, Reales y Sucesorios",
    color: "bg-red-100 text-red-800",
    descripcion: "Desalojo de locatario, intrusos o precario (proceso sumarísimo)",
    prompt: (caso, extra) => `Redactá una DEMANDA DE DESALOJO ante la Justicia Provincial de San Luis (CPCC San Luis, proceso sumarísimo).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nCausal de desalojo (vencimiento contrato, falta de pago, intrusión, etc.): ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (DESALOJO — PROCESO SUMARÍSIMO) 2.I.OBJETO 3.II.LEGITIMACIÓN (título del actor) 4.III.HECHOS (relación contractual o intrusión, causal de desalojo) 5.IV.DERECHO (CPCC San Luis, Ley 27.551 de alquileres o CCCN) 6.V.PRUEBA 7.VI.PETITORIO (condena a restituir + costas) 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "sucesion_intestada",
    label: "Sucesión Intestada",
    grupo: "Posesorios, Reales y Sucesorios",
    color: "bg-violet-100 text-violet-800",
    descripcion: "Apertura de sucesión sin testamento ante Juzgado provincial",
    prompt: (caso, extra) => `Redactá un escrito de APERTURA DE SUCESIÓN INTESTADA ante la Justicia Provincial de San Luis (arts. 2277 y ss. CCCN).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nCausante, herederos y bienes del acervo: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (SUCESIÓN AB INTESTATO — APERTURA) 2.I.OBJETO 3.II.DATOS DEL CAUSANTE (nombre, DNI, fecha y lugar de fallecimiento, último domicilio) 4.III.HEREDEROS DENUNCIADOS (nombre, DNI, vínculo con el causante) 5.IV.BIENES DENUNCIADOS (inmuebles, vehículos, cuentas bancarias, otros) 6.V.DERECHO (arts. 2277, 2336 y ss. CCCN) 7.VI.PETITORIO (apertura del proceso, declaratoria de herederos, inscripción de bienes) 8.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "sucesion_testamentaria",
    label: "Sucesión Testamentaria",
    grupo: "Posesorios, Reales y Sucesorios",
    color: "bg-purple-100 text-purple-800",
    descripcion: "Apertura de sucesión con testamento y protocolización",
    prompt: (caso, extra) => `Redactá un escrito de APERTURA DE SUCESIÓN TESTAMENTARIA ante la Justicia Provincial de San Luis (arts. 2277 y ss. CCCN).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nCausante, tipo de testamento, legatarios y bienes: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado (SUCESIÓN TESTAMENTARIA — APERTURA) 2.I.OBJETO 3.II.DATOS DEL CAUSANTE 4.III.TESTAMENTO (tipo: ológrafo/notarial/cerrado, fecha, contenido resumido) 5.IV.HEREDEROS Y LEGATARIOS DESIGNADOS 6.V.BIENES DEL ACERVO 7.VI.DERECHO (arts. 2462 y ss. CCCN) 8.VII.PETITORIO (apertura, protocolización/verificación del testamento, declaratoria) 9.Firma
Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "particion_herencia",
    label: "Partición de Herencia",
    grupo: "Posesorios, Reales y Sucesorios",
    color: "bg-indigo-200 text-indigo-900",
    descripcion: "Demanda de partición judicial del acervo hereditario",
    prompt: (caso, extra) => `Redactá una DEMANDA DE PARTICIÓN DE HERENCIA ante la Justicia Provincial de San Luis (arts. 2363 y ss. CCCN).

${MARCO_NORMATIVO}
${datosBase(caso)}
${extra ? `\nBienes a partir, coherederos y cuotas: ${extra}` : ""}

ESTRUCTURA: 1.Encabezado 2.I.OBJETO (partición judicial) 3.II.LEGITIMACIÓN (calidad de heredero declarado) 4.III.BIENES DE LA MASA HEREDITARIA (descripción, valuación aproximada) 5.IV.CUOTAS HEREDITARIAS (porcentaje de cada heredero) 6.V.DERECHO (arts. 2363-2402 CCCN) 7.VI.PRUEBA (declaratoria, inventario, avalúo) 8.VII.PETITORIO (designación de partidor, adjudicación de bienes) 9.Firma
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
  { label: "Posesorios, Reales y Sucesorios", modelos: posesoriasYSucesorios },
  { label: "Administrativos Provinciales", modelos: administrativosProvinciales },
  { label: "Administrativos Nacionales / Federales", modelos: administrativosNacionales },
  { label: "Extrajudiciales", modelos: extrajudiciales },
];

export const TODOS_MODELOS = [
  ...judicialesProvinciales,
  ...judicialesNacionales,
  ...posesoriasYSucesorios,
  ...administrativosProvinciales,
  ...administrativosNacionales,
  ...extrajudiciales,
];
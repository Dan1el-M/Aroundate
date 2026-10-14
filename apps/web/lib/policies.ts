export const policyVersion = "2026-10-14";
export const policies: Record<
  string,
  {
    title: [string, string];
    sections: { heading: [string, string]; text: [string, string] }[];
  }
> = {
  privacy: {
    title: ["Política de privacidad", "Privacy policy"],
    sections: [
      {
        heading: ["Quién controla los datos", "Who controls the data"],
        text: [
          "La identidad legal y el contacto del responsable deben completarse y verificarse antes de publicar el servicio. Esta es una demo local sin un responsable de producción declarado.",
          "Controller legal identity and contact must be completed and verified before public release. This is a local demo without a declared production controller.",
        ],
      },
      {
        heading: ["Datos y finalidades", "Data and purposes"],
        text: [
          "La búsqueda usa la consulta y el centro elegidos para responder. Tus coordenadas no se guardan por defecto. La cuenta demo contiene un identificador aleatorio, lugares y filtros que tú guardas; se conserva en memoria hasta reiniciar. No recogemos fecha de nacimiento ni preferencias románticas.",
          "Search uses your query and selected center to respond. Coordinates are not saved by default. A demo account holds a random identifier and the places/filters you save, in memory until restart. We do not collect birth dates or romantic preferences.",
        ],
      },
      {
        heading: [
          "Bases, consentimiento y terceros",
          "Bases, consent and third parties",
        ],
        text: [
          "La base legal para cada operación debe aprobarse con asesoría jurídica. Guardamos decisiones independientes por finalidad y versión. Google, Instagram, TikTok, marketing y analítica están desactivados. No vendemos datos ni cargamos seguimiento entre sitios. Los proveedores y transferencias internacionales requerirán inventario, acuerdos y salvaguardas antes de habilitarse.",
          "Counsel must approve the legal basis of each operation. Independent purpose/version choices are recorded. Google, Instagram, TikTok, marketing and analytics are disabled. We do not sell data or load cross-site tracking. Providers and international transfers require inventory, agreements and safeguards before activation.",
        ],
      },
      {
        heading: ["Conservación y seguridad", "Retention and security"],
        text: [
          "Los datos del sandbox son volátiles. La preferencia de privacidad y idioma dura hasta 180 días; la sesión tiene un máximo de 12 horas e inactividad de 30 minutos. La producción requerirá cifrado, eliminación automática y retención aprobada de consentimientos, registros y respaldos.",
          "Sandbox data is volatile. Privacy and language preferences last up to 180 days; sessions have a 12-hour maximum and 30-minute idle limit. Production requires encryption, automated erasure and approved retention of consent, logs and backups.",
        ],
      },
      {
        heading: ["Tus derechos y reclamaciones", "Your rights and complaints"],
        text: [
          "Puedes acceder, rectificar, exportar, solicitar borrado o restricción, oponerte y retirar consentimientos. Mis planes ofrece exportación demo y registro de solicitudes pendientes; el flujo completo con procesadores está pendiente. La ruta de reclamación ante PRODHAB o la autoridad europea aplicable y el contacto deben verificarse jurídicamente antes del lanzamiento.",
          "You can access, rectify, export, request erasure/restriction, object and withdraw consent. My plans offers demo export and pending request recording; the full processor workflow is pending. PRODHAB or applicable EU complaint routes and contacts must be legally verified before release.",
        ],
      },
      {
        heading: ["Ordenamiento y edad", "Ranking and age"],
        text: [
          "Las prioridades que eliges ordenan lugares, no crean perfiles sobre tu vida personal. Compara un conjunto limitado de resultados con datos faltantes explícitos. La política propuesta es 18 años o más, con autodeclaración en cuenta y sin publicidad conductual a menores. Versión inicial: 14 de octubre de 2026.",
          "Your priorities order places, not profiles of your private life. Ranking compares a bounded result set with explicit missing facts. Proposed policy is adults 18+, with account self-attestation and no behavioral advertising to minors. Initial version: October 14, 2026.",
        ],
      },
    ],
  },
  cookies: {
    title: ["Cookies y almacenamiento", "Cookies and storage"],
    sections: [
      {
        heading: ["Solo lo necesario por defecto", "Necessary by default"],
        text: [
          "aroundate_proof: prueba de preferencias anónima firmada, hasta 180 días, necesaria. aroundate_csrf: protección de formularios, hasta 180 días, necesaria. aroundate_session: sesión opaca HttpOnly, 12 horas, necesaria. aroundate_language: idioma elegido, 180 días, necesaria. En HTTPS de producción se usa el prefijo __Host- para prueba, CSRF y sesión. Next.js puede añadir almacenamiento necesario de desarrollo; la auditoría automatizada registra el inventario observado, no promete el estado de producción.",
          "aroundate_proof: signed anonymous preference proof, up to 180 days, necessary. aroundate_csrf: form protection, up to 180 days, necessary. aroundate_session: opaque HttpOnly session, 12 hours, necessary. aroundate_language: selected language, 180 days, necessary. Production HTTPS uses __Host- for proof, CSRF and session. Next.js may add necessary development storage; the automated audit records the observed inventory, not a production claim.",
        ],
      },
      {
        heading: ["Tu elección puede cambiar", "You can change your choice"],
        text: [
          "Rechazar y aceptar tienen la misma prominencia. Abre Cambiar privacidad desde cualquier página. No hay analítica, anuncios ni sesión grabada. Respetamos GPC y DNT para analítica y marketing.",
          "Reject and accept are equally prominent. Open Change privacy choices from any page. No analytics, ads or session replay. GPC and DNT disable analytics and marketing.",
        ],
      },
    ],
  },
  terms: {
    title: ["Términos de uso", "Terms of use"],
    sections: [
      {
        heading: ["Servicio y partes", "Service and parties"],
        text: [
          "Aroundate es una demostración de descubrimiento de lugares para mayores de 18 años. La identidad legal de las partes debe completarse antes del lanzamiento. Los lugares, precios y puntuaciones del sandbox son ficticios. No ofrecemos reservas, compras ni garantías de disponibilidad.",
          "Aroundate is a discovery demo for adults 18+. Legal party identity must be completed before release. Sandbox places, prices and ratings are fictional. No reservations, purchases or availability guarantees.",
        ],
      },
      {
        heading: ["Uso y contenido", "Use and content"],
        text: [
          "No abuses del servicio, no suplantes identidades ni publiques contenido ilícito. El contenido propio requiere derechos, licencia explícita y moderación con aviso y apelación; esta capacidad todavía no está habilitada. Las reseñas negativas legítimas no pueden ocultarse por su valoración.",
          "Do not abuse the service, impersonate people or submit unlawful content. User content requires rights, an explicit license and moderation with notice/appeal; this capability is not enabled yet. Legitimate negative reviews cannot be hidden because of their rating.",
        ],
      },
      {
        heading: ["Datos externos y derechos", "External data and rights"],
        text: [
          "Las integraciones futuras usarán únicamente APIs oficiales y sus atribuciones. Los datos pueden ser incompletos o cambiar. La propiedad intelectual, límites de responsabilidad permitidos, terminación, ley aplicable, jurisdicción y resolución de controversias requieren revisión legal. La aceptación de términos es independiente del consentimiento opcional. Versión inicial 2026-10-14; cambios materiales se comunicarán antes de exigir nueva aceptación.",
          "Future integrations use official APIs and required attribution only. Data may be incomplete or change. IP, lawful liability limits, termination, governing law, jurisdiction and disputes require counsel review. Terms acceptance is separate from optional consent. Initial version 2026-10-14; material changes will be notified before renewed acceptance.",
        ],
      },
    ],
  },
  refunds: {
    title: ["Reembolsos y cancelación", "Refunds and cancellation"],
    sections: [
      {
        heading: ["No hay funciones de pago", "No paid features"],
        text: [
          "Esta versión no vende funciones ni suscripciones. La bandera de pago está desactivada. Antes de habilitar compras se revisarán las condiciones de cancelación sencilla, plazos, renovaciones, impuestos, cargos y derechos obligatorios del consumidor.",
          "This version sells no features or subscriptions. The paid feature flag is off. Before purchases are enabled, simple cancellation, deadlines, renewals, taxes/fees and mandatory consumer rights will be reviewed.",
        ],
      },
    ],
  },
  accessibility: {
    title: ["Declaración de accesibilidad", "Accessibility statement"],
    sections: [
      {
        heading: ["Nuestro objetivo", "Our target"],
        text: [
          "Objetivo WCAG 2.2 AA. La demo usa controles semánticos, navegación por teclado, flechas para reordenar, alternativa textual al mapa y preferencias de movimiento reducido. No se declara conformidad auditada: pruebas manuales NVDA, VoiceOver, TalkBack y usuarios reales están pendientes.",
          "Target WCAG 2.2 AA. The demo uses semantic controls, keyboard navigation, reorder arrows, a text map alternative and reduced-motion support. No audited conformance is claimed: manual NVDA, VoiceOver, TalkBack and real-user tests are pending.",
        ],
      },
      {
        heading: ["Limitaciones y ayuda", "Limitations and help"],
        text: [
          "Los mapas y videos externos están desactivados. Para reportar una barrera usa Contacto con la finalidad Accesibilidad; el canal de producción debe completarse antes del lanzamiento. Fecha del borrador: 2026-10-14.",
          "External maps and videos are disabled. Report a barrier using Contact with topic Accessibility; the production contact must be completed before release. Draft date: 2026-10-14.",
        ],
      },
    ],
  },
  "business-information": {
    title: ["Información del responsable", "Business information"],
    sections: [
      {
        heading: ["Pendiente de verificación", "Pending verification"],
        text: [
          "Nombre legal, número tributario o registro, dirección física, correo, teléfono y registros regulatorios: pendientes de proporcionar y verificar. No se sustituirán por datos inventados. La falta de esta información bloquea el lanzamiento público.",
          "Legal name, tax/registration number, physical address, email, phone and regulatory registrations: awaiting verified information. Invented details will not substitute for them. Missing information blocks public launch.",
        ],
      },
    ],
  },
};

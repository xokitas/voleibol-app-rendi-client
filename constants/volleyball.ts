export const SUBACTIONS_METADATA: Record<string, { name: string; description: string; criteria: Record<string, string> }> = {
  // --- SERVICIO ---
  BAJ: { 
    name: 'Servicio Bajo', 
    description: 'Saque realizado golpeando el balón desde abajo.',
    criteria: {
      '4': 'Punto: pica directo o el defensor imposibilita la jugada.',
      '3': 'Positivo: recibo directo a tu campo o impide contraataque.',
      '2': 'Dificulta: obliga a desplazamientos y limita al atacador.',
      '1': 'Fácil: el recibo va con facilidad al pasador o atacante.',
      '0': 'Error: Saque perdido por cualquier motivo reglamentario.'
    } 
  },
  FLO: { 
    name: 'Servicio Flotante', 
    description: 'Saque sin rotación con movimiento impredecible.',
    criteria: {
      '4': 'Punto: pica directo o el defensor imposibilita la jugada.',
      '3': 'Positivo: recibo directo a tu campo o impide contraataque.',
      '2': 'Dificulta: obliga a desplazamientos y limita al atacador.',
      '1': 'Fácil: el recibo va con facilidad al pasador o atacante.',
      '0': 'Error: Saque perdido por cualquier motivo reglamentario.'
    } 
  },
  SAL: { 
    name: 'Servicio Salto Fuerte', 
    description: 'Saque de potencia ejecutado en suspensión.',
    criteria: {
      '4': 'Punto: pica directo o el defensor imposibilita la jugada.',
      '3': 'Positivo: recibo directo a tu campo o impide contraataque.',
      '2': 'Dificulta: obliga a desplazamientos y limita al atacador.',
      '1': 'Fácil: el recibo va con facilidad al pasador o atacante.',
      '0': 'Error: Saque perdido por cualquier motivo reglamentario.'
    } 
  },
  SAF: { 
    name: 'Salto Flotante', 
    description: 'Saque flotante ejecutado en suspensión.',
    criteria: {
      '4': 'Punto: pica directo o el defensor imposibilita la jugada.',
      '3': 'Positivo: recibo directo a tu campo o impide contraataque.',
      '2': 'Dificulta: obliga a desplazamientos y limita al atacador.',
      '1': 'Fácil: el recibo va con facilidad al pasador o atacante.',
      '0': 'Error: Saque perdido por cualquier motivo reglamentario.'
    } 
  },

  // --- RECEPCIÓN ---
  '2ma': { 
    name: 'Recepción 2 Manos', 
    description: 'Defensa del saque con antebrazos.',
    criteria: {
      '3': 'Excelente: permite todas las opciones técnico-tácticas.',
      '2': 'Buena: se puede pasar pero con limitaciones tácticas.',
      '1': 'Mala: entrega directa al rival o sin opción de ataque.',
      '0': 'Error: Balón pica o no permite un segundo toque.'
    } 
  },
  Ppm: { 
    name: 'Pase por Mano', 
    description: 'Recepción en forma de pirámide (puño/mano).',
    criteria: {
      '3': 'Excelente: permite todas las opciones técnico-tácticas.',
      '2': 'Buena: se puede pasar pero con limitaciones tácticas.',
      '1': 'Mala: entrega directa al rival o sin opción de ataque.',
      '0': 'Error: Balón pica o no permite un segundo toque.'
    } 
  },

  // --- ACOMODADA ---
  P2a: { 
    name: 'Pase 2 Manos Arriba', 
    description: 'Colocación estándar con dedos.',
    criteria: {
      '3': 'Perfecto: inmejorable, desorganiza al bloqueador.',
      '2': 'Bueno: permite atacar con limitaciones para el jugador.',
      '1': 'Forzado: con gran riesgo o pase vendido al contrario.',
      '0': 'Error: Falta técnica, pase bloqueado o inatacable.'
    } 
  },
  P2b: { 
    name: 'Pase 2 Manos Abajo', 
    description: 'Colocación de emergencia con antebrazos.',
    criteria: {
      '3': 'Perfecto: inmejorable, desorganiza al bloqueador.',
      '2': 'Bueno: permite atacar con limitaciones para el jugador.',
      '1': 'Forzado: con gran riesgo o pase vendido al contrario.',
      '0': 'Error: Falta técnica, pase bloqueado o inatacable.'
    } 
  },

  // --- ATAQUE ---
  Rm: { 
    name: 'Remate muy fuerte', 
    description: 'Ataque de máxima potencia.',
    criteria: {
      '4': 'Punto: pica directo, block-out o falta en red rival.',
      '3': 'Positivo: defensa rival no contraataca y entrega.',
      '2': 'Rechazado: rebota en bloqueo y permite repetir ataque.',
      '1': 'Fácil: permite contraataque rival con todas sus opciones.',
      '0': 'Error: Fuera, red, invadir o remate contra bloqueo al suelo.'
    } 
  },
  Rca: { 
    name: 'Remate Colocado', 
    description: 'Ataque a área descubierta.',
    criteria: {
      '4': 'Punto: pica en área libre sin reacción defensiva.'
    } 
  },
  Ub: { 
    name: 'Uso de Bloqueo', 
    description: 'Buscar manos del rival para que salga fuera.',
    criteria: {
      '4': 'Punto: toca el bloque y sale fuera o imposibilita arreglo.'
    } 
  },
  Tr: { 
    name: 'Tiros / Nudillos', 
    description: 'Remates colocados o de nudillo.',
    criteria: {
      '4': 'Punto: pica directo o el defensor no puede arreglar.',
      '3': 'Positivo: defensa rival no contraataca y entrega.',
      '2': 'Rechazado: rebota en bloqueo y permite repetir ataque.',
      '1': 'Fácil: permite contraataque rival con todas sus opciones.',
      '0': 'Error: Fuera, red, invadir o bloqueado al suelo propio.'
    } 
  },
  Acd: { 
    name: 'Acomodada Directa', 
    description: 'Ataque sorpresivo del pasador.',
    criteria: {
      '4': 'Punto: pica directo o imposibilita la defensa rival.'
    } 
  },
  Rdjn: { 
    name: 'Defensa Directa Punto', 
    description: 'Defensa que cruza y gana el punto.',
    criteria: {
      '4': 'Punto: cruza, hay contacto rival pero no regresa el balón.'
    } 
  },
  Rdpmp: { 
    name: 'Remate Defensa Punto', 
    description: 'Defensa enviada directa y premeditada a cancha contraria para ganar el punto.',
    criteria: {
      '4': 'Punto: El balón pica directo, el rival no tiene arreglo tras toque o comete red.'
    } 
},
  Rd: { 
    name: 'Recepción Directa', 
    description: 'Recibo que cae directo en zona libre rival.',
    criteria: {
      '4': 'Punto: pica directamente donde no hay jugadores.'
    } 
  },

  // --- BLOQUEO ---
  Bl: { 
    name: 'Bloqueo Línea', 
    description: 'Cierre del carril paralelo.',
    criteria: {
      '4': 'Punto: pica en campo contrario (directo o tras defensa).',
      '3': 'Excelente: facilita el contraataque propio con opciones.',
      '2': 'Bueno: regresa a campo rival e impide su contraataque.',
      '1': 'Regular: roza el balón pero obliga a una entrega propia.',
      '0': 'Error: Falta técnica o invasión.'
    } 
  },
  Bd: { 
    name: 'Bloqueo Diagonal', 
    description: 'Cierre del tiro cruzado.',
    criteria: {
      '4': 'Punto: pica en campo contrario (directo o tras defensa).',
      '3': 'Excelente: facilita el contraataque propio con opciones.',
      '2': 'Bueno: regresa a campo rival e impide su contraataque.',
      '1': 'Regular: roza el balón pero obliga a una entrega propia.',
      '0': 'Error: Falta técnica o invasión.'
    } 
  },
  Bn: { 
    name: 'No Bloqueo', 
    description: 'Bajar a cubrir área de defensa.',
    criteria: {
      '3': 'Éxito: facilita el contraataque a favor tras bajar.',
      '1': 'Regular: hace contacto pero solo permite una entrega.',
      '0': 'Fallo: no bloquea pudiendo hacerlo (responsabilidad suya).'
    } 
  },

  // --- DEFENSA ---
  Dd: { 
    name: 'Diagonal desafiante', 
    description: 'Defensa ante remate potente.',
    criteria: {
      '3': 'Éxito: permite pase con todas las posibilidades tácticas.',
      '2': 'Bueno: permite pase pero con limitaciones técnicas.',
      '1': 'Mala: imposible atacar, resulta en entrega al rival.',
      '0': 'Error: Balón pica o no permite el segundo toque.'
    } 
  },
  Dltd: { 
    name: 'Hacia la línea', 
    description: 'Llegar a tiros o dejadas al final.',
    criteria: {
      '3': 'Éxito: permite pase con todas las posibilidades tácticas.',
      '2': 'Bueno: permite pase pero con limitaciones técnicas.',
      '1': 'Mala: imposible atacar, resulta en entrega al rival.',
      '0': 'Error: Balón pica o no permite el segundo toque.'
    } 
  },
  Ld: { 
    name: 'Línea a Diagonal', 
    description: 'Carrera defensiva de línea a centro.',
    criteria: {
      '3': 'Éxito: permite pase con todas las posibilidades tácticas.',
      '2': 'Bueno: permite pase pero con limitaciones técnicas.',
      '1': 'Mala: imposible atacar, resulta en entrega al rival.',
      '0': 'Error: Balón pica o no permite el segundo toque.'
    } 
  },
  Cc: { 
    name: 'Esperar en Centro', 
    description: 'Lectura final en el eje de cancha.',
    criteria: {
      '3': 'Éxito: permite pase con todas las posibilidades tácticas.',
      '2': 'Bueno: permite pase pero con limitaciones técnicas.',
      '1': 'Mala: imposible atacar, resulta en entrega al rival.',
      '0': 'Error: Balón pica o no permite el segundo toque.'
    } 
  },

  // --- ERRORES NO FORZADOS ---
  SFC: { 
    name: 'Saque Fuera', 
    description: 'Error en servicio.',
    criteria: { '0': 'Enviar el balón más allá de las cintas de límite.' } 
  },
  SR: { 
    name: 'Saque a la Red', 
    description: 'Error en servicio.',
    criteria: { '0': 'El balón no supera la altura mínima.' } 
  },
  SME: { 
    name: 'Saque Mal Ejecutado', 
    description: 'Fallo técnico.',
    criteria: { '0': 'Pasos indebidos o lanzamiento incorrecto.' } 
  },
  NAT: { 
    name: 'No Avisar', 
    description: 'Error comunicación.',
    criteria: { '0': 'Provoca choques o balones que caen sin defensa.' } 
  },
  CJR: { 
    name: 'Confusión Jugada', 
    description: 'Fallo en rapidez.',
    criteria: { '0': 'Especialmente en recepciones y coberturas.' } 
  },
  MCA: { 
    name: 'Mala Colocación Arena', 
    description: 'Fallo posición.',
    criteria: { '0': 'Transición biomecánica incorrecta o lentitud.' } 
  },
  JFZ: { 
    name: 'Jugador Fuera Zona', 
    description: 'Falta posición.',
    criteria: { '0': 'Colocado fuera de zona permitida en el saque.' } 
  },
  CI: { 
    name: 'Cobertura Incompleta', 
    description: 'Fallo táctico.',
    criteria: { '0': 'Dejar espacios libres que el rival aprovecha.' } 
  },
  MC: { 
    name: 'Mala Colocación', 
    description: 'Fallo táctico.',
    criteria: { '0': 'Impide la ejecución de la defensa o cobertura.' } 
  },
  GMD: { 
    name: 'Golpes Mal Dirigidos', 
    description: 'Fallo técnico.',
    criteria: { '0': 'Balones fuera sin contacto con el rival.' } 
  },
  TI: { 
    name: 'Toques Ilegales', 
    description: 'Falta técnica.',
    criteria: { '0': 'Doble golpe o retención (acarreo) del balón.' } 
  },
  MER: { 
    name: 'Mala Ejecución Remate', 
    description: 'Fallo ataque.',
    criteria: { '0': 'Fallar al atacar sin presión de bloqueo rival.' } 
  },
  BTR: { 
    name: 'Balón Toca Red', 
    description: 'Fallo técnico.',
    criteria: { '0': 'El balón toca la red y cae en campo propio.' } 
  }
};
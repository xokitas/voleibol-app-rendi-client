/**
 * Diccionario de Errores No Forzados y Subacciones Técnicas.
 * Centralizamos esto para que la UI y la lógica usen los mismos términos.
 */
export const VOLLEYBALL_CONSTANTS = {
  ERRORES_NO_FORZADOS: {
    ENS: { label: 'Servicio', subs: ['SFC', 'SR', 'SME'] },
    ENC: { label: 'Comunicación', subs: ['NAT', 'CJR'] },
    ENP: { label: 'Posicionamiento', subs: ['MCA', 'JFZ', 'CI', 'MC'] },
    ENTG: { label: 'Técnico/Golpeo', subs: ['GMD', 'TI', 'MER', 'BTR'] },
  },
  ZONAS_CANCHA: ['DI', 'DC', 'DD', 'TI', 'TC', 'TD'],
  VIENTO_ESTADOS: ['A FAVOR', 'EN CONTRA', 'LATERAL', 'CALMA']
};

/**
 * Metadata detallada para la leyenda (LegendPanel).
 * Criterios generales: 0 (Error), 1 (Pasa fácil), 2 (Dificulta), 3 (Punto directo).
 */
export const SUBACTIONS_METADATA: Record<string, { name: string; criteria: string }> = {
  // SERVICIO
  BAJ: { name: 'Servicio Bajo', criteria: '0 (Error), 1 (Pasa fácil), 2 (Dificulta), 3 (Punto directo)' },
  FLO: { name: 'Servicio Flotante', criteria: '0 (Error), 1 (Pasa fácil), 2 (Dificulta), 3 (Punto directo)' },
  SAL: { name: 'Servicio de Salto', criteria: '0 (Error), 1 (Pasa fácil), 2 (Dificulta), 3 (Punto directo)' },
  SAF: { name: 'Salto Flotante', criteria: '0 (Error), 1 (Pasa fácil), 2 (Dificulta), 3 (Punto directo)' },
  SFC: { name: 'Servicio Fuera/Campo', criteria: 'Error directo en el saque' },
  SR: { name: 'Servicio a la Red', criteria: 'Balón no supera la malla' },
  SME: { name: 'Servicio Mal Ejecutado', criteria: 'Fallo técnico en el golpeo' },

  // RECEPCIÓN
  '2ma': { name: 'Recepcion 2 Manos', criteria: '0 (Error), 1 (Mala), 2 (Buena), 3 (Excelente)' },
  Ppm: { name: 'Pase por Mano', criteria: '0 (Error), 1 (Mala), 2 (Buena), 3 (Excelente)' },

  // ACOMODADA (COLOCACIÓN)
  P2a: { name: 'Pase 2da Ataque', criteria: '0 (Error), 1 (Dificulta), 2 (Buena), 3 (Perfecta)' },
  P2b: { name: 'Pase 2da Bloqueo', criteria: '0 (Error), 1 (Dificulta), 2 (Buena), 3 (Perfecta)' },

  // ATAQUE
  RM: { name: 'Remate', criteria: '0 (Error), 1 (Pasa fácil), 2 (Dificulta), 3 (Punto directo)' },
  Rm: { name: 'Remate', criteria: '0 (Error), 1 (Pasa fácil), 2 (Dificulta), 3 (Punto directo)' },
  Rca: { name: 'Remate de Cajón', criteria: '0 (Error), 1 (Pasa fácil), 2 (Dificulta), 3 (Punto directo)' },
  Ub: { name: 'Ubicado', criteria: '0 (Error), 1 (Fácil), 2 (Dificultad), 3 (Punto)' },
  Tr: { name: 'Trallazo', criteria: '0 (Error), 1 (Defendido), 2 (Dificulta), 3 (Punto)' },
  Acd: { name: 'Acondicionado', criteria: '0 (Error), 1 (Fácil), 2 (Dificultad), 3 (Punto)' },
  Rdjn: { name: 'Remate Dejada', criteria: '0 (Error), 1 (Fácil), 2 (Dificultad), 3 (Punto)' },
  Rd: { name: 'Remate Directo', criteria: '0 (Error), 1 (Fácil), 2 (Dificultad), 3 (Punto)' },

  // BLOQUEO
  Bl: { name: 'Bloqueo', criteria: '0 (Error), 1 (Toca/Pasa), 2 (Amortigua), 3 (Punto)' },
  Bd: { name: 'Bloqueo Defensivo', criteria: '0 (Error), 1 (Toca), 2 (Rebota favorable), 3 (Punto)' },
  Bn: { name: 'Bloqueo Nulo', criteria: 'Acción de bloqueo sin contacto efectivo' },

  // DEFENSA
  Dd: { name: 'Defensa de Dedos', criteria: '0 (Error), 1 (Mala), 2 (Buena), 3 (Excelente)' },
  Dltd: { name: 'Defensa Lateral', criteria: '0 (Error), 1 (Mala), 2 (Buena), 3 (Excelente)' },
  Ld: { name: 'Lanzamiento/Defensa', criteria: '0 (Error), 1 (Mala), 2 (Buena), 3 (Excelente)' },
  Cc: { name: 'Centro Corto', criteria: '0 (Error), 1 (Mala), 2 (Buena), 3 (Excelente)' },

  // ERRORES
  Ens: { name: 'Error en Saque', criteria: 'Fallo directo en el inicio del rally' },
  Enr: { name: 'Error en Recepción', criteria: 'Fallo al recibir el servicio' },
  Enp: { name: 'Error de Posición', criteria: 'Falta de rotación o ubicación' },
  Enm: { name: 'Error en Malla', criteria: 'Contacto con la red o invasión' },
};

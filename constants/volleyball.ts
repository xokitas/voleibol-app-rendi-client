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
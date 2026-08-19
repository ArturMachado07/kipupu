/**
 * Utilitários de geolocalização — usados no Processo 2, Passo 3
 * ("Localizar Estação": sugerir automaticamente a estação mais próxima
 * com base na localização do cliente).
 */

export type Coordenada = { latitude: number; longitude: number };

const RAIO_TERRA_KM = 6371;

function paraRadianos(graus: number): number {
  return (graus * Math.PI) / 180;
}

/** Distância em quilómetros entre dois pontos, pela fórmula de Haversine. */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const dLat = paraRadianos(b.latitude - a.latitude);
  const dLng = paraRadianos(b.longitude - a.longitude);

  const lat1 = paraRadianos(a.latitude);
  const lat2 = paraRadianos(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return RAIO_TERRA_KM * c;
}

/** Ordena uma lista de estações pela distância a partir da posição do cliente. */
export function ordenarPorProximidade<T extends Coordenada>(
  origem: Coordenada,
  pontos: T[]
): (T & { distanciaKm: number })[] {
  return pontos
    .map((ponto) => ({ ...ponto, distanciaKm: distanciaKm(origem, ponto) }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}

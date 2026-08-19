"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Import direto do CSS do Leaflet aqui (em vez de só em globals.css): garante
// que a folha de estilos carrega sempre antes de qualquer coisa depender dela
// (sem isto, `.leaflet-marker-icon` fica sem `position: absolute` e os pins
// deixam de aparecer, mesmo que os tiles do mapa apareçam normalmente).
import "leaflet/dist/leaflet.css";

export type MarcadorMapa = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  distanciaKm?: number;
};

// Pin no formato da marca (K + localização), desenhado inline em SVG — sem depender de assets externos.
const pinSvg = (cor: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="${cor}"/>
    <circle cx="17" cy="17" r="7" fill="#FFFFFF"/>
  </svg>`;

function iconeKipupu(destaque = false) {
  return L.divIcon({
    html: pinSvg(destaque ? "#27FFF7" : "#003A5D"),
    className: "kipupu-marker-icon",
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
  });
}

function AjustarVista({ centro, zoom }: { centro: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    // invalidateSize() força o Leaflet a recalcular as dimensões do
    // contentor — necessário porque o mapa é montado dinamicamente (dentro
    // de um passo do wizard / de um dynamic import com ssr:false) e pode
    // inicializar antes do layout do contentor estabilizar, o que desalinha
    // a posição dos marcadores mesmo que os tiles pareçam corretos.
    map.invalidateSize();
    map.flyTo(centro, zoom, { duration: 0.6 });
  }, [centro, zoom, map]);
  return null;
}

export function MapaLuanda({
  centro,
  zoom = 13,
  marcadores,
  marcadorSelecionadoId,
  onSelecionar,
}: {
  centro: [number, number];
  zoom?: number;
  marcadores: MarcadorMapa[];
  marcadorSelecionadoId?: string;
  onSelecionar?: (marcador: MarcadorMapa) => void;
}) {
  return (
    <MapContainer
      center={centro}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: 16 }}
    >
      <AjustarVista centro={centro} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {marcadores.map((m) => (
        <Marker
          key={m.id}
          position={[m.latitude, m.longitude]}
          icon={iconeKipupu(m.id === marcadorSelecionadoId)}
          eventHandlers={{
            click: () => onSelecionar?.(m),
          }}
        >
          <Popup>
            <strong>{m.nome}</strong>
            {typeof m.distanciaKm === "number" && (
              <div>{m.distanciaKm.toFixed(1)} km de distância</div>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

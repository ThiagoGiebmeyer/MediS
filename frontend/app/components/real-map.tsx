import { Totem } from "@/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { renderToString } from "react-dom/server";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export function createLucideIcon(size = 36) {
  const svg = renderToString(
    <MapPin size={size} strokeWidth={2} className="text-primary-dark" />
  );

  return L.divIcon({
    className: "",
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export default function RealMap({
  totems,
}: {
  totems: Array<Totem>;
}) {
  const firstLat = Number(totems[0]?.latitude ?? 0);
  const firstLng = Number(totems[0]?.longitude ?? 0);

  return (
    <MapContainer
      center={[firstLat, firstLng]}
      zoom={5}
      className="z-0 rounded-md w-full h-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {totems.map((t) => (
        <Marker
          key={t._id}
          position={[Number(t.latitude), Number(t.longitude)]}
          icon={createLucideIcon(38)}
        >
          <Popup>
            <b>{t.nome}</b>
            <br />
            {t.latitude}, {t.longitude}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

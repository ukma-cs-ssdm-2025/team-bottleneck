import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const ParkingMap = ({ parkingLots }) => {
  const lotsWithCoordinates = parkingLots.filter(
    (lot) => lot.latitude && lot.longitude
  );

  // Завжди центр на Києві
  const center = [50.4501, 30.5234];

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {lotsWithCoordinates.map((lot) => (
        <Marker
          key={lot.id}
          position={[parseFloat(lot.latitude), parseFloat(lot.longitude)]}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 8px 0' }}>{lot.name}</h3>
              <p style={{ margin: '4px 0' }}>
                <strong>Адреса:</strong><br />
                {lot.city}, {lot.street} {lot.building}
              </p>
              <button
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => window.location.href = `/lots/${lot.id}`}
              >
                Переглянути деталі
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ParkingMap;
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Sensor {
  id: number;
  name: string;
  ip: string;
  port: string;
  umbral: number;
  measurement?: string;
}

interface SensorCardProps {
  sensor: Sensor;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  const [measurement, setMeasurement] = useState<string>('Cargando...');

  useEffect(() => {
    const fetchMeasurement = async () => {
      try {
        const response = await axios.post('http://localhost:5000/sensor-data', {
          ip: sensor.ip,
          port: sensor.port,
        });
        if (response.data.valor) {
          setMeasurement(response.data.valor);
        } else if (response.data.error) {
          setMeasurement(`Error: ${response.data.error}`);
        } else {
          setMeasurement('Dato no disponible');
        }
      } catch (error) {
        setMeasurement('Error al obtener medición');
      }
    };

    fetchMeasurement();
  }, [sensor.ip, sensor.port]);

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 w-full h-64 relative flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <span className="text-red-800 font-semibold text-2xl">{sensor.name}</span>
        <div className="bg-white border-2 border-black rounded-full w-10 h-10 flex items-center justify-center text-red-800 font-semibold">
          {sensor.umbral}
        </div>
      </div>
      <div className="flex-grow border-2 border-black rounded-2xl p-4 mb-4 flex items-center justify-center text-red-800 font-semibold text-lg">
        {measurement}
      </div>
      <div className="text-red-800 font-semibold">
        ip: {sensor.ip}:{sensor.port}
      </div>
    </div>
  );
};

const PAGE_SIZE = 6;

const SensorGrid = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchSensors = async (page: number) => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No hay un token disponible');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:8080/sensors', {
          headers: { Authorization: `Bearer ${token}` },
          params: { page, size: PAGE_SIZE },
        });

        const fetchedSensors = response.data.content;
        setSensors(fetchedSensors);

        setHasMore(fetchedSensors.length === PAGE_SIZE);
      } catch (err) {
        console.error(err);
        setError('Error al cargar los sensores.');
      } finally {
        setLoading(false);
      }
    };

    fetchSensors(currentPage);
  }, [currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (hasMore) setCurrentPage(currentPage + 1);
  };

  if (loading) return <p>Cargando sensores...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-4 p-4">
        {sensors.map(sensor => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>

      {/* Botón Anterior - posicion absoluta a la izquierda, vertical centrado */}
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 0}
        aria-label="Página anterior"
        className={`absolute top-1/2 -left-18 transform -translate-y-1/2 p-3 rounded-full border-2 border-red-600 bg-white flex items-center justify-center shadow-md
          ${
            currentPage === 0
              ? 'border-gray-300 text-gray-300 cursor-not-allowed'
              : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition'
          }
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Botón Siguiente - posicion absoluta a la derecha, vertical centrado */}
      <button
        onClick={handleNextPage}
        disabled={!hasMore}
        aria-label="Página siguiente"
        className={`absolute top-1/2 -right-18 transform -translate-y-1/2 p-3 rounded-full border-2 border-red-600 bg-white flex items-center justify-center shadow-md
          ${
            !hasMore
              ? 'border-gray-300 text-gray-300 cursor-not-allowed'
              : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition'
          }
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default SensorGrid;

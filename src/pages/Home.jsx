import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaAmbulance, FaLocationArrow, FaPhone } from 'react-icons/fa';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Fix for Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom ambulance icon
const ambulanceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2785/2785819.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Component to recenter map when user location changes
function LocationMarker({ position, setPosition }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

const Home = () => {
  const [position, setPosition] = useState(null);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
        },
        (error) => {
          setError("Error getting your location. Please enable location services.");
          // Default position (Bihar, India)
          setPosition([25.0961, 85.3131]);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      // Default position (Bihar, India)
      setPosition([25.0961, 85.3131]);
    }
  }, []);

  // Fetch nearby ambulances from Firestore
  useEffect(() => {
    const fetchAmbulances = async () => {
      try {
        const ambulancesCollection = collection(db, 'ambulances');
        const ambulancesQuery = query(ambulancesCollection, orderBy('lastUpdated', 'desc'), limit(10));
        const querySnapshot = await getDocs(ambulancesQuery);
        
        const ambulancesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAmbulances(ambulancesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching ambulances:", error);
        setError("Failed to load ambulances. Please try again later.");
        setLoading(false);
      }
    };

    if (position) {
      fetchAmbulances();
    }
  }, [position]);

  // Calculate distance between two coordinates in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance.toFixed(1);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-red-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Emergency Ambulance Service</h1>
            <p className="text-xl mb-8">Fast, reliable medical transportation when you need it most</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-red-600 font-bold py-3 px-6 rounded-full hover:bg-red-100 transition flex items-center justify-center gap-2">
                <FaLocationArrow /> Find Nearest Ambulance
              </button>
              <button className="bg-red-700 text-white font-bold py-3 px-6 rounded-full hover:bg-red-800 transition flex items-center justify-center gap-2">
                <FaPhone /> Call Emergency (108)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6 text-center">Nearby Ambulances</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {position && (
                <div className="h-96">
                  <MapContainer 
                    center={position} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                    
                    {/* Render ambulance markers */}
                    {ambulances.map(ambulance => (
                      <Marker 
                        key={ambulance.id} 
                        position={[ambulance.location.latitude, ambulance.location.longitude]}
                        icon={ambulanceIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <div className="font-bold text-red-600 mb-1">{ambulance.vehicleNumber}</div>
                            <div className="text-sm mb-2">
                              {ambulance.type} - {ambulance.status}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {position && calculateDistance(
                                position[0], 
                                position[1], 
                                ambulance.location.latitude, 
                                ambulance.location.longitude
                              )} km away
                            </div>
                            <button className="bg-red-600 text-white text-sm py-1 px-3 rounded-full hover:bg-red-700 transition">
                              Request Now
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Available Ambulances List */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6 text-center">Available Ambulances</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ambulances.map(ambulance => (
                <div key={ambulance.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FaAmbulance className="text-red-600 text-2xl mr-2" />
                        <h3 className="font-bold">{ambulance.vehicleNumber}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ambulance.status === 'Available' ? 'bg-green-100 text-green-800' : 
                        ambulance.status === 'On Call' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {ambulance.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      <p><strong>Type:</strong> {ambulance.type}</p>
                      <p><strong>Driver:</strong> {ambulance.driverName}</p>
                      <p><strong>Distance:</strong> {position && calculateDistance(
                        position[0], 
                        position[1], 
                        ambulance.location.latitude, 
                        ambulance.location.longitude
                      )} km</p>
                    </div>
                    <button className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition flex items-center justify-center gap-2">
                      <FaPhone /> Request Ambulance
                    </button>
                  </div>
                </div>
              ))}
              
              {ambulances.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No ambulances available at the moment. Please try again later.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home; 
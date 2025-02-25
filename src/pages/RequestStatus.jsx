import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaAmbulance, FaPhoneAlt, FaMapMarkerAlt, FaUser, FaClock, FaHospital } from 'react-icons/fa';

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

// Component to recenter map when ambulance location changes
function AmbulanceMarker({ ambulance, userLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (ambulance && ambulance.location) {
      map.fitBounds([
        [userLocation.latitude, userLocation.longitude],
        [ambulance.location.latitude, ambulance.location.longitude]
      ]);
    }
  }, [ambulance, userLocation, map]);

  if (!ambulance || !ambulance.location) return null;

  return (
    <Marker 
      position={[ambulance.location.latitude, ambulance.location.longitude]}
      icon={ambulanceIcon}
    >
      <Popup>
        <div className="text-center">
          <div className="font-bold text-red-600 mb-1">{ambulance.vehicleNumber}</div>
          <div className="text-sm">
            {ambulance.driverName} - {ambulance.driverPhone}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

const RequestStatus = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        const requestRef = doc(db, 'requests', requestId);
        const requestSnap = await getDoc(requestRef);
        
        if (!requestSnap.exists()) {
          setError('Request not found');
          setLoading(false);
          return;
        }
        
        const requestData = {
          id: requestSnap.id,
          ...requestSnap.data(),
          createdAt: requestSnap.data().createdAt?.toDate() || new Date()
        };
        
        setRequest(requestData);
        
        // Fetch ambulance data
        if (requestData.ambulanceId) {
          const ambulanceRef = doc(db, 'ambulances', requestData.ambulanceId);
          const ambulanceSnap = await getDoc(ambulanceRef);
          
          if (ambulanceSnap.exists()) {
            setAmbulance({
              id: ambulanceSnap.id,
              ...ambulanceSnap.data()
            });
            
            // Calculate ETA based on distance and average speed
            if (ambulanceSnap.data().location && requestData.location) {
              const distance = calculateDistance(
                ambulanceSnap.data().location.latitude,
                ambulanceSnap.data().location.longitude,
                requestData.location.latitude,
                requestData.location.longitude
              );
              
              // Assuming average speed of 40 km/h
              const timeInMinutes = Math.round((distance / 40) * 60);
              setEta(timeInMinutes);
            }
          }
          
          // Set up real-time listener for ambulance updates
          const unsubscribe = onSnapshot(ambulanceRef, (doc) => {
            if (doc.exists()) {
              const ambulanceData = {
                id: doc.id,
                ...doc.data()
              };
              setAmbulance(ambulanceData);
              
              // Update ETA
              if (ambulanceData.location && requestData.location) {
                const distance = calculateDistance(
                  ambulanceData.location.latitude,
                  ambulanceData.location.longitude,
                  requestData.location.latitude,
                  requestData.location.longitude
                );
                
                // Assuming average speed of 40 km/h
                const timeInMinutes = Math.round((distance / 40) * 60);
                setEta(timeInMinutes);
              }
            }
          });
          
          return () => unsubscribe();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching request data:', error);
        setError('Failed to load request data');
        setLoading(false);
      }
    };
    
    fetchRequestData();
  }, [requestId]);

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
    return distance;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Accepted':
        return 'bg-blue-100 text-blue-800';
      case 'On The Way':
        return 'bg-green-100 text-green-800';
      case 'Arrived':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white p-3 rounded-full mr-4">
                <FaAmbulance className="text-red-600 text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Ambulance Request Status</h1>
                <p className="text-red-200">Request ID: #{requestId.slice(0, 8)}</p>
              </div>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request?.status)}`}>
                {request?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Map */}
        {request && request.location && (
          <div className="h-64 md:h-96">
            <MapContainer 
              center={[request.location.latitude, request.location.longitude]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* User location marker */}
              <Marker position={[request.location.latitude, request.location.longitude]}>
                <Popup>
                  <div className="text-center">
                    <div className="font-bold mb-1">Pickup Location</div>
                    <div className="text-sm">{request.pickupLocation}</div>
                  </div>
                </Popup>
              </Marker>
              
              {/* Ambulance marker */}
              {ambulance && ambulance.location && (
                <AmbulanceMarker ambulance={ambulance} userLocation={request.location} />
              )}
            </MapContainer>
          </div>
        )}
        
        {/* Request Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Request Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Request Information</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-red-600 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="font-medium">{request?.pickupLocation}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaHospital className="text-red-600 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium">{request?.destination}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaUser className="text-red-600 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Patient Information</p>
                    <p className="font-medium">
                      {request?.patientInfo?.name}, {request?.patientInfo?.age} years, {request?.patientInfo?.gender}
                    </p>
                    <p className="text-sm text-gray-600">
                      Emergency Type: {request?.patientInfo?.emergencyType}
                    </p>
                    {request?.patientInfo?.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        Notes: {request.patientInfo.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaClock className="text-red-600 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Request Time</p>
                    <p className="font-medium">
                      {request?.createdAt.toLocaleTimeString()} on {request?.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ambulance Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Ambulance Information</h2>
              {ambulance ? (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start">
                    <FaAmbulance className="text-red-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Ambulance Details</p>
                      <p className="font-medium">{ambulance.vehicleNumber}</p>
                      <p className="text-sm text-gray-600">Type: {ambulance.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaUser className="text-red-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Driver</p>
                      <p className="font-medium">{ambulance.driverName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaPhoneAlt className="text-red-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Contact</p>
                      <p className="font-medium">{ambulance.driverPhone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaClock className="text-red-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Estimated Time of Arrival</p>
                      <p className="font-medium">
                        {eta ? (
                          eta <= 1 ? 'Less than 1 minute' : `${eta} minutes`
                        ) : (
                          'Calculating...'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-yellow-700">
                    Ambulance information is being loaded or not yet assigned.
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button 
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition flex items-center justify-center"
                  onClick={() => window.location.href = `tel:${ambulance?.driverPhone || '108'}`}
                >
                  <FaPhoneAlt className="mr-2" /> Call Ambulance
                </button>
                <button 
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-300 transition flex items-center justify-center"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestStatus; 
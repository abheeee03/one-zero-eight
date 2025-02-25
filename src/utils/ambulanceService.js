import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  GeoPoint,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Get nearby ambulances based on user location
export const getNearbyAmbulances = async (latitude, longitude, radius = 10) => {
  try {
    // In a real application, you would use Firestore's geoqueries or a cloud function
    // For this demo, we'll fetch all ambulances and filter them client-side
    const ambulancesRef = collection(db, 'ambulances');
    const q = query(
      ambulancesRef,
      where('status', '==', 'Available'),
      orderBy('lastUpdated', 'desc'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    const ambulances = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter ambulances by distance (client-side)
    // In a real app, this would be done server-side with geoqueries
    const nearbyAmbulances = ambulances.filter(ambulance => {
      const distance = calculateDistance(
        latitude,
        longitude,
        ambulance.location.latitude,
        ambulance.location.longitude
      );
      
      // Add distance property to each ambulance
      ambulance.distance = distance;
      
      // Return only ambulances within the specified radius
      return distance <= radius;
    });
    
    // Sort by distance
    return nearbyAmbulances.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error getting nearby ambulances:', error);
    throw error;
  }
};

// Create a new ambulance request
export const createAmbulanceRequest = async (requestData) => {
  try {
    const { userId, ambulanceId, pickupLocation, destination, patientInfo, latitude, longitude } = requestData;
    
    const requestRef = await addDoc(collection(db, 'requests'), {
      userId,
      ambulanceId,
      pickupLocation,
      destination,
      patientInfo,
      location: new GeoPoint(latitude, longitude),
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update ambulance status to "On Call"
    const ambulanceRef = doc(db, 'ambulances', ambulanceId);
    await updateDoc(ambulanceRef, {
      status: 'On Call',
      currentRequestId: requestRef.id,
      lastUpdated: serverTimestamp()
    });
    
    return requestRef.id;
  } catch (error) {
    console.error('Error creating ambulance request:', error);
    throw error;
  }
};

// Get user's request history
export const getUserRequests = async (userId) => {
  try {
    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user requests:', error);
    throw error;
  }
};

// Calculate distance between two coordinates in km
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
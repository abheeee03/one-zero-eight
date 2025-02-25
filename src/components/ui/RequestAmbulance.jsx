import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createAmbulanceRequest } from '../../utils/ambulanceService';
import { FaAmbulance, FaMapMarkerAlt, FaUser, FaPhone, FaNotesMedical } from 'react-icons/fa';

const RequestAmbulance = ({ ambulance, userLocation }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    pickupLocation: '',
    destination: '',
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    contactNumber: '',
    emergencyType: 'Medical',
    additionalNotes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const requestData = {
        userId: currentUser.uid,
        ambulanceId: ambulance.id,
        pickupLocation: formData.pickupLocation,
        destination: formData.destination,
        patientInfo: {
          name: formData.patientName,
          age: formData.patientAge,
          gender: formData.patientGender,
          emergencyType: formData.emergencyType,
          notes: formData.additionalNotes
        },
        contactNumber: formData.contactNumber,
        latitude: userLocation[0],
        longitude: userLocation[1]
      };
      
      const requestId = await createAmbulanceRequest(requestData);
      navigate(`/request-status/${requestId}`);
    } catch (error) {
      console.error('Error requesting ambulance:', error);
      setError('Failed to request ambulance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <div className="bg-red-100 p-3 rounded-full mr-4">
          <FaAmbulance className="text-red-600 text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Request Ambulance</h2>
          <p className="text-gray-600">
            {ambulance ? `${ambulance.vehicleNumber} - ${ambulance.type}` : 'Select an ambulance'}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup Location */}
          <div>
            <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="text-gray-400" />
              </div>
              <input
                type="text"
                id="pickupLocation"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                required
                className="pl-10 focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                placeholder="Current Location"
              />
            </div>
          </div>
          
          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              Destination (Hospital)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="text-gray-400" />
              </div>
              <input
                type="text"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
                className="pl-10 focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                placeholder="Nearest Hospital"
              />
            </div>
          </div>
          
          {/* Patient Name */}
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="text"
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                required
                className="pl-10 focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                placeholder="Patient's Full Name"
              />
            </div>
          </div>
          
          {/* Contact Number */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPhone className="text-gray-400" />
              </div>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                className="pl-10 focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                placeholder="+91 XXXXXXXXXX"
              />
            </div>
          </div>
          
          {/* Patient Age */}
          <div>
            <label htmlFor="patientAge" className="block text-sm font-medium text-gray-700 mb-1">
              Patient Age
            </label>
            <input
              type="number"
              id="patientAge"
              name="patientAge"
              value={formData.patientAge}
              onChange={handleChange}
              required
              min="0"
              max="120"
              className="focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
              placeholder="Age"
            />
          </div>
          
          {/* Patient Gender */}
          <div>
            <label htmlFor="patientGender" className="block text-sm font-medium text-gray-700 mb-1">
              Patient Gender
            </label>
            <select
              id="patientGender"
              name="patientGender"
              value={formData.patientGender}
              onChange={handleChange}
              required
              className="focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Emergency Type */}
          <div className="md:col-span-2">
            <label htmlFor="emergencyType" className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaNotesMedical className="text-gray-400" />
              </div>
              <select
                id="emergencyType"
                name="emergencyType"
                value={formData.emergencyType}
                onChange={handleChange}
                required
                className="pl-10 focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
              >
                <option value="Medical">Medical Emergency</option>
                <option value="Accident">Accident/Trauma</option>
                <option value="Cardiac">Cardiac Emergency</option>
                <option value="Pregnancy">Pregnancy Related</option>
                <option value="Covid">COVID-19 Related</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          {/* Additional Notes */}
          <div className="md:col-span-2">
            <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              rows="3"
              className="focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
              placeholder="Any additional information that might help the ambulance team"
            ></textarea>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Request...
              </span>
            ) : (
              <span className="flex items-center">
                <FaAmbulance className="mr-2" /> Request Ambulance Now
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestAmbulance; 
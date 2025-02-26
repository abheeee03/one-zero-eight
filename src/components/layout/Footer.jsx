import { Link } from 'react-router-dom';
import { BiSolidAmbulance } from 'react-icons/bi';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-3">
      <div className="container mx-auto px-4 py-8">
        <Link to="/login" className='flex items-center justify-center hover:underline hover:text-green-400 gap-2 text-lg'>
        <BiSolidAmbulance /> Register your ambulance service and be part of a life-saving mission.
        </Link>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p> 108 - A Prototype by .......</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
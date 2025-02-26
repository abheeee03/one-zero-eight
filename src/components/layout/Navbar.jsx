import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FaAmbulance, FaBars, FaTimes, FaUser } from 'react-icons/fa';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="bg-red-600 text-white shadow-md p-2">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <FaAmbulance className="text-2xl" />
            <span className="text-xl font-bold">108 Ambulance</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/about" className="hover:text-red-200 transition">About</Link>
            <Link to="/contact" className="hover:text-red-200 transition">Contact</Link>
            <Link to="/login" className="flex items-center space-x-1 bg-white text-red-600 px-4 py-2 rounded-full font-medium hover:bg-red-100 transition">
            <FaAmbulance />
              <span>Are you an ambulance provider?</span>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pb-3 space-y-3">
            <Link to="/" className="block hover:text-red-200 transition py-2">Home</Link>
            <Link to="/about" className="block hover:text-red-200 transition py-2">About</Link>
            <Link to="/services" className="block hover:text-red-200 transition py-2">Services</Link>
            <Link to="/contact" className="block hover:text-red-200 transition py-2">Contact</Link>
            <Link to="/login" className="flex items-center space-x-1 bg-white text-red-600 px-4 py-2 rounded-full font-medium hover:bg-red-100 transition w-fit">
              <FaUser />
              <span>Login</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 
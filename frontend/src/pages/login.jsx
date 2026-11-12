import React, { useState } from 'react';
import { motion } from "framer-motion";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const LoginRegisterPage = () => {
  const navigate   = useNavigate();
  const { login }  = useAuth();                // from AuthContext
  const [isSignUpActive, setIsSignUpActive] = useState(false);

  const handleSignInClick  = () => setIsSignUpActive(false);
  const handleSignUpClick  = () => setIsSignUpActive(true);

  /** -------------------------------------------------
   *  Handle submit for BOTH “Sign In” and “Sign Up”
   *  ------------------------------------------------- */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data     = Object.fromEntries(formData.entries());

    /* Choose endpoint */
    const url = isSignUpActive
      ? 'http://localhost:8000/auth/signup'
      : 'http://localhost:8000/auth/login';

   try {
  console.log("🔄 Sending login/signup request to:", url);
  const res = await axios.post(url, data);
  console.log("✅ Received response:", res.data);

  const token = res.data.token;
  if (!token) throw new Error("❌ No token returned from backend");

  console.log("🔐 Saving token:", token);
  localStorage.setItem("token", token);

  login(token);
  navigate("/app");
} catch (err) {
  console.error("❌ Error during auth:", err);
  const msg =
    err.response?.data?.detail ||
    err.response?.data?.message ||
    "Something went wrong. Try again.";
  alert(msg);
}

  };


  return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#f6f5f7] font-sans relative overflow-hidden">
      {/* Background SVG Polygons */}
      <svg className="absolute top-0 left-0 w-full h-full z-0" xmlns="http://www.w3.org/2000/svg">
        <polygon points="0,0 100,0 0,100" fill="#FF4B2B" opacity="0.2" />
        <polygon points="100,100 200,0 200,200" fill="#FF416C" opacity="0.2" />
        <polygon points="100,300 300,100 400,400" fill="#FF4B2B" opacity="0.18" />
        <polygon points="500,0 600,100 700,0" fill="#FF416C" opacity="0.15" />
        <polygon points="800,200 900,100 1000,300" fill="#FF4B2B" opacity="0.17" />
        <polygon points="4400,1600 1400,650 1300,750" fill="#FF416C" opacity="0.04" />
        <polygon points="1100,700 1200,800 1300,700" fill="#FF4B2B" opacity="0.05" />
        <polygon points="1000,900 1100,950 1050,1050" fill="#FF416C" opacity="0.05" />
        <polygon points="1150,850 1250,900 1200,1000" fill="#FF4B2B" opacity="0.06" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white rounded-lg shadow-2xl overflow-hidden w-[768px] max-w-full min-h-[480px] z-10"
      >
        {/* Sign Up Form */}
        <motion.div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 opacity-0 z-[1] ${isSignUpActive ? 'translate-x-full opacity-100 z-[5]' : ''
            }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isSignUpActive ? 1 : 0 }}
        >
          <form onSubmit={handleFormSubmit} className="bg-white h-full flex justify-center items-center flex-col px-10 text-center">
            <h1 className="font-extrabold text-3xl mb-2">Create Account</h1>
            <p className="text-sm text-gray-500 mb-4">with your HR credentials</p>
            <input name="name" className="bg-gray-200 border-none p-3 my-2 w-full" type="text" placeholder="Name" />
            <input name="email" className="bg-gray-200 border-none p-3 my-2 w-full" type="email" placeholder="Email" />
            <input name="number" className="bg-gray-200 border-none p-3 my-2 w-full" type="tel" placeholder="Mobile" />
            <input name="password" className="bg-gray-200 border-none p-3 my-2 w-full" type="password" placeholder="Password" />
            <button type="submit" className="mt-4 rounded-full border border-[#FF4B2B] bg-[#FF4B2B] text-white text-xs font-bold py-3 px-12 uppercase tracking-wider transition-transform duration-75 ease-in active:scale-95">
              Sign Up
            </button>
          </form>
        </motion.div>

        {/* Sign In Form */}
        <motion.div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-[2] ${isSignUpActive ? 'translate-x-full' : ''
            }`}
        >
          <form onSubmit={handleFormSubmit} className="bg-white h-full flex justify-center items-center flex-col px-10 text-center">
            <h1 className="font-extrabold text-4xl mb-2">Sign in</h1>
            <p className="text-sm text-gray-500 mb-4">with your HR credentials</p>
            <input name="email" className="bg-gray-200 border-none p-3 my-2 w-full" type="email" placeholder="Email" />
            <input name="password" className="bg-gray-200 border-none p-3 my-2 w-full" type="password" placeholder="Password" />
            <button type="button" className="text-sm my-3 text-gray-500 hover:text-gray-700">Forgot your password?</button>
            <button type="submit" className="rounded-full border border-[#FF4B2B] bg-[#FF4B2B] text-white text-xs font-bold py-3 px-12 uppercase tracking-wider transition-transform duration-75 ease-in active:scale-95">
              Sign In
            </button>
          </form>
        </motion.div>

        {/* Overlay Container */}
        <motion.div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] ${isSignUpActive ? '-translate-x-full' : ''
            }`}
        >
          <motion.div
            className={`relative bg-gradient-to-r from-[#FF4B2B] to-[#FF416C] text-white h-full w-[200%] transition-transform duration-700 ease-in-out -left-full ${isSignUpActive ? 'translate-x-1/2' : 'translate-x-0'
              }`}
          >
            {/* Left Panel */}
            <motion.div
              className={`absolute top-0 h-full w-1/2 flex justify-center items-center flex-col px-10 text-center transition-transform duration-700 ease-in-out ${isSignUpActive ? 'translate-x-0' : '-translate-x-1/5'
                }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="font-bold text-4xl">Welcome Back!</h1>
              <p className="text-sm font-bold leading-5 tracking-wider my-5">To keep connected with us please login with your personal info</p>
              <button onClick={handleSignInClick} className="bg-transparent border border-white rounded-full text-xs font-bold py-3 px-12 uppercase tracking-wider transition-transform duration-75 ease-in active:scale-95">
                Sign In
              </button>
            </motion.div>

            {/* Right Panel */}
            <motion.div
              className={`absolute top-0 h-full w-1/2 flex justify-center items-center flex-col px-10 text-center transition-transform duration-700 ease-in-out right-0 ${isSignUpActive ? 'translate-x-1/5' : 'translate-x-0'
                }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="font-extrabold text-4xl">Hello, Talent Seeker!</h1>
              <p className="text-sm font-bold leading-5 tracking-wider my-5">Enter your personal details and start your journey with Talent Finder</p>
              <button onClick={handleSignUpClick} className="bg-transparent border border-white rounded-full text-xs font-bold py-3 px-12 uppercase tracking-wider transition-transform duration-75 ease-in active:scale-95">
                Sign Up
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginRegisterPage;

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  Search,
  UserCircle,
  BarChart3,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { Link as ScrollLink } from "react-scroll";
import AnimatedBrain from "../assets/AnimatedBrain";
import GlassBackgroundLayout from "./GlassBackground";
import { useAuth } from "./AuthContext";

export default function Hero() {
  const { isAuthenticated, logout } = useAuth();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const featureData = [
    {
      title: "NLP Skill Extraction",
      desc: "Automatically identify key skills from job descriptions using AI.",
      icon: <FileText className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "AI Candidate Ranking",
      desc: "Rank LinkedIn profiles using tailored algorithms based on fit score.",
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
    },
    {
      title: "Smart Export Tools",
      desc: "Export shortlists and manage hiring funnel effortlessly.",
      icon: <Briefcase className="h-6 w-6 text-indigo-600" />,
    },

    {
      title: "Vast database Search",
      desc: "Search real-time candidates via API integration.",
      icon: <Search className="h-6 w-6 text-purple-600" />,
    },
    {
      title: "Detailed Profile Previews",
      desc: "View enhanced candidate summaries with skill and experience highlights.",
      icon: <UserCircle className="h-6 w-6 text-indigo-600" />,
    },
    {
      title: "Intuitive Dashboard & Analytics",
      desc: "Filter, visualize, and analyze candidate pools from a centralized dashboard.",
      icon: <BarChart3 className="h-6 w-6 text-emerald-500" />,
    },
  ];

  return (
    <GlassBackgroundLayout>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* HERO SECTION */}
        <div className="relative z-10" id="hero">
          <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 sm:px-6 md:px-10">
            <div className="max-w-7xl w-full mx-auto bg-white/90 border border-gray-200 rounded-full px-8 py-4 flex items-center justify-between shadow-md">
              <motion.h2
                className="text-lg sm:text-xl font-bold text-purple-600"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Talent Finder
              </motion.h2>

              <motion.div
                className="flex gap-3 sm:gap-4 items-center"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/app"
                      className="px-4 sm:px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition hover:brightness-105 shadow-sm flex items-center gap-1.5"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Go to App
                    </Link>
                    <button
                      onClick={logout}
                      className="px-4 sm:px-6 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full transition hover:bg-gray-100 flex items-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4 text-gray-500" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 sm:px-6 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-full transition hover:bg-blue-50"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 sm:px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition hover:brightness-105"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </header>

          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 px-6 pt-52 pb-24 md:pb-32 text-gray-800 flex flex-col-reverse md:flex-row items-center justify-center md:justify-between gap-6 md:gap-10 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100"

          >
            <div className="absolute inset-0 -z-10">
              <svg
                className="w-full h-full"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#c7d2fe" // darker wave (indigo-200)
                  fillOpacity="1"
                  d="M0,224L48,218.7C96,213,192,203,288,181.3C384,160,480,128,576,138.7C672,149,768,203,864,197.3C960,192,1056,128,1152,112C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                />
              </svg>
            </div>

            {/* Glassy circles */}
            <div className="absolute top-16 left-16 w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full shadow-md z-[-1]"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/20 backdrop-blur-md rounded-full shadow-lg z-[-1]"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full transform -translate-x-1/2 -translate-y-1/2 z-[-1]"></div>

            {/* Left - Text Content */}
            <div className="text-center md:text-left md:w-full lg:w-1/2 md:pl-6 lg:pl-24">
              <motion.div
                variants={itemVariants}
                className="inline-block mb-6 px-6 py-2 rounded-xl text-sm font-semibold bg-white text-purple-700 shadow-md border border-purple-100"
              >
                ⚡ Powered by Meta Llama 3.3 70B
              </motion.div>
              <motion.h1
                variants={itemVariants}
                className="text-4xl font-extrabold leading-tight mb-4"
              >
                {/* Always force two lines on desktop */}
                <span class="block text-4xl sm:text-5xl lg:text-6xl font-extrabold">Streamline your</span>
                <span class="block text-4xl sm:text-5xl lg:text-6xl font-extrabold">recruitment with AI</span>
                <span class="block text-4xl sm:text-5xl lg:text-6xl font-extrabold">Powered Tools.</span>
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-lg text-gray-700 max-w-xl mb-10"
              >
                Let Llama 3.3 do the heavy lifting in your hiring process. Deep semantic evaluation, objective candidate fit scoring, and instant sourcing.
              </motion.p>
              <motion.div
                variants={itemVariants}
                className="flex justify-center md:justify-start gap-4 flex-wrap"
              >
                <Link
                  to={isAuthenticated ? "/app" : "/login"}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:scale-105 flex items-center gap-2"
                >
                  <Briefcase className="h-5 w-5 text-white" />
                  {isAuthenticated ? "Go to App →" : "Start Hiring →"}
                </Link>
                <ScrollLink
                  to="features"
                  smooth={true}
                  duration={500}
                  offset={-100}
                  className="cursor-pointer border-2 border-blue-600 px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  Explore Features ✨
                </ScrollLink>
              </motion.div>
            </div>

            {/* Right - Brain Animation */}
            <motion.div
              variants={itemVariants}
              className="w-full md:w-1/2 **max-w-md** flex justify-center md:pr-20"
            >
              <AnimatedBrain />
            </motion.div>
          </motion.section>



        </div>

        {/* FEATURES SECTION */}
        <motion.section
          id="features"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md relative py-24 px-6 md:px-20 text-center text-gray-700"
        >
          <h2 className="text-sm uppercase tracking-wide text-blue-500 mb-2">Features</h2>
          <h3 className="text-3xl font-bold mb-4 text-blue-600">
            Our Powerful Features
          </h3>
          <p className="max-w-4xl mx-auto mb-12 leading-relaxed">
            TalentFinder automates talent acquisition using cutting-edge AI and LinkedIn APIs. From intelligent job input to real-time candidate search, ranking, and analytics, we simplify your recruitment workflow and accelerate hiring decisions.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {featureData.map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-white rounded-xl p-8 shadow-lg text-left border border-blue-100"
              >
                <div className="mb-4">{feature.icon}</div>
                <h4 className="text-xl font-semibold mb-2 text-blue-600">
                  {feature.title}
                </h4>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-20 px-6 md:px-20 bg-gradient-to-b from-white via-indigo-50 to-purple-50 relative">
          {/* Section Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-sm uppercase tracking-wider text-blue-500 font-semibold mb-2">
              How it works
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">
              Smart Hiring in 3 Easy Steps
            </h3>
            <p className="text-gray-600 text-base">
              Let AI transform your hiring experience — from role input to ranked candidate lists.
            </p>
          </motion.div>

          {/* Three Steps */}
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 text-left"
            >
              <div className="mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 16h8M8 12h8m-8-4h8M4 6h16v12H4z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">1. Describe Your Role</h4>
              <p className="text-gray-600">
                Paste or type in your job description — our system instantly understands what you need.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 text-left"
            >
              <div className="mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">2. AI Analyzes & Matches</h4>
              <p className="text-gray-600">
                Our AI extracts key skills, experience, and matches it against thousands of profiles.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 text-left"
            >
              <div className="mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">3. Get Top Candidates</h4>
              <p className="text-gray-600">
                Receive a smart shortlist with ranked profiles ready for outreach and hiring.
              </p>
            </motion.div>
          </div>

          {/* Horizontal Flowchart */}
          <div className="mt-16 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 px-4">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl shadow-md">
                📝
              </div>
              <p className="mt-3 text-sm font-medium text-center text-gray-700">Input JD</p>
            </motion.div>

            {/* Arrow */}
            <svg
              className="w-6 h-6 text-gray-400 hidden md:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl shadow-md">
                🤖
              </div>
              <p className="mt-3 text-sm font-medium text-center text-gray-700">AI Analysis</p>
            </motion.div>

            {/* Arrow */}
            <svg
              className="w-6 h-6 text-gray-400 hidden md:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl shadow-md">
                📋
              </div>
              <p className="mt-3 text-sm font-medium text-center text-gray-700">Profile Ranking</p>
            </motion.div>

            {/* Arrow */}
            <svg
              className="w-6 h-6 text-gray-400 hidden md:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl shadow-md">
                ✅
              </div>
              <p className="mt-3 text-sm font-medium text-center text-gray-700">Shortlist</p>
            </motion.div>
          </div>
        </section>


        {/* BACKGROUND WAVE OVERLAY ABOVE FOOTER */}
        <div className="relative overflow-hidden -mb-20">
          <svg
            className="absolute top-0 left-0 w-full h-32 md:h-48 text-indigo-100"
            viewBox="0 0 1440 320"
            fill="#FF4B2B"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillOpacity="5"
              d="M0,160L40,165.3C80,171,160,181,240,165.3C320,149,400,107,480,112C560,117,640,171,720,165.3C800,160,880,96,960,74.7C1040,53,1120,75,1200,106.7C1280,139,1360,181,1400,202.7L1440,224V0H0Z"
            />
          </svg>
        </div>

        {/* FOOTER SECTION */}
        <footer className="relative z-10 mt-0 px-6 md:px-16 pb-6 pt-32">
          <div className="max-w-7xl mx-auto bg-white/60 backdrop-blur-lg rounded-3xl shadow-lg px-8 py-10 flex flex-col md:flex-row justify-between gap-10 border border-gray-200">
            {/* Left Brand + Tagline */}
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold text-purple-600 mb-3">LinkedIn TalentFinder</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Connecting talent with technology-driven hiring. Let AI help you discover the best candidates faster and smarter.
              </p>
            </div>

            {/* Center - Navigation */}
            <div className="md:w-1/3 flex flex-col md:items-center gap-2 text-sm text-gray-700">
              <ScrollLink to="hero" smooth duration={500} offset={-100} className="hover:text-purple-600 cursor-pointer transition-colors">
                Home
              </ScrollLink>
              <ScrollLink to="features" smooth duration={500} offset={-100} className="hover:text-purple-600 cursor-pointer transition-colors">
                Features
              </ScrollLink>
              <Link to="#privacy" className="hover:text-purple-600 transition-colors">Privacy Policy</Link>
              <Link to="#terms" className="hover:text-purple-600 transition-colors">Terms of Service</Link>
              <Link to="#contact" className="hover:text-purple-600 transition-colors">Contact Us</Link>
            </div>

            {/* Right - Call to Action */}
            <div className="md:w-1/3 flex flex-col items-start md:items-end gap-2">
              <p className="text-sm text-gray-600">Built with ❤️ using React + Tailwind</p>
              <Link
                to={isAuthenticated ? "/app" : "/signup"}
                className="mt-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm shadow-md hover:brightness-105 transition-all"
              >
                {isAuthenticated ? "Go to App →" : "Get Started →"}
              </Link>
            </div>
          </div>

          {/* Bottom credit line */}
          <p className="text-center text-xs text-gray-500 mt-6">
            © {new Date().getFullYear()} TalentFinder. All rights reserved.
          </p>
        </footer>


      </div>
    </GlassBackgroundLayout>
  );
}

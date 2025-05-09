import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/manrope/700.css";
import React, { useState } from "react";
import { Star } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white font-inter relative overflow-hidden">
      {/* Background Circle */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full blur-3xl z-1 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, #0f0c29, #302b63, #2c5364, #1bc6c4)",
          opacity: 0.2,
        }}
      />
      ;{/* Another smaller circle for added depth */}
      <div className="absolute bottom-[-200px] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-600/5 blur-3xl left-[100px] pointer-events-none" />
      {/* Navigation */}
      <nav className="w-full py-4 sm:py-6 px-4 md:px-16 sticky top-0 bg-black/90 backdrop-blur-sm z-50">
        <div className="flex justify-between items-center">
          <img
            src="https://storage.googleapis.com/tempo-public-images/figma-exports%2Fgithub%7C196424230-1740190883034-node-14%3A79-1740180082712.png"
            alt="Logo"
            className="h-6 md:h-8 w-[100px] sm:w-[120px] md:w-[160px] flex"
          />

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex space-x-6">
              <button
                onClick={() => scrollToSection("home")}
                className="text-white/90 text-sm font-bold font-manrope hover:text-primary transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-white/90 text-sm font-bold font-manrope hover:text-primary transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-white/90 text-sm font-bold font-manrope hover:text-primary transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-white/90 text-sm font-bold font-manrope hover:text-primary transition-colors"
              >
                Contact
              </button>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate("/login")}
                className="px-3 py-1.5 bg-white/10 rounded-[6px] text-[#0052cc] text-xs font-bold font-manrope"
              >
                Log in
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-3 py-1.5 bg-[#0052cc] rounded-[6px] text-white text-xs font-bold font-manrope"
              >
                Sign up
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed top-[60px] left-0 right-0 bottom-0 bg-black/95 border-t border-white/10 py-6 px-6 space-y-6 z-50 overflow-y-auto">
              <div className="flex flex-col space-y-6">
                <button
                  onClick={() => {
                    scrollToSection("home");
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-white/90 text-base font-bold font-manrope hover:text-primary transition-colors text-left"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    scrollToSection("about");
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-white/90 text-base font-bold font-manrope hover:text-primary transition-colors text-left"
                >
                  About
                </button>
                <button
                  onClick={() => {
                    scrollToSection("features");
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-white/90 text-base font-bold font-manrope hover:text-primary transition-colors text-left"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    scrollToSection("contact");
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-white/90 text-base font-bold font-manrope hover:text-primary transition-colors text-left"
                >
                  Contact
                </button>
              </div>
              <div className="flex flex-col space-y-4 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    navigate("/login");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-white/10 rounded-lg text-[#0052cc] text-sm font-bold font-manrope"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    navigate("/signup");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-[#0052cc] rounded-lg text-white text-sm font-bold font-manrope"
                >
                  Sign up
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <hr className="border-white/5 mx-4 md:mx-32 mt-2 flex" />
      {/* Hero Section */}
      <section
        id="home"
        className="text-center px-4 md:px-16 mt-8 md:mt-12 pt-4"
      >
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-[1.2] tracking-tight">
          <span>Trade with </span>
          <span className="text-[#007aff]">AI</span>
          <span> New gen of trading</span>
        </h1>
        <p className="mt-4 md:mt-6 text-sm md:text-base text-white/80 font-medium leading-relaxed max-w-2xl mx-auto">
          With the development of artificial intelligence, in partnership with
          the greatest economists in the trading market and with huge amounts of
          data, we were able to develop our own trading model that will achieve
          the highest profit with the lowest loss percentage.
        </p>
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => navigate("/signup")}
            className="px-4 py-3 bg-[#0052cc] rounded-lg text-sm font-bold font-manrope w-full sm:w-[180px]"
          >
            Sign up
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-3 bg-white rounded-lg text-black text-sm font-bold font-manrope w-full sm:w-[180px]"
          >
            Log in
          </button>
        </div>
      </section>
      {/* Stats Section */}
      <section id="about" className="px-4 md:px-16 mt-16 md:mt-24">
        <div className="flex flex-col md:flex-row justify-between space-y-10 md:space-y-0">
          <div>
            <p className="text-xs md:text-sm font-medium text-[#a8a8a8] uppercase">
              Our AI-Powered Trading
            </p>
            <h2 className="text-2xl md:text-4xl font-extrabold leading-tight mt-3 md:mt-4">
              Entre the new
              <br />
              universe of Trading
            </h2>
            <p className="mt-4 md:mt-6 text-sm md:text-base font-medium text-[#a8a8a8] leading-relaxed max-w-xl">
              With the development of artificial intelligence, in partnership
              with the greatest economists in the trading market and with huge
              amounts of data, we were able to develop our own trading model
              that will achieve the highest profit percentage with the lowest
              loss percentage.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:flex md:flex-col md:space-y-12">
            <div>
              <h3 className="text-3xl sm:text-4xl md:text-6xl font-extrabold leading-none">
                45+
              </h3>
              <p className="text-sm md:text-base font-medium text-[#a8a8a8]">
                Partner around the world
              </p>
            </div>
            <div>
              <h3 className="text-3xl sm:text-4xl md:text-6xl font-extrabold leading-none">
                $132M+
              </h3>
              <p className="text-sm md:text-base font-medium text-[#a8a8a8]">
                Digital assets under managment
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="px-4 md:px-32 mt-20 md:mt-32">
        <div className="text-center">
          <p className="text-base md:text-lg font-medium text-[#a8a8a8] uppercase">
            How to get started?
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mt-4">
            Start with ease
          </h2>
        </div>

        <div className="mt-10 md:mt-16">
          <div className="space-y-8 md:space-y-12 w-full md:w-[422px] mx-auto md:mx-0">
            <div>
              <div className="flex items-start sm:items-center space-x-4 sm:space-x-6">
                <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-full border border-[#ffd100] flex items-center justify-center shrink-0 grow-0 mt-1 sm:mt-0">
                  <span className="text-xl sm:text-2xl text-[#ffd100]">1</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">
                    Create an Account
                  </h3>
                  <p className="text-sm font-medium text-[#a8a8a8] mt-2">
                    Create your account easily, securely and with full control
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start sm:items-center space-x-4 sm:space-x-6">
                <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-full border border-[#ffd100] flex items-center justify-center shrink-0 grow-0 mt-1 sm:mt-0">
                  <span className="text-xl sm:text-2xl text-[#ffd100]">2</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">
                    Choose the method
                  </h3>
                  <p className="text-sm font-medium text-[#a8a8a8] mt-2">
                    Choose your preferred trading method Trade with the help of
                    our artificial intelligence by copy trading or by yourself.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start sm:items-center space-x-4 sm:space-x-6">
                <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-full border border-[#ffd100] flex items-center justify-center shrink-0 grow-0 mt-1 sm:mt-0">
                  <span className="text-xl sm:text-2xl text-[#ffd100]">3</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">
                    Earn Profits
                  </h3>
                  <p className="text-sm font-medium text-[#a8a8a8] mt-2">
                    Instant withdrawal of your profits in all types of ways
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="overflow-hidden mt-10 md:mt-0">
        <img
          src="/images/tempo-image-20250222T003823390Z.png"
          alt="Pasted Image"
          width={1409}
          height={203}
          className="h-full w-[150%] sm:w-[130%] md:w-9/12 relative left-[-25%] sm:left-[-15%] md:left-56 object-cover"
        />
      </div>
      {/* Features Grid */}
      <section className="px-4 md:px-32 mt-16 md:mt-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 max-w-[1004px] mx-auto">
          <div className="flex items-start space-x-4 sm:space-x-6">
            <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] bg-[#007aff] rounded-full flex items-center justify-center shrink-0 grow-0 mt-1 sm:mt-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#fefefe]">
                Advanced Trading
              </h3>
              <p className="text-sm font-medium text-[#a8a8a8] mt-2">
                Access professional-grade trading tools and real-time market
                data
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 sm:space-x-6">
            <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] bg-[#007aff] rounded-full flex items-center justify-center shrink-0 grow-0 mt-1 sm:mt-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#fefefe]">
                Instant Execution
              </h3>
              <p className="text-sm font-medium text-[#a8a8a8] mt-2">
                Lightning-fast trade execution with minimal slippage
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 sm:space-x-6">
            <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] bg-[#007aff] rounded-full flex items-center justify-center shrink-0 grow-0 mt-1 sm:mt-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#fefefe]">
                Secure Storage
              </h3>
              <p className="text-sm font-medium text-[#a8a8a8] mt-2">
                Industry-leading security measures to protect your digital
                assets
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 sm:space-x-6">
            <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] bg-[#007aff] rounded-full flex items-center justify-center shrink-0 grow-0 mt-1 sm:mt-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#fefefe]">
                More rewards
              </h3>
              <p className="text-sm font-medium text-[#a8a8a8] mt-2">
                5% of the Sesterce Group's profits redistributed each quarter to
                stakers
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer
        id="contact"
        className="px-4 md:px-32 mt-20 md:mt-32 pb-8 md:pb-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-6 mb-10 md:mb-8">
          <div className="space-y-6 col-span-1 sm:col-span-2 md:col-span-1">
            <img
              src="https://storage.googleapis.com/tempo-public-images/figma-exports%2Fgithub%7C196424230-1740190881924-node-103%3A91-1740180080498.png"
              alt="Logo"
              className="w-32 sm:w-36 h-[40px] sm:h-[45px]"
            />
            <p className="text-base sm:text-lg font-semibold font-poppins">
              Get the lastes Updates
            </p>
            <div className="relative w-full md:w-[380px]">
              <input
                type="email"
                placeholder="Your Email"
                className="w-full md:w-[300px] h-[45px] bg-[#1b1a21] rounded-lg px-4 text-white text-sm font-normal font-poppins"
              />
              <button className="absolute right-0 top-0 w-28 md:w-[120px] h-[45px] bg-[#007aff] rounded-lg text-[#1c1c1c] text-sm font-semibold font-poppins">
                Get notified
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <h4 className="text-lg sm:text-xl font-semibold font-poppins">
              Service
            </h4>
            <div className="space-y-3 sm:space-y-2.5">
              <p className="text-base font-normal font-poppins leading-loose">
                Explore
              </p>
              <p className="text-base font-normal font-poppins leading-loose">
                How it Works
              </p>
              <p className="text-base font-normal font-poppins leading-loose">
                Contact Us
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <h4 className="text-lg sm:text-xl font-semibold font-poppins">
              Support
            </h4>

            <div className="space-y-3 sm:space-y-2.5">
              <Link
                to="/legal"
                className="block text-base font-normal font-poppins leading-loose hover:text-primary transition-colors"
              >
                Legal
              </Link>
              <p className="text-base font-normal font-poppins leading-loose">
                Help center
              </p>
              <Link
                to="/privacy"
                className="block text-base font-normal font-poppins leading-loose hover:text-primary transition-colors"
              >
                Privacy policy
              </Link>
              <Link
                to="/terms"
                className="block text-base font-normal font-poppins leading-loose hover:text-primary transition-colors"
              >
                Terms of service
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10">
          <p className="text-sm sm:text-base font-semibold font-poppins text-center md:text-left">
            NeuroTrade ©. All Rights Reserved
          </p>
          <div className="flex space-x-4">{/* Social Icons */}</div>
        </div>
      </footer>
    </div>
  );
}

import SignupForm from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية مع زوم */}
      <div className="absolute inset-0 bg-[url('https://storage.googleapis.com/tempo-public-images/github%7C205284952-1746669741458-1212png')] bg-cover bg-center scale-110 animate-zoom" />

      {/* فورم التسجيل */}
      <div className="relative z-10 w-full max-w-lg">
        <SignupForm className="w-full bg-[url('https://storage.googleapis.com/tempo-public-images/github%7C205284952-1746649569311-downlhoadpng')]" />
      </div>

      {/* أنميشن الزوم */}
      <style jsx>{`
        @keyframes zoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.1);
          }
        }
        .animate-zoom {
          animation: zoom 1s forwards;
        }
      `}</style>
    </div>
  );
}

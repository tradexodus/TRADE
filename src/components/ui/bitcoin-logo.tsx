interface BitcoinLogoProps {
  className?: string;
}

export default function BitcoinLogo({ className = "" }: BitcoinLogoProps) {
  return (
    <div className={`relative w-[440px] h-[440px] ${className}`}>
      {/* Outer shape */}
      <div className="absolute inset-0 rounded-[108px] border-2 border-white transform rotate-30" />

      {/* Inner shape */}
      <div className="absolute inset-0 rounded-[108px] border-2 border-white" />

      {/* Bitcoin symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white text-6xl font-bold">₿</div>
      </div>
    </div>
  );
}

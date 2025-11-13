import { ReactNode } from 'react';

interface LandingBackgroundProps {
  children: ReactNode;
}

export function LandingBackground({ children }: LandingBackgroundProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Container - Full Screen with Image */}
      <div className="absolute inset-0 bg-slate-900">
        {/* Background Image - Blended */}
        <div className="absolute inset-0">
          <img
            src="/AdobeStock_624341140_Preview.jpeg"
            alt=""
            className="w-full h-full object-cover"
            style={{
              opacity: 0.6,
              filter: 'brightness(0.5) contrast(1.1) saturate(1.0)',
            }}
            onError={(e) => {
              console.error('Failed to load background image:', e);
              // Try alternative image path
              const target = e.target as HTMLImageElement;
              target.src = '/cow-background.jpg.webp';
            }}
            aria-hidden="true"
          />
        </div>

        {/* Dark Overlay for Better Blend */}
        <div className="absolute inset-0 bg-slate-900/40" />

        {/* Subtle Network/Constellation Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              radial-gradient(circle at 40% 50%, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
              radial-gradient(circle at 60% 20%, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 150px 150px, 80px 80px, 120px 120px',
            backgroundPosition: '0 0, 50px 50px, 25px 25px, 75px 75px',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 max-w-2xl px-6 md:px-12 lg:px-16 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
            AI Livestock Tracking Software for Smarter Farming
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed">
            Harness AI and Real-Time Monitoring to Optimize Herd Health, Increase Yields, and Reduce Operational Costs Effortlessly With AI-Powered Livestock Tracking Software.
          </p>
        </div>
      </div>

      {/* Children Content (Auth Cards) - Positioned on top, right-aligned on desktop */}
      <div className="relative z-20 min-h-screen flex items-center justify-center md:justify-end md:pr-12 lg:pr-20 xl:pr-32 p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

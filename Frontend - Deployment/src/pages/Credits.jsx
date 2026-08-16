import React from "react";

const Credits = () => {
  const developers = [
    { name: "Kriscel P. Aquiman", course: "BSCpE 3", image: "/aquiman.jpg" },
    { name: "Lady Joy P. Borja", course: "BSCpE 3", image: "/borja.jpg" },
    { name: "Khrist Mae C. Camoc", course: "BSCpE 3", image: "/camoc.jpg" },
    { name: "Devine S. Salagoste", course: "BSCpE 3", image: "/salagoste.jpg" },
    { name: "Justin N. Saldon", course: "BSCpE 3", image: "/saldon.jpg" },
    { name: "Jensen J. Calleja", course: "BSCpE 3", image: "/calleja.jpg" },
  ];

  return (
    <div
      className="relative min-h-screen px-4 py-16 sm:px-6 lg:px-8 flex flex-col justify-center items-center font-sans overflow-hidden"
      style={{
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Subtle Ambient Glowing Background Blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-400/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glass Panel */}
      <div 
        className="relative z-10 w-full max-w-6xl rounded-[2.5rem] p-8 sm:p-14 border shadow-[0_25px_80px_rgba(0,0,0,0.2)] transition-all duration-300"
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderColor: "rgba(255, 255, 255, 0.4)",
        }}
      >
        {/* Header Section */}
        <div className="mb-14 text-center">
          <span className="inline-block px-4 py-1.5 mb-3 text-xs font-bold tracking-widest uppercase bg-orange-500/15 text-orange-600 rounded-full border border-orange-500/30 shadow-sm backdrop-blur-md">
            JRMSU BSCpE • Batch 2026
          </span>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-6xl drop-shadow-sm">
            Meet the Dev Team
          </h1>
          <div className="mx-auto mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 shadow-[0_0_20px_rgba(249,115,22,0.8)]" />
        </div>

        {/* Developers Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
          {developers.map((dev, index) => (
            <div
              key={index}
              className="group relative w-full max-w-[310px] transform overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-2.5 shadow-lg border"
              style={{
                background: "rgba(255, 255, 255, 0.35)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderColor: "rgba(255, 255, 255, 0.45)",
              }}
            >
              {/* Image Frame with portrait ratio */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900/5">
                <img
                  src={dev.image}
                  alt={dev.name}
                  className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              {/* Glass Text Container Section - Gihimo nang frosted glass imbis nga solid puti */}
              <div 
                className="p-6 text-center"
                style={{
                  background: "rgba(255, 255, 255, 0.25)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight transition-colors group-hover:text-orange-600">
                  {dev.name}
                </h3>

                {/* Animated Accent Line with Course & Year */}
                <div className="mt-2.5 flex items-center justify-center gap-2">
                  <span className="h-0.5 w-5 bg-orange-500 rounded-full group-hover:w-8 transition-all duration-300" />
                  <p className="text-[12px] font-bold tracking-widest text-orange-600 uppercase">
                    {dev.course}
                  </p>
                  <span className="h-0.5 w-5 bg-orange-500 rounded-full group-hover:w-8 transition-all duration-300" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center border-t border-gray-900/10 pt-6">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-700/70">
            © {new Date().getFullYear()} JRMSU CAPS • ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </div>
  );
};

export default Credits;

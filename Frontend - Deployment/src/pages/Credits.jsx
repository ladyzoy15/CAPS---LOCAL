import React, { useEffect, useState } from "react";

const Credits = () => {
  const developers = [
    { name: "Kriscel P. Aquiman", course: "BSCpE 3", image: "/aquiman.jpg" },
    { name: "Lady Joy P. Borja", course: "BSCpE 3", image: "/borja.jpg" },
    { name: "Khrist Mae C. Camoc", course: "BSCpE 3", image: "/camoc.jpg" },
    { name: "Devine S. Salagoste", course: "BSCpE 3", image: "/salagoste.jpg" },
    { name: "Justin N. Saldon", course: "BSCpE 3", image: "/saldon.jpg" },
    { name: "Jensen J. Calleja", course: "BSCpE 3", image: "/calleja.jpg" },
  ];

  // =========================================================
  // DARK MODE
  // Follows the global <html class="dark"> setting
  // =========================================================
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const html = document.documentElement;

    const updateTheme = () => {
      setIsDarkMode(html.classList.contains("dark"));
    };

    // Initial check
    updateTheme();

    // Watch for changes from the sidebar Dark Mode button
    const observer = new MutationObserver(() => {
      updateTheme();
    });

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // =========================================================
  // COLORS
  // =========================================================

  const colors = {
    pageBackground: isDarkMode ? "#080b10" : "#fff8ef",

    panelBackground: isDarkMode
      ? "rgba(18, 23, 32, 0.82)"
      : "rgba(255, 255, 255, 0.15)",

    panelBorder: isDarkMode
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.4)",

    cardBackground: isDarkMode
      ? "rgba(23, 29, 38, 0.88)"
      : "rgba(255, 255, 255, 0.35)",

    cardBorder: isDarkMode
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.45)",

    textPrimary: isDarkMode ? "#f3f4f6" : "#111827",

    textSecondary: isDarkMode ? "#9ca3af" : "#374151",

    footerBorder: isDarkMode
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(17, 24, 39, 0.1)",
  };

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16 font-sans transition-colors duration-500 sm:px-6 lg:px-8 ${
        isDarkMode ? "dark-credits-page" : ""
      }`}
      style={{
        backgroundColor: colors.pageBackground,

        backgroundImage: isDarkMode
          ? "linear-gradient(rgba(8,11,16,0.82), rgba(8,11,16,0.92)), url('/bg.jpg')"
          : "url('/bg.jpg')",

        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",

        color: colors.textPrimary,
      }}
    >
      {/* =====================================================
          DARK MODE AMBIENT BACKGROUND
          ===================================================== */}

      <div
        className="pointer-events-none absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] transition-all duration-500"
        style={{
          background: isDarkMode
            ? "rgba(249, 115, 22, 0.10)"
            : "rgba(249, 115, 22, 0.20)",
        }}
      />

      <div
        className="pointer-events-none absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full blur-[100px] transition-all duration-500"
        style={{
          background: isDarkMode
            ? "rgba(245, 158, 11, 0.07)"
            : "rgba(251, 191, 36, 0.15)",
        }}
      />

      {/* =====================================================
          EXTRA DARK OVERLAY
          Makes sure no white background leaks through
          ===================================================== */}

      {isDarkMode && (
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(249,115,22,0.06), transparent 35%), rgba(5,8,12,0.30)",
          }}
        />
      )}

      {/* =====================================================
          MAIN GLASS PANEL
          ===================================================== */}

      <div
        className="relative z-10 w-full max-w-6xl rounded-[2.5rem] border p-8 shadow-[0_25px_80px_rgba(0,0,0,0.2)] transition-all duration-500 sm:p-14"
        style={{
          background: colors.panelBackground,

          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",

          borderColor: colors.panelBorder,

          boxShadow: isDarkMode
            ? "0 25px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 25px 80px rgba(0,0,0,0.20)",
        }}
      >
        {/* ===================================================
            HEADER
            =================================================== */}

        <div className="mb-14 text-center">
          {/* Badge */}

          <span
            className="mb-3 inline-block rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest uppercase shadow-sm backdrop-blur-md transition-all duration-500"
            style={{
              background: isDarkMode
                ? "rgba(249, 115, 22, 0.12)"
                : "rgba(249, 115, 22, 0.15)",

              color: isDarkMode ? "#fb923c" : "#ea580c",

              borderColor: isDarkMode
                ? "rgba(249, 115, 22, 0.35)"
                : "rgba(249, 115, 22, 0.30)",
            }}
          >
            JRMSU BSCpE • Batch 2026
          </span>

          {/* Title */}

          <h1
            className="text-4xl font-black tracking-tight sm:text-6xl"
            style={{
              color: colors.textPrimary,

              textShadow: isDarkMode
                ? "0 2px 15px rgba(0,0,0,0.5)"
                : "0 2px 5px rgba(0,0,0,0.08)",
            }}
          >
            Meet the Dev Team
          </h1>

          {/* Orange line */}

          <div
            className="mx-auto mt-4 h-1.5 w-24 rounded-full transition-all duration-500"
            style={{
              background:
                "linear-gradient(to right, #fb923c, #f97316, #f59e0b)",

              boxShadow:
                "0 0 20px rgba(249,115,22,0.7)",
            }}
          />
        </div>

        {/* ===================================================
            DEVELOPERS GRID
            =================================================== */}

        <div className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {developers.map((dev, index) => (
            <div
              key={index}
              className="group relative w-full max-w-[310px] transform overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-2.5"
              style={{
                background: colors.cardBackground,

                backdropFilter: "blur(15px)",
                WebkitBackdropFilter: "blur(15px)",

                borderColor: colors.cardBorder,

                boxShadow: isDarkMode
                  ? "0 15px 35px rgba(0,0,0,0.40)"
                  : "0 10px 30px rgba(0,0,0,0.12)",
              }}
            >
              {/* =============================================
                  IMAGE
                  ============================================= */}

              <div
                className="relative aspect-[3/4] w-full overflow-hidden"
                style={{
                  background: isDarkMode
                    ? "#11161d"
                    : "rgba(17,24,39,0.05)",
                }}
              >
                <img
                  src={dev.image}
                  alt={dev.name}
                  className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Dark image overlay */}

                {isDarkMode && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.18))",
                    }}
                  />
                )}
              </div>

              {/* =============================================
                  TEXT SECTION
                  ============================================= */}

              <div
                className="p-6 text-center transition-colors duration-500"
                style={{
                  background: isDarkMode
                    ? "rgba(17, 22, 29, 0.88)"
                    : "rgba(255, 255, 255, 0.25)",

                  borderTop: isDarkMode
                    ? "1px solid rgba(255,255,255,0.10)"
                    : "1px solid rgba(255,255,255,0.30)",
                }}
              >
                {/* Developer Name */}

                <h3
                  className="text-xl font-extrabold tracking-tight transition-colors duration-300 group-hover:text-orange-500"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  {dev.name}
                </h3>

                {/* Course */}

                <div className="mt-2.5 flex items-center justify-center gap-2">
                  <span
                    className="h-0.5 w-5 rounded-full transition-all duration-300 group-hover:w-8"
                    style={{
                      backgroundColor: "#f97316",
                    }}
                  />

                  <p
                    className="text-[12px] font-bold tracking-widest uppercase"
                    style={{
                      color: isDarkMode ? "#fb923c" : "#ea580c",
                    }}
                  >
                    {dev.course}
                  </p>

                  <span
                    className="h-0.5 w-5 rounded-full transition-all duration-300 group-hover:w-8"
                    style={{
                      backgroundColor: "#f97316",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===================================================
            FOOTER
            =================================================== */}

        <div
          className="mt-16 border-t pt-6 text-center transition-colors duration-500"
          style={{
            borderColor: colors.footerBorder,
          }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase"
            style={{
              color: isDarkMode
                ? "rgba(156,163,175,0.75)"
                : "rgba(55,65,81,0.70)",
            }}
          >
            © {new Date().getFullYear()} JRMSU REVA • ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </div>
  );
};

export default Credits;





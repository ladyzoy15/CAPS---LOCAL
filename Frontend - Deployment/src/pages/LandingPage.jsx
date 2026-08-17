{/* RIGHT PREVIEW - PHONE LIKE QUESTION CARD */}
<div className="relative flex items-center justify-center">
  {/* Phone Frame */}
  <div
    className="
      relative
      rounded-[48px]
      border-[4px]
      border-orange-200/40
      bg-gradient-to-br
      from-orange-100/40
      via-white/10
      to-orange-200/50
      p-[6px]
      shadow-[0_25px_60px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,.45)]
      backdrop-blur-xl
      transition-transform
      duration-500
      hover:-translate-y-2
    "
  >
    {/* Metallic shine on frame */}
    <div className="pointer-events-none absolute inset-0 rounded-[48px] bg-gradient-to-br from-white/30 via-transparent to-orange-200/30" />

    {/* Phone Screen */}
    <div
      className="
        relative
        overflow-hidden
        rounded-[40px]
        bg-gradient-to-br
        from-slate-900
        via-slate-800
        to-slate-950
        shadow-[inset_0_0_0_2px_rgba(255,255,255,.08)]
        w-[320px]
        max-w-full
      "
    >
      {/* Dynamic Island */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-3
          z-30
          h-[28px]
          w-[100px]
          -translate-x-1/2
          rounded-full
          bg-black
          shadow-[0_2px_8px_rgba(0,0,0,.7)]
        "
      >
        <div className="absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-slate-700" />
      </div>

      {/* Screen Content - Question Card */}
      <div className="p-5 pt-12">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-white">
              Engineering Calculus 1
            </h3>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
              <span>📚 MATH111</span>
              <span className="text-gray-600">·</span>
              <span>General</span>
              <span className="text-gray-600">·</span>
              <span>1st Year</span>
            </div>
          </div>
          <div className="rounded-full bg-orange-500/20 px-3 py-1 text-[10px] font-medium text-orange-400">
            QUIZ
          </div>
        </div>

        {/* Question Badge */}
        <div className="mt-4 flex items-center gap-3">
          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[11px] text-orange-400">
            1. Multiple Choice
          </span>
          <span className="text-[11px] text-gray-500">•</span>
          <span className="text-[11px] text-gray-400">Easy</span>
          <span className="text-[11px] text-gray-500">•</span>
          <span className="text-[11px] text-gray-400">Midterm</span>
          <span className="ml-auto text-[11px] font-medium text-orange-400">
            1 pt
          </span>
        </div>

        {/* Question */}
        <div className="mt-4 rounded-2xl bg-white/5 p-4 border border-white/10">
          <p className="text-[14px] leading-relaxed text-gray-200">
            What is the derivative of{" "}
            <span className="font-mono text-orange-300">3x² + 5x - 7</span>?
          </p>
        </div>

        {/* Options */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5 hover:border-orange-500/30 transition cursor-pointer">
            <span className="text-[13px] font-medium text-gray-400">A.</span>
            <span className="text-[13px] text-gray-300">6x + 5</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-orange-500/10 p-3 border border-orange-500/30">
            <span className="text-[13px] font-medium text-orange-400">B.</span>
            <span className="text-[13px] text-white">6x - 5</span>
            <span className="ml-auto text-[10px] text-orange-400">✓ Correct</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5 hover:border-orange-500/30 transition cursor-pointer">
            <span className="text-[13px] font-medium text-gray-400">C.</span>
            <span className="text-[13px] text-gray-300">3x² + 5</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5 hover:border-orange-500/30 transition cursor-pointer">
            <span className="text-[13px] font-medium text-gray-400">D.</span>
            <span className="text-[13px] text-gray-300">6x² + 5</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">1 / 10 Questions</span>
          <button className="rounded-full bg-orange-500 px-5 py-2 text-[12px] font-medium text-white shadow-[0_8px_25px_rgba(249,115,22,0.25)] hover:bg-orange-600 transition">
            Next →
          </button>
        </div>
      </div>

      {/* Screen Glass Reflection */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-[40px]" />

      {/* Bottom Home Indicator */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/20" />
    </div>
  </div>
</div>
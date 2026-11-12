import React from "react";

export default function GlassBackgroundLayout({ children }) {
  return (
    // A simple, performant gradient background replaces the blur and shape overlays.
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* All content is placed in a single relative container */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

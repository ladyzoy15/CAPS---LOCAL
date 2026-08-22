import React from "react";

// Displays App Version
const AppVersion = () => {
  const version = "v0.0.1";

  return (
    <div className="text-center text-sm">{version && <p>{version}</p>}</div>
  );
};

export default AppVersion;

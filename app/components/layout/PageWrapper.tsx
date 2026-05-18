import React from "react";

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%" }}>
      {children}
    </div>
  );
};

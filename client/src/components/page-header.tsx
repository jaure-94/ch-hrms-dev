import React from "react";
import chLogoPlain from "@assets/ch-logo-plain_1751733209226.png";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  showLogo?: boolean;
}

export default function PageHeader({ title, description, children, showLogo = false }: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="px-6 py-8">
        <div className="space-y-6">
          {/* Title and Description */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              {showLogo && (
                <img 
                  src={chLogoPlain} 
                  alt="Compliance Hub UK" 
                  className="w-8 h-8 object-contain"
                />
              )}
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                {title}
              </h1>
            </div>
            {description && (
              <p className="text-sm text-gray-600 font-normal leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>
          
          {/* Sub-navigation Buttons */}
          {children && (
            <div className="pt-2 border-t border-gray-50">
              <div className="flex flex-wrap items-center gap-3">
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
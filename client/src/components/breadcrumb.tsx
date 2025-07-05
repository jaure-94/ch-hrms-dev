import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <nav className="flex items-center space-x-2 text-sm">
        <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <Home className="w-4 h-4 mr-1" />
          <span>Dashboard</span>
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {item.href ? (
              <Link href={item.href} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                {item.icon && <item.icon className="w-4 h-4 mr-1" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="flex items-center text-gray-900 font-medium">
                {item.icon && <item.icon className="w-4 h-4 mr-1" />}
                <span>{item.label}</span>
              </span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
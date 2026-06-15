"use client";

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

export default function Logo({ size = "md", href = "/" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <Link href={href} className="flex items-center gap-2 group">
      {/* Shield Icon */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M20 4L6 10V22C6 29.5 12.5 36.5 20 38C27.5 36.5 34 29.5 34 22V10L20 4Z"
            fill="#e11d48"
          />
          <path
            d="M20 4L6 10V22C6 29.5 12.5 36.5 20 38C27.5 36.5 34 29.5 34 22V10L20 4Z"
            fill="url(#shieldGrad)"
          />
          <text
            x="20"
            y="26"
            textAnchor="middle"
            fill="white"
            fontSize="16"
            fontWeight="bold"
            fontFamily="system-ui"
          >
            R
          </text>
          <defs>
            <linearGradient
              id="shieldGrad"
              x1="6"
              y1="4"
              x2="34"
              y2="38"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#9f1239" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div>
        <span
          className={`${sizeClasses[size]} font-black tracking-tight text-gray-900 dark:text-white`}
        >
          Rescue
          <span className="text-emergency-600">Rider</span>
        </span>
        {size === "lg" && (
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium -mt-1">
            Rescuing The Nation
          </p>
        )}
      </div>
    </Link>
  );
}

interface Props {
  size?: number;
}

export default function Logo({ size = 40 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rounded square background */}
      <rect width="48" height="48" rx="12" fill="url(#logoGradient)" />

      {/* Exchange arrows — right arrow */}
      <path
        d="M13 19h18"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M26 14l5 5-5 5"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Exchange arrows — left arrow */}
      <path
        d="M35 29H17"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M22 34l-5-5 5-5"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f25d38" />
          <stop offset="1" stopColor="#f5a623" />
        </linearGradient>
      </defs>
    </svg>
  );
}

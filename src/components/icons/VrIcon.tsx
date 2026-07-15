import { SVGProps } from "react";

export const VrIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M21 6H3C1.9 6 1 6.9 1 8V16C1 17.1 1.9 18 3 18H7.5L9.3 20.2C9.7 20.7 10.3 20.7 10.7 20.2L12.5 18H21C22.1 18 23 17.1 23 16V8C23 6.9 22.1 6 21 6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="7.5"
      cy="12"
      r="2.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="16.5"
      cy="12"
      r="2.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M10 12H14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

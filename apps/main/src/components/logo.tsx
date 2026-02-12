import type React from "react";

interface LogoProps {
	size?: number;
	className?: string;
	/** Primary color - defaults to iris purple */
	color?: string;
	/** Show text next to icon */
	showText?: boolean;
}

/**
 * IrisNotes Logo - Stylized iris flower
 * Based on the iris color palette in dev/logo-colors.css
 */
export const Logo: React.FC<LogoProps> = ({
	size = 24,
	className = "",
	color = "#7B68EE", // --iris-modern-vibrant
	showText = false,
}) => {
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<svg
				width={size}
				height={size}
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Three iris petals arranged in a fan */}
				{/* Center petal */}
				<path
					d="M12 2C12 2 14 6 14 10C14 14 12 18 12 18C12 18 10 14 10 10C10 6 12 2 12 2Z"
					fill={color}
					opacity="0.9"
				/>
				{/* Left petal */}
				<path
					d="M6 5C6 5 10 7 12 10C14 13 14 18 14 18C14 18 10 14 8 11C6 8 6 5 6 5Z"
					fill={color}
					opacity="0.7"
				/>
				{/* Right petal */}
				<path
					d="M18 5C18 5 14 7 12 10C10 13 10 18 10 18C10 18 14 14 16 11C18 8 18 5 18 5Z"
					fill={color}
					opacity="0.7"
				/>
				{/* Stem */}
				<path
					d="M12 16V22"
					stroke={color}
					strokeWidth="1.5"
					strokeLinecap="round"
					opacity="0.6"
				/>
				{/* Small leaves */}
				<path
					d="M12 19C10 18 9 17 9 17"
					stroke={color}
					strokeWidth="1"
					strokeLinecap="round"
					opacity="0.5"
				/>
				<path
					d="M12 20C14 19 15 18 15 18"
					stroke={color}
					strokeWidth="1"
					strokeLinecap="round"
					opacity="0.5"
				/>
			</svg>
			{showText && (
				<span
					className="font-semibold text-sm"
					style={{ color }}
				>
					IrisNotes
				</span>
			)}
		</div>
	);
};

export default Logo;

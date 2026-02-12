import type React from "react";

interface IrisLogoProps {
	size?: number;
	className?: string;
	/** Petal color - defaults to blue iris */
	petalColor?: string;
	/** Leaf/stem color - defaults to natural green */
	leafColor?: string;
	/** Beard/accent color - defaults to yellow */
	beardColor?: string;
	/** Show text next to icon */
	showText?: boolean;
}

/**
 * IrisNotes Logo - Stylized iris flower with separate petal and leaf colors
 * Colors from dev/logo-colors.css iris palette
 */
export const IrisLogo: React.FC<IrisLogoProps> = ({
	size = 24,
	className = "",
	petalColor = "#4B5FA5", // --iris-blue-deep
	leafColor = "#3D5A47", // --iris-natural-green
	beardColor = "#D4A42E", // --iris-yellow-gold
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
				{/* Center petal (falls) - pointing down */}
				<path
					d="M12 8C12 8 14 11 14 14C14 17 12 20 12 20C12 20 10 17 10 14C10 11 12 8 12 8Z"
					fill={petalColor}
					opacity="0.95"
				/>
				{/* Left petal (standard) - upper left */}
				<path
					d="M7 3C7 3 6 6 7 9C8 12 12 14 12 14C12 14 10 10 9 7C8 4 7 3 7 3Z"
					fill={petalColor}
					opacity="0.8"
				/>
				{/* Right petal (standard) - upper right */}
				<path
					d="M17 3C17 3 18 6 17 9C16 12 12 14 12 14C12 14 14 10 15 7C16 4 17 3 17 3Z"
					fill={petalColor}
					opacity="0.8"
				/>
				{/* Left falling petal */}
				<path
					d="M5 7C5 7 7 10 9 12C11 14 12 14 12 14C12 14 9 13 7 11C5 9 5 7 5 7Z"
					fill={petalColor}
					opacity="0.65"
				/>
				{/* Right falling petal */}
				<path
					d="M19 7C19 7 17 10 15 12C13 14 12 14 12 14C12 14 15 13 17 11C19 9 19 7 19 7Z"
					fill={petalColor}
					opacity="0.65"
				/>
				{/* Beard (center accent) */}
				<ellipse
					cx="12"
					cy="12"
					rx="1.5"
					ry="2"
					fill={beardColor}
					opacity="0.9"
				/>
				{/* Left leaf */}
				<path
					d="M8 18C8 18 10 17 11 19C11.5 20 11.5 22 11.5 22C11.5 22 10 20 9 19C8 18 8 18 8 18Z"
					fill={leafColor}
					opacity="0.85"
				/>
				{/* Right leaf */}
				<path
					d="M16 18C16 18 14 17 13 19C12.5 20 12.5 22 12.5 22C12.5 22 14 20 15 19C16 18 16 18 16 18Z"
					fill={leafColor}
					opacity="0.85"
				/>
				{/* Stem */}
				<path
					d="M12 14V22"
					stroke={leafColor}
					strokeWidth="1.2"
					strokeLinecap="round"
					opacity="0.75"
				/>
			</svg>
			{showText && (
				<span
					className="font-semibold text-sm"
					style={{ color: petalColor }}
				>
					IrisNotes
				</span>
			)}
		</div>
	);
};

export default IrisLogo;

/// <reference types="vite/client" />

// Declare module for SQL files imported with ?raw
declare module "*.sql?raw" {
	const content: string;
	export default content;
}

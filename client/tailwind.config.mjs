/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ["class"],
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {},
		},
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;

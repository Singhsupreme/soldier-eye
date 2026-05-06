export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: '#0C0F13', surface: '#141820', surface2: '#1C2230', surface3: '#232C3E',
        border: '#2A3347', accent: '#E8B84B', accent2: '#3B82F6',
        danger: '#E24B4A', success: '#1D9E75', warn: '#EF9F27',
      }
    }
  },
  plugins: []
}
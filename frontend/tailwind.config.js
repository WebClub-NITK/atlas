module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mario': ['SuperMario256', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(90deg, #80808033 1px, transparent 0), 
                        linear-gradient(180deg, #80808033 1px, transparent 0)`
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
    },
  },
  plugins: [],
};

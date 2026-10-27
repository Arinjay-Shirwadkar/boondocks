export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#000000',
        ink: '#0a0a0a',
        crimson: { DEFAULT: '#DC143C', dark: '#8B0000' },
        cream: { DEFAULT: '#FFFDD0', dim: '#F5F5DC' }
      },
      fontFamily: { comic: ['"Comic Sans MS"', '"Comic Sans"', 'cursive', 'sans-serif'] },
      boxShadow: {
        brutal: '6px 6px 0 0 #DC143C',
        'brutal-cream': '6px 6px 0 0 #FFFDD0'
      }
    }
  },
  plugins: []
};


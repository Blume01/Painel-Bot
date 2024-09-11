/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs', // Inclua as views em ejs
    './public/**/*.html', // Se você tiver arquivos HTML no diretório public
    './src/**/*.js', // Se houver arquivos JS em src que utilizem classes do Tailwind
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
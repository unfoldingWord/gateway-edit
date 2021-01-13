module.exports = {
  purge: ['./pages/**/*.js', './src/components/**/*.js'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        grey: {
          450: '#eaeaea',
        },
        primary: '#00B0FF',
      },
      spacing: {
        98: '26rem',
        100: '28rem',
        102: '30rem',
        104: '32rem',
        106: '34rem',
        108: '36rem',
        110: '38rem',
        112: '40rem',
        114: '42rem',
        116: '44rem',
        118: '46rem',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}

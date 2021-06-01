const { appTitle, appDescription } = require('./app/scripts/config');

module.exports = {
  plugins: {
    'posthtml-expressions': {
      locals: {
        appTitle,
        appDescription,
      },
    },
  },
};

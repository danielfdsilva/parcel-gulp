const config = {
  appTitle: 'Parcel & Gulp',
  appDescription: 'Example with parcel and gulp',

  baseUrl: process.env.PUBLIC_URL || ''
};

// Must use module.exports to be compatible with posthtml.config.js
module.exports = config;

const generate = require('videojs-generate-karma-config');

module.exports = function(config) {

  // see https://github.com/videojs/videojs-generate-karma-config
  // for options
  const options = {
    // Firefox 136+ dropped support for navigating to URLs passed as CLI arguments
    // in headless mode. Restrict to ChromiumHeadless only until a compatible
    // Firefox headless launcher is available.
    browsers(detected) {
      return detected.filter((b) => b !== 'FirefoxHeadless');
    }
  };

  config = generate(config, options);

  // any other custom stuff not supported by options here!
};

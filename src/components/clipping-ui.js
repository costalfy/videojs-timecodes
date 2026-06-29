
import videojs from 'video.js';

const Component = videojs.getComponent('Component');

const ClippingBar = videojs.extend(Component, {

  constructor(player, options) {

    Component.apply(this, arguments);

  },

  createEl() {

    return videojs.dom.createEl('div', {
      className: 'g-ranger',
      id: this.player().id() + '_range'
    });
  }

});

videojs.registerComponent('ClippingBar', ClippingBar);

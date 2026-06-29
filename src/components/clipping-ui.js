
import videojs from 'video.js';

const Component = videojs.getComponent('Component');

class ClippingBar extends Component {

  constructor(player, options) {

    super(player, options);

  }

  createEl() {

    return videojs.dom.createEl('div', {
      className: 'g-ranger',
      id: this.player().id() + '_range'
    });
  }

}

videojs.registerComponent('ClippingBar', ClippingBar);

export default ClippingBar;

import document from 'global/document';

import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';

import plugin from '../src/plugin';

const Player = videojs.getComponent('Player');

QUnit.test('the environment is sane', function(assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
  assert.strictEqual(typeof plugin, 'function', 'plugin is a function');
});

QUnit.module('videojs-frames', {

  beforeEach() {

    // Mock the environment's timers because certain things - particularly
    // player readiness - are asynchronous in video.js 5. This MUST come
    // before any player is created; otherwise, timers could get created
    // with the actual timer methods!
    this.clock = sinon.useFakeTimers();

    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('registers itself with video.js', function(assert) {
  assert.expect(2);

  assert.strictEqual(
    typeof Player.prototype.frames,
    'function',
    'videojs-frames plugin was registered'
  );

  this.player.frames();

  // Tick the clock forward enough to trigger the player to be "ready".
  this.clock.tick(1);

  assert.ok(
    this.player.hasClass('vjs-frames'),
    'the plugin adds a class to the player'
  );
});

QUnit.test('without frameRate option: no TimeDisplay/TimecodeButton added', function(assert) {
  this.player.frames({ clippingEnabled: false });
  this.clock.tick(1);

  const controlBar = this.player.getChild('controlBar');

  assert.notOk(controlBar.getChild('TimeDisplay'), 'TimeDisplay not added');
  assert.notOk(controlBar.getChild('TimecodeButton'), 'TimecodeButton not added');
});

QUnit.test('with frameRate option: TimeDisplay and TimecodeButton are added', function(assert) {
  this.player.frames({ frameRate: 25, clippingEnabled: false });
  this.clock.tick(1);

  const controlBar = this.player.getChild('controlBar');

  assert.ok(controlBar.getChild('TimeDisplay'), 'TimeDisplay was added to control bar');
  assert.ok(controlBar.getChild('TimecodeButton'), 'TimecodeButton was added to control bar');
});

QUnit.test('with clippingEnabled: ClipButton is added on timeupdate', function(assert) {
  this.player.frames({ clippingEnabled: true });
  this.clock.tick(1);

  // Trigger the timeupdate event the plugin listens for
  this.player.trigger('timeupdate');
  this.clock.tick(1);

  const controlBar = this.player.getChild('controlBar');

  assert.ok(controlBar.getChild('ClipButton'), 'ClipButton was added to control bar');
});

QUnit.test('BIFMouseTimeDisplay replaces MouseTimeDisplay in SeekBar children', function(assert) {
  const SeekBar = videojs.getComponent('SeekBar');
  const children = SeekBar.prototype.options_.children;

  assert.ok(
    children.indexOf('BIFMouseTimeDisplay') >= 0,
    'BIFMouseTimeDisplay is registered as a SeekBar child'
  );
  assert.strictEqual(
    children.indexOf('mouseTimeDisplay'),
    -1,
    'original mouseTimeDisplay was replaced'
  );
});

QUnit.module('videojs-frames conversions', {

  beforeEach() {

    this.clock = sinon.useFakeTimers();

    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);
    this.player.frames({ frameRate: 25, clippingEnabled: false });
    this.clock.tick(1);
    this.frames = this.player.frames();
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('toSMPTE(frame): converts a frame number to HH:MM:SS:FF', function(assert) {
  assert.strictEqual(this.frames.toSMPTE(50), '00:00:02:00', '50 frames @25fps = 2 seconds');
  assert.strictEqual(this.frames.toSMPTE(25), '00:00:01:00', '25 frames @25fps = 1 second');
  assert.strictEqual(this.frames.toSMPTE(1525), '00:01:01:00', '1525 frames @25fps = 1m01s');
});

QUnit.test('toFrames(SMPTE): converts a SMPTE code to a frame count', function(assert) {
  assert.strictEqual(this.frames.toFrames('00:00:01:00'), 25, '1s @25fps = 25 frames');
  assert.strictEqual(this.frames.toFrames('00:00:02:00'), 50, '2s @25fps = 50 frames');
  assert.strictEqual(this.frames.toFrames('00:01:00:00'), 1500, '1m @25fps = 1500 frames');
});

QUnit.test('toMilliseconds(SMPTE): converts to milliseconds', function(assert) {
  assert.strictEqual(this.frames.toMilliseconds('00:00:01:00'), 1000, '1s = 1000ms');
  assert.strictEqual(this.frames.toMilliseconds('00:00:10:00'), 10000, '10s = 10000ms');
});

QUnit.test('toSeconds(SMPTE): converts to seconds', function(assert) {
  assert.strictEqual(this.frames.toSeconds('00:00:10:00'), 10, '10s SMPTE = 10');
  assert.strictEqual(this.frames.toSeconds('00:01:00:00'), 60, '1m SMPTE = 60');
});

QUnit.test('seekForward and seekBackward update player currentTime', function(assert) {
  const setSpy = sinon.spy(this.player, 'currentTime');

  sinon.stub(this.player, 'paused').returns(true);

  this.frames.seekForward(1);

  // currentTime is called both as a getter (no args) and setter (with arg)
  const setterCalls = setSpy.getCalls().filter(c => c.args.length > 0);

  assert.ok(setterCalls.length >= 1, 'currentTime(setter) was called by seekForward');

  this.frames.seekBackward(1);

  const setterCalls2 = setSpy.getCalls().filter(c => c.args.length > 0);

  assert.ok(setterCalls2.length >= 2, 'currentTime(setter) was called again by seekBackward');

  setSpy.restore();
});

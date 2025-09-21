import {
  Keyboard
} from "./chunk-BTHYQ5FI.js";
import {
  __name
} from "./chunk-EXLSCMNP.js";

// node_modules/@ionic/core/components/keyboard.js
var KEYBOARD_DID_OPEN = "ionKeyboardDidShow";
var KEYBOARD_DID_CLOSE = "ionKeyboardDidHide";
var KEYBOARD_THRESHOLD = 150;
var previousVisualViewport = {};
var currentVisualViewport = {};
var keyboardOpen = false;
var resetKeyboardAssist = /* @__PURE__ */ __name(() => {
  previousVisualViewport = {};
  currentVisualViewport = {};
  keyboardOpen = false;
}, "resetKeyboardAssist");
var startKeyboardAssist = /* @__PURE__ */ __name((win) => {
  const nativeEngine = Keyboard.getEngine();
  if (nativeEngine) {
    startNativeListeners(win);
  } else {
    if (!win.visualViewport) {
      return;
    }
    currentVisualViewport = copyVisualViewport(win.visualViewport);
    win.visualViewport.onresize = () => {
      trackViewportChanges(win);
      if (keyboardDidOpen() || keyboardDidResize(win)) {
        setKeyboardOpen(win);
      } else if (keyboardDidClose(win)) {
        setKeyboardClose(win);
      }
    };
  }
}, "startKeyboardAssist");
var startNativeListeners = /* @__PURE__ */ __name((win) => {
  win.addEventListener("keyboardDidShow", (ev) => setKeyboardOpen(win, ev));
  win.addEventListener("keyboardDidHide", () => setKeyboardClose(win));
}, "startNativeListeners");
var setKeyboardOpen = /* @__PURE__ */ __name((win, ev) => {
  fireKeyboardOpenEvent(win, ev);
  keyboardOpen = true;
}, "setKeyboardOpen");
var setKeyboardClose = /* @__PURE__ */ __name((win) => {
  fireKeyboardCloseEvent(win);
  keyboardOpen = false;
}, "setKeyboardClose");
var keyboardDidOpen = /* @__PURE__ */ __name(() => {
  const scaledHeightDifference = (previousVisualViewport.height - currentVisualViewport.height) * currentVisualViewport.scale;
  return !keyboardOpen && previousVisualViewport.width === currentVisualViewport.width && scaledHeightDifference > KEYBOARD_THRESHOLD;
}, "keyboardDidOpen");
var keyboardDidResize = /* @__PURE__ */ __name((win) => {
  return keyboardOpen && !keyboardDidClose(win);
}, "keyboardDidResize");
var keyboardDidClose = /* @__PURE__ */ __name((win) => {
  return keyboardOpen && currentVisualViewport.height === win.innerHeight;
}, "keyboardDidClose");
var fireKeyboardOpenEvent = /* @__PURE__ */ __name((win, nativeEv) => {
  const keyboardHeight = nativeEv ? nativeEv.keyboardHeight : win.innerHeight - currentVisualViewport.height;
  const ev = new CustomEvent(KEYBOARD_DID_OPEN, {
    detail: { keyboardHeight }
  });
  win.dispatchEvent(ev);
}, "fireKeyboardOpenEvent");
var fireKeyboardCloseEvent = /* @__PURE__ */ __name((win) => {
  const ev = new CustomEvent(KEYBOARD_DID_CLOSE);
  win.dispatchEvent(ev);
}, "fireKeyboardCloseEvent");
var trackViewportChanges = /* @__PURE__ */ __name((win) => {
  previousVisualViewport = Object.assign({}, currentVisualViewport);
  currentVisualViewport = copyVisualViewport(win.visualViewport);
}, "trackViewportChanges");
var copyVisualViewport = /* @__PURE__ */ __name((visualViewport) => {
  return {
    width: Math.round(visualViewport.width),
    height: Math.round(visualViewport.height),
    offsetTop: visualViewport.offsetTop,
    offsetLeft: visualViewport.offsetLeft,
    pageTop: visualViewport.pageTop,
    pageLeft: visualViewport.pageLeft,
    scale: visualViewport.scale
  };
}, "copyVisualViewport");

export {
  KEYBOARD_DID_OPEN,
  KEYBOARD_DID_CLOSE,
  resetKeyboardAssist,
  startKeyboardAssist,
  setKeyboardOpen,
  setKeyboardClose,
  keyboardDidOpen,
  keyboardDidResize,
  keyboardDidClose,
  trackViewportChanges,
  copyVisualViewport
};
/*! Bundled license information:

@ionic/core/components/keyboard.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-GLRQZDAX.js.map

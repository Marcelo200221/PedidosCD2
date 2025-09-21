import {
  __name
} from "./chunk-EXLSCMNP.js";

// node_modules/@ionic/core/components/focus-visible.js
var ION_FOCUSED = "ion-focused";
var ION_FOCUSABLE = "ion-focusable";
var FOCUS_KEYS = [
  "Tab",
  "ArrowDown",
  "Space",
  "Escape",
  " ",
  "Shift",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Home",
  "End"
];
var startFocusVisible = /* @__PURE__ */ __name((rootEl) => {
  let currentFocus = [];
  let keyboardMode = true;
  const ref = rootEl ? rootEl.shadowRoot : document;
  const root = rootEl ? rootEl : document.body;
  const setFocus = /* @__PURE__ */ __name((elements) => {
    currentFocus.forEach((el) => el.classList.remove(ION_FOCUSED));
    elements.forEach((el) => el.classList.add(ION_FOCUSED));
    currentFocus = elements;
  }, "setFocus");
  const pointerDown = /* @__PURE__ */ __name(() => {
    keyboardMode = false;
    setFocus([]);
  }, "pointerDown");
  const onKeydown = /* @__PURE__ */ __name((ev) => {
    keyboardMode = FOCUS_KEYS.includes(ev.key);
    if (!keyboardMode) {
      setFocus([]);
    }
  }, "onKeydown");
  const onFocusin = /* @__PURE__ */ __name((ev) => {
    if (keyboardMode && ev.composedPath !== void 0) {
      const toFocus = ev.composedPath().filter((el) => {
        if (el.classList) {
          return el.classList.contains(ION_FOCUSABLE);
        }
        return false;
      });
      setFocus(toFocus);
    }
  }, "onFocusin");
  const onFocusout = /* @__PURE__ */ __name(() => {
    if (ref.activeElement === root) {
      setFocus([]);
    }
  }, "onFocusout");
  ref.addEventListener("keydown", onKeydown);
  ref.addEventListener("focusin", onFocusin);
  ref.addEventListener("focusout", onFocusout);
  ref.addEventListener("touchstart", pointerDown, { passive: true });
  ref.addEventListener("mousedown", pointerDown);
  const destroy = /* @__PURE__ */ __name(() => {
    ref.removeEventListener("keydown", onKeydown);
    ref.removeEventListener("focusin", onFocusin);
    ref.removeEventListener("focusout", onFocusout);
    ref.removeEventListener("touchstart", pointerDown);
    ref.removeEventListener("mousedown", pointerDown);
  }, "destroy");
  return {
    destroy,
    setFocus
  };
}, "startFocusVisible");

export {
  startFocusVisible
};
/*! Bundled license information:

@ionic/core/components/focus-visible.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-OLCYCN2L.js.map

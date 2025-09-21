import {
  doc
} from "./chunk-QEE7QVES.js";
import {
  pointerCoord
} from "./chunk-KU2B7TFN.js";
import "./chunk-DVQC2WOX.js";
import {
  __name
} from "./chunk-EXLSCMNP.js";

// node_modules/@ionic/core/components/index7.js
var startTapClick = /* @__PURE__ */ __name((config) => {
  if (doc === void 0) {
    return;
  }
  let lastActivated = 0;
  let activatableEle;
  let activeRipple;
  let activeDefer;
  const useRippleEffect = config.getBoolean("animated", true) && config.getBoolean("rippleEffect", true);
  const clearDefers = /* @__PURE__ */ new WeakMap();
  const cancelActive = /* @__PURE__ */ __name(() => {
    if (activeDefer)
      clearTimeout(activeDefer);
    activeDefer = void 0;
    if (activatableEle) {
      removeActivated(false);
      activatableEle = void 0;
    }
  }, "cancelActive");
  const pointerDown = /* @__PURE__ */ __name((ev) => {
    if (activatableEle || ev.button === 2) {
      return;
    }
    setActivatedElement(getActivatableTarget(ev), ev);
  }, "pointerDown");
  const pointerUp = /* @__PURE__ */ __name((ev) => {
    setActivatedElement(void 0, ev);
  }, "pointerUp");
  const setActivatedElement = /* @__PURE__ */ __name((el, ev) => {
    if (el && el === activatableEle) {
      return;
    }
    if (activeDefer)
      clearTimeout(activeDefer);
    activeDefer = void 0;
    const { x, y } = pointerCoord(ev);
    if (activatableEle) {
      if (clearDefers.has(activatableEle)) {
        throw new Error("internal error");
      }
      if (!activatableEle.classList.contains(ACTIVATED)) {
        addActivated(activatableEle, x, y);
      }
      removeActivated(true);
    }
    if (el) {
      const deferId = clearDefers.get(el);
      if (deferId) {
        clearTimeout(deferId);
        clearDefers.delete(el);
      }
      el.classList.remove(ACTIVATED);
      const callback = /* @__PURE__ */ __name(() => {
        addActivated(el, x, y);
        activeDefer = void 0;
      }, "callback");
      if (isInstant(el)) {
        callback();
      } else {
        activeDefer = setTimeout(callback, ADD_ACTIVATED_DEFERS);
      }
    }
    activatableEle = el;
  }, "setActivatedElement");
  const addActivated = /* @__PURE__ */ __name((el, x, y) => {
    lastActivated = Date.now();
    el.classList.add(ACTIVATED);
    if (!useRippleEffect)
      return;
    const rippleEffect = getRippleEffect(el);
    if (rippleEffect !== null) {
      removeRipple();
      activeRipple = rippleEffect.addRipple(x, y);
    }
  }, "addActivated");
  const removeRipple = /* @__PURE__ */ __name(() => {
    if (activeRipple !== void 0) {
      activeRipple.then((remove) => remove());
      activeRipple = void 0;
    }
  }, "removeRipple");
  const removeActivated = /* @__PURE__ */ __name((smooth) => {
    removeRipple();
    const active = activatableEle;
    if (!active) {
      return;
    }
    const time = CLEAR_STATE_DEFERS - Date.now() + lastActivated;
    if (smooth && time > 0 && !isInstant(active)) {
      const deferId = setTimeout(() => {
        active.classList.remove(ACTIVATED);
        clearDefers.delete(active);
      }, CLEAR_STATE_DEFERS);
      clearDefers.set(active, deferId);
    } else {
      active.classList.remove(ACTIVATED);
    }
  }, "removeActivated");
  doc.addEventListener("ionGestureCaptured", cancelActive);
  doc.addEventListener("pointerdown", pointerDown, true);
  doc.addEventListener("pointerup", pointerUp, true);
  doc.addEventListener("pointercancel", cancelActive, true);
}, "startTapClick");
var getActivatableTarget = /* @__PURE__ */ __name((ev) => {
  if (ev.composedPath !== void 0) {
    const path = ev.composedPath();
    for (let i = 0; i < path.length - 2; i++) {
      const el = path[i];
      if (!(el instanceof ShadowRoot) && el.classList.contains("ion-activatable")) {
        return el;
      }
    }
  } else {
    return ev.target.closest(".ion-activatable");
  }
}, "getActivatableTarget");
var isInstant = /* @__PURE__ */ __name((el) => {
  return el.classList.contains("ion-activatable-instant");
}, "isInstant");
var getRippleEffect = /* @__PURE__ */ __name((el) => {
  if (el.shadowRoot) {
    const ripple = el.shadowRoot.querySelector("ion-ripple-effect");
    if (ripple) {
      return ripple;
    }
  }
  return el.querySelector("ion-ripple-effect");
}, "getRippleEffect");
var ACTIVATED = "ion-activated";
var ADD_ACTIVATED_DEFERS = 100;
var CLEAR_STATE_DEFERS = 150;
export {
  startTapClick
};
/*! Bundled license information:

@ionic/core/components/index7.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=index7-BL4DNTZS.js.map

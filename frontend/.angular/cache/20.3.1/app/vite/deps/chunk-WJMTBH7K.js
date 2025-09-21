import {
  componentOnReady
} from "./chunk-KU2B7TFN.js";
import {
  printRequiredElementError
} from "./chunk-DVQC2WOX.js";
import {
  __async,
  __name
} from "./chunk-EXLSCMNP.js";

// node_modules/@ionic/core/components/index8.js
var ION_CONTENT_TAG_NAME = "ION-CONTENT";
var ION_CONTENT_ELEMENT_SELECTOR = "ion-content";
var ION_CONTENT_CLASS_SELECTOR = ".ion-content-scroll-host";
var ION_CONTENT_SELECTOR = `${ION_CONTENT_ELEMENT_SELECTOR}, ${ION_CONTENT_CLASS_SELECTOR}`;
var isIonContent = /* @__PURE__ */ __name((el) => el.tagName === ION_CONTENT_TAG_NAME, "isIonContent");
var getScrollElement = /* @__PURE__ */ __name((el) => __async(null, null, function* () {
  if (isIonContent(el)) {
    yield new Promise((resolve) => componentOnReady(el, resolve));
    return el.getScrollElement();
  }
  return el;
}), "getScrollElement");
var findIonContent = /* @__PURE__ */ __name((el) => {
  const customContentHost = el.querySelector(ION_CONTENT_CLASS_SELECTOR);
  if (customContentHost) {
    return customContentHost;
  }
  return el.querySelector(ION_CONTENT_SELECTOR);
}, "findIonContent");
var findClosestIonContent = /* @__PURE__ */ __name((el) => {
  return el.closest(ION_CONTENT_SELECTOR);
}, "findClosestIonContent");
var scrollToTop = /* @__PURE__ */ __name((el, durationMs) => {
  if (isIonContent(el)) {
    const content = el;
    return content.scrollToTop(durationMs);
  }
  return Promise.resolve(el.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth"
  }));
}, "scrollToTop");
var scrollByPoint = /* @__PURE__ */ __name((el, x, y, durationMs) => {
  if (isIonContent(el)) {
    const content = el;
    return content.scrollByPoint(x, y, durationMs);
  }
  return Promise.resolve(el.scrollBy({
    top: y,
    left: x,
    behavior: durationMs > 0 ? "smooth" : "auto"
  }));
}, "scrollByPoint");
var printIonContentErrorMsg = /* @__PURE__ */ __name((el) => {
  return printRequiredElementError(el, ION_CONTENT_ELEMENT_SELECTOR);
}, "printIonContentErrorMsg");
var disableContentScrollY = /* @__PURE__ */ __name((contentEl) => {
  if (isIonContent(contentEl)) {
    const ionContent = contentEl;
    const initialScrollY = ionContent.scrollY;
    ionContent.scrollY = false;
    return initialScrollY;
  } else {
    contentEl.style.setProperty("overflow", "hidden");
    return true;
  }
}, "disableContentScrollY");
var resetContentScrollY = /* @__PURE__ */ __name((contentEl, initialScrollY) => {
  if (isIonContent(contentEl)) {
    contentEl.scrollY = initialScrollY;
  } else {
    contentEl.style.removeProperty("overflow");
  }
}, "resetContentScrollY");

export {
  ION_CONTENT_ELEMENT_SELECTOR,
  ION_CONTENT_CLASS_SELECTOR,
  isIonContent,
  getScrollElement,
  findIonContent,
  findClosestIonContent,
  scrollToTop,
  scrollByPoint,
  printIonContentErrorMsg,
  disableContentScrollY,
  resetContentScrollY
};
/*! Bundled license information:

@ionic/core/components/index8.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-WJMTBH7K.js.map

import {
  findClosestIonContent,
  scrollToTop
} from "./chunk-WJMTBH7K.js";
import {
  readTask,
  writeTask
} from "./chunk-PHINHIIC.js";
import {
  componentOnReady
} from "./chunk-KU2B7TFN.js";
import "./chunk-DVQC2WOX.js";
import {
  __async,
  __name
} from "./chunk-EXLSCMNP.js";

// node_modules/@ionic/core/components/status-tap.js
var startStatusTap = /* @__PURE__ */ __name(() => {
  const win = window;
  win.addEventListener("statusTap", () => {
    readTask(() => {
      const width = win.innerWidth;
      const height = win.innerHeight;
      const el = document.elementFromPoint(width / 2, height / 2);
      if (!el) {
        return;
      }
      const contentEl = findClosestIonContent(el);
      if (contentEl) {
        new Promise((resolve) => componentOnReady(contentEl, resolve)).then(() => {
          writeTask(() => __async(null, null, function* () {
            contentEl.style.setProperty("--overflow", "hidden");
            yield scrollToTop(contentEl, 300);
            contentEl.style.removeProperty("--overflow");
          }));
        });
      }
    });
  });
}, "startStatusTap");
export {
  startStatusTap
};
/*! Bundled license information:

@ionic/core/components/status-tap.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=status-tap-T6QT3WMM.js.map

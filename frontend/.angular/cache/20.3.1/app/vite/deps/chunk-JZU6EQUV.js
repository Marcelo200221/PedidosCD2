import {
  win
} from "./chunk-QEE7QVES.js";
import {
  config,
  printIonError
} from "./chunk-DVQC2WOX.js";
import {
  __async,
  __name
} from "./chunk-EXLSCMNP.js";

// node_modules/@ionic/core/components/hardware-back-button.js
var shouldUseCloseWatcher = /* @__PURE__ */ __name(() => config.get("experimentalCloseWatcher", false) && win !== void 0 && "CloseWatcher" in win, "shouldUseCloseWatcher");
var blockHardwareBackButton = /* @__PURE__ */ __name(() => {
  document.addEventListener("backbutton", () => {
  });
}, "blockHardwareBackButton");
var startHardwareBackButton = /* @__PURE__ */ __name(() => {
  const doc = document;
  let busy = false;
  const backButtonCallback = /* @__PURE__ */ __name(() => {
    if (busy) {
      return;
    }
    let index = 0;
    let handlers = [];
    const ev = new CustomEvent("ionBackButton", {
      bubbles: false,
      detail: {
        register(priority, handler) {
          handlers.push({ priority, handler, id: index++ });
        }
      }
    });
    doc.dispatchEvent(ev);
    const executeAction = /* @__PURE__ */ __name((handlerRegister) => __async(null, null, function* () {
      try {
        if (handlerRegister === null || handlerRegister === void 0 ? void 0 : handlerRegister.handler) {
          const result = handlerRegister.handler(processHandlers);
          if (result != null) {
            yield result;
          }
        }
      } catch (e) {
        printIonError("[ion-app] - Exception in startHardwareBackButton:", e);
      }
    }), "executeAction");
    const processHandlers = /* @__PURE__ */ __name(() => {
      if (handlers.length > 0) {
        let selectedHandler = {
          priority: Number.MIN_SAFE_INTEGER,
          handler: /* @__PURE__ */ __name(() => void 0, "handler"),
          id: -1
        };
        handlers.forEach((handler) => {
          if (handler.priority >= selectedHandler.priority) {
            selectedHandler = handler;
          }
        });
        busy = true;
        handlers = handlers.filter((handler) => handler.id !== selectedHandler.id);
        executeAction(selectedHandler).then(() => busy = false);
      }
    }, "processHandlers");
    processHandlers();
  }, "backButtonCallback");
  if (shouldUseCloseWatcher()) {
    let watcher;
    const configureWatcher = /* @__PURE__ */ __name(() => {
      watcher === null || watcher === void 0 ? void 0 : watcher.destroy();
      watcher = new win.CloseWatcher();
      watcher.onclose = () => {
        backButtonCallback();
        configureWatcher();
      };
    }, "configureWatcher");
    configureWatcher();
  } else {
    doc.addEventListener("backbutton", backButtonCallback);
  }
}, "startHardwareBackButton");
var OVERLAY_BACK_BUTTON_PRIORITY = 100;
var MENU_BACK_BUTTON_PRIORITY = 99;

export {
  shouldUseCloseWatcher,
  blockHardwareBackButton,
  startHardwareBackButton,
  OVERLAY_BACK_BUTTON_PRIORITY,
  MENU_BACK_BUTTON_PRIORITY
};
/*! Bundled license information:

@ionic/core/components/hardware-back-button.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-JZU6EQUV.js.map

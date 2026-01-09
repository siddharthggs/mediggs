"use strict";

// electron/preload.ts
var import_electron = require("electron");
var ipcAPI = {
  invoke(channel, payload) {
    return import_electron.ipcRenderer.invoke(channel, payload);
  }
};
import_electron.contextBridge.exposeInMainWorld("electronAPI", ipcAPI);

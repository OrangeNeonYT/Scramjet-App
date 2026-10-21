"use strict";

/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");

// Engine files come from the npm packages, served by jsDelivr:
const CDN = "https://cdn.jsdelivr.net/npm/@mercuryworkshop";
const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  files: {
    wasm: `${CDN}/scramjet@1.1.0/dist/scramjet.wasm.wasm`,
    all: `${CDN}/scramjet@1.1.0/dist/scramjet.all.js`,
    sync: `${CDN}/scramjet@1.1.0/dist/scramjet.sync.js`,
  },
});

scramjet.init();

// The BareMux worker lives on our own site (Workers must be same-origin):
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await registerSW();
  } catch (err) {
    error.textContent = "Failed to register service worker.";
    errorCode.textContent = err.toString();
    throw err;
  }

  const url = search(address.value, searchEngine.value);

  // Point the transport at YOUR engine — the Rust Worker you deployed:
  let wispUrl =
    "wss://wisp-server-workers.athanoffcialemailcopy2.workers.dev/wisp/";

  const libcurlUrl = `${CDN}/libcurl-transport@1.5.2/dist/index.mjs`;
  if ((await connection.getTransport()) !== libcurlUrl) {
    await connection.setTransport(libcurlUrl, [{ websocket: wispUrl }]);
  }

  const frame = scramjet.createFrame();
  frame.frame.id = "sj-frame";
  document.body.appendChild(frame.frame);
  frame.go(url);
});

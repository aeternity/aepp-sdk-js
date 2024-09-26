# WebExtension-based wallet

## Overview

This is a sample wallet as an WebExtension. It works with æpp opened in a browser where it is installed.

### How it works

1. Install this wallet to Chrome or Firefox
2. Start the [sample contract æpp](../aepp), which will start on port `9001`
3. Visit [localhost:9001](http://localhost:9001)
4. This wallet should attempt to connect to the æpp

## Installation and running in Google Chrome

Prerequisite: [refer SDK installation](../README.md#setup-info)

1. Install required dependencies with `npm install`
2. Start the build server in watch mode `npm run serve`
3. Open [chrome://extensions](chrome://extensions/)
4. Enable "Developer mode" at the right top conner
5. Press "Load unpacked" button and choose the `dist` folder

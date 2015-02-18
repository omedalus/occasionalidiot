// Occasional Idiot
// Source file for Chrome plugin to handle Facebook integration.
// Background and context menu tasks.
// Copyright (c) 2015 Mikhail Voloshin. All rights reserved.


/*

// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function getOpeningIds() {
  var ids = [];
  try {
    ids = JSON.parse(localStorage.openWhenComplete);
  } catch (e) {
    localStorage.openWhenComplete = JSON.stringify(ids);
  }
  return ids;
}

function setOpeningIds(ids) {
  localStorage.openWhenComplete = JSON.stringify(ids);
}

chrome.downloads.onChanged.addListener(function(delta) {
  if (!delta.state ||
      (delta.state.current != 'complete')) {
    return;
  }
  var ids = getOpeningIds();
  if (ids.indexOf(delta.id) < 0) {
    return;
  }
  chrome.downloads.open(delta.id);
  ids.splice(ids.indexOf(delta.id), 1);
  setOpeningIds(ids);
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  chrome.downloads.download({url: info.linkUrl}, function(downloadId) {
    var ids = getOpeningIds();
    if (ids.indexOf(downloadId) >= 0) {
      return;
    }
    ids.push(downloadId);
    setOpeningIds(ids);
  });
});
*/

var APP_CONTEXT_MENU_ID = 'occasionalidiot-context-menu';

chrome.contextMenus.create({
  id: APP_CONTEXT_MENU_ID,
  title: chrome.i18n.getMessage('contextMenuTitle'),
  contexts: ['page'],
});


// Set up a listener to receive messages from the context page.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
  console.log(request);
});


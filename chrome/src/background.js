// Occasional Idiot
// Source file for Chrome plugin to handle Facebook integration.
// Background and context menu tasks.
// Copyright (c) 2015 Mikhail Voloshin. All rights reserved.


var commandAllContentReload = function() {
  chrome.tabs.query({}, function(tabs) {
    for (var iTab = 0; iTab < tabs.length; iTab++) {
      chrome.tabs.sendMessage(tabs[iTab].id, {reprocessPage: true});
    }
  });
};


var editWordOnPersonBlacklist = function(person, word, isKeeping) {
  chrome.storage.sync.get('blacklist', function(response) {
    var blacklist = response.blacklist;

    if (!blacklist) {
      blacklist = {};
    }
    
    var personBlacklist = blacklist[person];
    if (!personBlacklist) {
      personBlacklist = {name: person};
      blacklist[person] = personBlacklist;
    }
    
    var personBlacklistWords = personBlacklist.words;
    if (!personBlacklistWords) {
        personBlacklistWords = {};
        personBlacklist.words = personBlacklistWords;
    }
    
    if (isKeeping) {
      personBlacklistWords[word] = true;
    } else {
      delete personBlacklistWords[word];
    }
    
    console.log(blacklist);
    chrome.storage.sync.set({blacklist: blacklist}, function() {
      commandAllContentReload();
    });
  });
};


var CTXMENU_POSTER_SELECTED_TOPIC = 'poster-selected-topic';
var CTXMENU_POSTER_CREATE_TOPIC = 'poster-create-topic';
var CTXMENU_POSTER_VIEW_BLACKLIST = 'poster-view-blacklist';
var CTXMENU_POSTER_SEPARATOR = 'poster-separator';

var CTXMENU_COMMENTER_SELECTED_TOPIC = 'commenter-selected-topic';
var CTXMENU_COMMENTER_CREATE_TOPIC = 'commenter-create-topic';
var CTXMENU_COMMENTER_VIEW_BLACKLIST = 'commenter-view-blacklist';
var CTXMENU_COMMENTER_SEPARATOR = 'commenter-separator';

var CTXMENU_VIEW_ALL_BLACKLISTS = 'all-blacklists';


var createPosterMenuItems = function(poster, selection) {
  if (!poster) {
    return;
  }
  
  if (!!selection) {
    chrome.contextMenus.create({
      id: CTXMENU_POSTER_SELECTED_TOPIC,
      title: chrome.i18n.getMessage('contextMenuHideAllAboutTopic',
          [poster, selection]),
      contexts: ['all']
    });
  }

  chrome.contextMenus.create({
    id: CTXMENU_POSTER_CREATE_TOPIC,
    title: chrome.i18n.getMessage('contextMenuCreateTopic', [poster]),
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: CTXMENU_POSTER_VIEW_BLACKLIST,
    title: chrome.i18n.getMessage('contextMenuViewBlacklistForPerson', [poster]),
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: CTXMENU_POSTER_SEPARATOR,
    type: 'separator',
    contexts: ['all']
  });
};


var createCommenterMenuItems = function(commenter, selection) {
  if (!commenter) {
    return;
  }
  
  if (!!selection) {
    chrome.contextMenus.create({
      id: CTXMENU_COMMENTER_SELECTED_TOPIC,
      title: chrome.i18n.getMessage('contextMenuHideAllAboutTopic',
          [commenter, selection]),
      contexts: ['all']
    });
  }

  chrome.contextMenus.create({
    id: CTXMENU_COMMENTER_CREATE_TOPIC,
    title: chrome.i18n.getMessage('contextMenuCreateTopic', [commenter]),
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: CTXMENU_COMMENTER_VIEW_BLACKLIST,
    title: chrome.i18n.getMessage('contextMenuViewBlacklistForPerson', [commenter]),
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: CTXMENU_COMMENTER_SEPARATOR,
    type: 'separator',
    contexts: ['all']
  });
};


var createCommonMenus = function() {
  chrome.contextMenus.create({
    id: CTXMENU_VIEW_ALL_BLACKLISTS,
    title: chrome.i18n.getMessage('contextMenuViewAllBlacklists'),
    contexts: ['all']
  });
};


var lastRequest = null;

// Set up a listener to receive messages from the context page.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.poster) {
    request.poster = request.poster.trim();
  }
  if (request.commenter) {
    request.commenter = request.commenter.trim();
  }
  if (request.selection) {
    request.selection = request.selection.trim();
  }
    
  lastRequest = request;
  
  if (request.contextMenu) {
    chrome.contextMenus.removeAll();

    createPosterMenuItems(request.poster, request.selection);
    if (request.commenter !== request.poster) {
      createCommenterMenuItems(request.commenter, request.selection);
    }
    
    createCommonMenus();
  }
});


var showAddWordPopup = function(person) {
  var sampleWord = lastRequest.selection;
  if (!sampleWord) {
    var sampleWordsStr = chrome.i18n.getMessage('popupSampleTriggerWords');
    var sampleWords = sampleWordsStr.split(';');
    sampleWord = sampleWords[Math.floor(Math.random() * sampleWords.length)];
  }
  
  var word = window.prompt(chrome.i18n.getMessage('popupAddWordForPerson', [person]), 
      sampleWord.trim());

  editWordOnPersonBlacklist(person, word, true);
};

var APP_OPTIONS_PAGE_URL = 'occasionalidiot-options.html';

var showOptionsPage = function(person) {
  chrome.tabs.create({
    url: APP_OPTIONS_PAGE_URL
  }, function(tab) {
  
  });
};

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === CTXMENU_POSTER_SELECTED_TOPIC) {
    editWordOnPersonBlacklist(lastRequest.poster,
        lastRequest.selection,
        true);
  }
  else if (info.menuItemId === CTXMENU_POSTER_CREATE_TOPIC) {
    showAddWordPopup(lastRequest.poster);
  }
  else if (info.menuItemId === CTXMENU_POSTER_VIEW_BLACKLIST) {
    showOptionsPage(lastRequest.poster);
  }
  else if (info.menuItemId === CTXMENU_COMMENTER_SELECTED_TOPIC) {
    editWordOnPersonBlacklist(lastRequest.commenter,
        lastRequest.selection,
        true);
  }
  else if (info.menuItemId === CTXMENU_COMMENTER_CREATE_TOPIC) {
    showAddWordPopup(lastRequest.commenter);
  }
  else if (info.menuItemId === CTXMENU_POSTER_VIEW_BLACKLIST) {
    showOptionsPage(lastRequest.commenter);
  }
  else if (info.menuItemId === CTXMENU_VIEW_ALL_BLACKLISTS) {
    showOptionsPage();
  }
});



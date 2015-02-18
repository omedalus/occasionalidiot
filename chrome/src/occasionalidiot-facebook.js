// Occasional Idiot
// Source file for Chrome plugin to handle Facebook integration.
// Facebook DOM manipulation routines.
// Copyright (c) 2015 Mikhail Voloshin. All rights reserved.

(function() {

var FB_POST_DIV_CLASSNAME = '_5jmm';
var FB_BLOCKER_ANCHOR_CLASSNAME = '_52c6';

var APP_POST_DIV_CLASSNAME = 'occasionalidiot-marked-post';
var APP_POST_USER_ATTRNAME = 'occasionalidiot-poster-username';

// Send a message to the background task (which runs the context menu) to keep
// it synced with what the user is clicking on.
var updateExtensionContext = function(poster, commenter)
{
  chrome.runtime.sendMessage({
    poster: poster,
    commenter: commenter,
    selection: document.getSelection().toString().trim()
  });
};

// As every node is added to the DOM, check it to see if it's a wall post.
var processWallPost = function(postNode)
{
  // First thing we do is delete the blocking anchor tags.
  // FB uses them for movement tracking, but they interfere with the user's
  // ability to highlight and select text.
  var postAnchors = postNode.getElementsByTagName('a');
  for (var iAnchor = 0; iAnchor < postAnchors.length; iAnchor++) {
    var anchor = postAnchors[iAnchor];

    var relAttr = anchor.attributes.getNamedItem('rel');
    if (!relAttr || relAttr.value !== 'nofollow') {
      continue;
    }

    var replacementText = chrome.i18n.getMessage('hyperlinkReplacementText');
    
    if (anchor.classList.contains(FB_BLOCKER_ANCHOR_CLASSNAME)) {
      anchor.classList.remove(FB_BLOCKER_ANCHOR_CLASSNAME);
      anchor.innerHTML = replacementText;
      anchor.previousSibling.appendChild(anchor);
      
    } else if (anchor.innerText !== replacementText && anchor.innerText.substr(0, 4) !== 'http') {
      // Don't textify/dechildify anchors that just contain URLs.
      
      // Transfer all of the anchor's children to the anchor's parent, as long
      // as they have text (or are text).
      var anchorChildren = anchor.childNodes;
      for (iAnchChild = 0; iAnchChild < anchorChildren.length; iAnchChild++) {
        var anchChild = anchorChildren[iAnchChild];
        if (anchChild.innerText || anchChild.nodeType == Node.TEXT_NODE) {
          anchor.parentNode.insertBefore(anchChild, anchor);
        }
      }
    }
  }

  // The poster's full name is buried in an h5 element.
  // We'll use it as the key.
  var username = postNode.getElementsByTagName('h5')[0].
      getElementsByTagName('a')[0].
      innerText.trim();
      
  // Annotate this element so our lookup can be much faster next time.
  postNode.classList.add(APP_POST_DIV_CLASSNAME);
  postNode.setAttribute(APP_POST_USER_ATTRNAME, username);
  
  // Set up event handling so that the background task (which runs the context
  // menu) knows which user was right-clicked on.
  postNode.addEventListener('mousedown', function(event) {
    if (event.button === 2) {
      // Right click.
      updateExtensionContext(username, null);
    }
  });
  
  // Look up the blacklist collection.
  chrome.storage.sync.get('blacklist', function(blacklist) {
    // FAKE BLACKLIST UNTIL SAVING IS IMPLEMENTED
    blacklist = {};
    blacklist["Chicks On The Right"] = {words: ['DESPICABLE', 'insane']};
    // End fake blacklist.
  
    if (!blacklist || !blacklist[username]) {
      // This poster doesn't have a blacklist.
      return;
    }
    
    // Gather up all the post's text and comments 
    // (or at least currently available comments).
    var allPostText = postNode.innerText.toUpperCase();
    var userBlacklistWords = blacklist[username].words;
    
    for (var iBlacklistWord = 0; 
        iBlacklistWord < userBlacklistWords.length; 
        iBlacklistWord++) {
      var blacklistWord = userBlacklistWords[iBlacklistWord].toUpperCase();
      if (allPostText.indexOf(blacklistWord) != -1) {
        // The post or one of its comments contains a word that's been
        // blacklisted for the original poster. Kill the whole post.
        postNode.style.display = 'none';
      }
    }
  });
};

document.addEventListener('DOMNodeInserted', function(event) {
  //try {
    var node = event.relatedNode;

    if (node.classList.contains(FB_POST_DIV_CLASSNAME)) {
      processWallPost(node);
    } else {
      var postNodes = node.getElementsByClassName(FB_POST_DIV_CLASSNAME);
      for (var iPostNode = 0; iPostNode < postNodes.length; iPostNode++) {
        var postNode = postNodes[iPostNode];
        if (!postNode) {
          continue;
        }
        
        processWallPost(postNode);
      }
    }    
  //} catch (ex) {
    //return;
  //}
});

})();


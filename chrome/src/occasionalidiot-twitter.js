// Occasional Idiot
// Source file for Chrome plugin to handle Twitter integration.
// Twitter DOM manipulation routines.
// Copyright (c) 2015 Mikhail Voloshin. All rights reserved.

(function() {

var TWITTER_POST_DIV_CLASSNAME = 'js-stream-item';
var TWITTER_COMMENT_DIV_CLASSNAME = 'js-simple-tweet';
var TWITTER_PERSON_LINK_CLASSNAME = 'fullname';

var APP_POST_DIV_CLASSNAME = 'occasionalidiot-marked-post';
var APP_POST_USER_ATTRNAME = 'occasionalidiot-poster-username';
var APP_COMMENT_DIV_CLASSNAME = 'occasionalidiot-marked-comment';
var APP_COMMENT_USER_ATTRNAME = 'occasionalidiot-commenter-username';

// Send a message to the background task (which runs the context menu) to keep
// it synced with what the user is clicking on.
var updateExtensionContext = function(poster, commenter) {
  var message = {
    poster: poster,
    commenter: commenter,
    selection: document.getSelection().toString().trim(),
    contextMenu: true
  };
  
  chrome.runtime.sendMessage(message);
};

// As every node is added to the DOM, check it to see if it's a wall post.
var processWallPost = function(postNode) {
  try {
    // The poster's full name is buried in the first person tag element.
    // We'll use it as the key.
    var postername;
    try {
      postername = postNode.getElementsByClassName(TWITTER_PERSON_LINK_CLASSNAME)[0].
          innerText.trim();
    } catch(ex) {
    }

    if (postername) {
      // Annotate this element so our lookup can be much faster next time,
      // and wire up event handlers.
      if (!postNode.classList.contains(APP_POST_DIV_CLASSNAME)) {
        postNode.classList.add(APP_POST_DIV_CLASSNAME);
        postNode.setAttribute(APP_POST_USER_ATTRNAME, postername);
        
        // Set up event handling so that the background task (which runs the context
        // menu) knows which user was right-clicked on.
        postNode.addEventListener('mousedown', function(event) {
          if (event.button === 2) {
            // Right click.
            updateExtensionContext(postername, null);
          }
        });
      }

      // Look up the blacklist collection.
      chrome.storage.sync.get('blacklist', function(response) {
        var blacklist = response.blacklist;
        if (!blacklist || !blacklist[postername]) {
          // This poster doesn't have a blacklist.
          return;
        }

        // Gather up all the post's text and comments 
        // (or at least currently available comments).
        var allPostText = postNode.innerText.toUpperCase();
        var userBlacklistWords = blacklist[postername].words;

        for (var key in  userBlacklistWords) {
          var blacklistWord = key.toUpperCase();
          if (allPostText.indexOf(blacklistWord) != -1) {
            // The post or one of its comments contains a word that's been
            // blacklisted for the original poster. Kill the whole post.
            postNode.style.display = 'none';
          }
        }
      });
    }

    processAllChildCommentNodes(postNode);
  } catch(ex) {
  }
};


var processComment = function(commentNode) {
  try {
    var commenter = commentNode.getElementsByClassName(TWITTER_PERSON_LINK_CLASSNAME)[0].
        innerText.trim();

    // Annotate this element so our lookup can be much faster next time,
    // and wire up event handlers.
    if (!commentNode.classList.contains(APP_COMMENT_DIV_CLASSNAME)) {
      commentNode.classList.add(APP_COMMENT_DIV_CLASSNAME);
      commentNode.setAttribute(APP_COMMENT_USER_ATTRNAME, commenter);
      
      // Walk our parents to find the original post.
      var parentWalkerNode = commentNode;
      var poster = null;
      var postNode = null;
      while (parentWalkerNode) {
        if (parentWalkerNode.classList && 
            parentWalkerNode.classList.contains(APP_POST_DIV_CLASSNAME)) {
          postNode = parentWalkerNode;
          poster = postNode.getAttribute(APP_POST_USER_ATTRNAME);
          break;
        }
        parentWalkerNode = parentWalkerNode.parentNode;
      }
      
      if (poster != null) {
        commentNode.setAttribute(APP_POST_USER_ATTRNAME, poster);
      }
      
      // Set up event handling so that the background task (which runs the context
      // menu) knows which user was right-clicked on.
      commentNode.addEventListener('mousedown', function(event) {
        if (event.button === 2) {
          // Right click.
          updateExtensionContext(poster, commenter);
          
          // Prevent it from triggering the post's right-click handler.
          event.stopPropagation(); 
        }
      });

      if (postNode) {
        commentNode.occasionalIdiotPostNode = postNode;
      }
    }

    // Look up the blacklist collection.
    chrome.storage.sync.get('blacklist', function(response) {
      var blacklist = response.blacklist;
      
      if (!blacklist || !blacklist[commenter]) {
        // This commenter doesn't have a blacklist.
        return;
      }

      // Gather up all the post's text and comments 
      // (or at least currently available comments).
      var nodeToTextify = !!commentNode.occasionalIdiotPostNode ?
          commentNode.occasionalIdiotPostNode : commentNode;

      var allText = nodeToTextify.innerText.toUpperCase();
      var commenterBlacklistWords = blacklist[commenter].words;

      for (var key in  commenterBlacklistWords) {
        var blacklistWord = key.toUpperCase();
        if (allText.indexOf(blacklistWord) != -1) {
          // The post or one of its comments contains a word that's been
          // blacklisted for the original poster. Kill the comment.
          commentNode.style.display = 'none';
        }
      }
    });
  } catch (ex) {
  }
};


var processAllChildPostNodes = function(node) {
  if (node.classList && node.classList.contains(TWITTER_POST_DIV_CLASSNAME)) {
    processWallPost(node);
  } else {
    var postNodes = node.getElementsByClassName(TWITTER_POST_DIV_CLASSNAME);
    for (var iPostNode = 0; iPostNode < postNodes.length; iPostNode++) {
      var postNode = postNodes[iPostNode];
      if (!postNode) {
        continue;
      }

      processWallPost(postNode);
    }
  }
};


var processAllChildCommentNodes = function(node) {
  if (node.classList && node.classList.contains(TWITTER_COMMENT_DIV_CLASSNAME)) {
    processComment(node);
  } else {
    var commentNodes = node.getElementsByClassName(TWITTER_COMMENT_DIV_CLASSNAME);
    for (var iCommentNode = 0; iCommentNode < commentNodes.length; iCommentNode++) {
      var commentNode = commentNodes[iCommentNode];
      if (!commentNode) {
        continue;
      }
      
      processComment(commentNode);
    }
  }
};


var processAllChildNodes = function(node) {
  processAllChildPostNodes(node);
  processAllChildCommentNodes(node);
};


var reprocessPage = function() {
  // Process posts.
  processAllChildNodes(document);
};

document.addEventListener('DOMNodeInserted', function(event) {
  try {
    processAllChildNodes(event.relatedNode);

  } catch (ex) {
    return;
  }
});

// Set up a listener to receive messages from extension.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.reprocessPage) {
    reprocessPage();
  }
  if (request.reloadPage) {
    location.reload();
  }
});

})();
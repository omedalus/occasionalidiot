
(function() {

var FB_POST_DIV_CLASSNAME = '_5jmm';
var FB_BLOCKER_ANCHOR_CLASSNAME = '_52c6';

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

    if (anchor.classList.contains(FB_BLOCKER_ANCHOR_CLASSNAME)) {
      // It was a blocker.
      anchor.remove();
    } else {
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

  // The user's full name is buried in an h5 element.
  // We'll use it as the key.
  var username = postNode.getElementsByTagName('h5')[0].
      getElementsByTagName('a')[0].
      innerText.trim();
  console.log(username);
};

document.addEventListener('DOMNodeInserted', function(event) {
  try {
    var node = event.relatedNode;

    if (node.classList.contains(FB_POST_DIV_CLASSNAME)) {
      processWallPost(node);
    } else {
      var postNodes = node.getElementsByClassName(FB_POST_DIV_CLASSNAME);
      for (var iPostNode = 0; iPostNode < postNodes.length; iPostNode++) {
        processWallPost(postNodes[iPostNode]);
      }
    }
  } catch (ex) {
      console.log(ex);
    return;
  }
});

})();


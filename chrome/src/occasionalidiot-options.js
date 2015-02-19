// Occasional Idiot
// Source file for Chrome plugin options and settings page.
// Copyright (c) 2015 Mikhail Voloshin. All rights reserved.

(function() {

var occasionalIdiotApp = angular.module('occasionalidiot', []);

occasionalIdiotApp.run(['$location', '$rootScope',
    function($location, $rootScope) {
  var blacklist = {};

  var allFriend = {name: 'All friends'};
  $rootScope.allFriend = allFriend;

  var updateFriends = function() {
    var friendNames = [];
    for (var key in blacklist) {
      friendNames.push(key);
    }
    friendNames = friendNames.sort();

    var friendObjList = [allFriend];

    for (var iName in friendNames) {
      var name = friendNames[iName];
      friendObjList.push(blacklist[name]);
    }

    if (!$rootScope.currentFriend) {
      $rootScope.currentFriend = allFriend;
    } else {
      var reindexedCurrentFriend = blacklist[$rootScope.currentFriend.name];
      if (reindexedCurrentFriend) {
        $rootScope.currentFriend = reindexedCurrentFriend;
      } else {
        friendObjList.push($rootScope.currentFriend);
      }
    }

    $rootScope.appFriends = friendObjList;
  };

  var updateWords = function() {
    var words = [];
    for (var iFriend in $rootScope.appFriends) {
      var friend = $rootScope.appFriends[iFriend];

      if (!friend.words) {
        continue;
      }

      var wordsInThisFriend = [];
      for (var key in friend.words) {
        wordsInThisFriend.push(key);
      }
      wordsInThisFriend.sort();
      for (var iWord in wordsInThisFriend) {
        var word = wordsInThisFriend[iWord];
        words.push({
          friend: friend.name,
          word: word
        });
      }
    }
    $rootScope.appWords = words;
  };

  var loadStorage = function(fnListLoaded) {
    chrome.storage.sync.get('blacklist', function(response) {
      blacklist = response.blacklist;
      fnListLoaded && fnListLoaded();

      updateFriends();
      updateWords();
      $rootScope.$apply();
    });
  };

  $rootScope.deleteWord = function(word) {
    if (!word || !word.word || !word.friend) {
      return;
    }
  
    chrome.storage.sync.get('blacklist', function(response) {
      blacklist = response.blacklist;
      if (!blacklist[word.friend]
          || !blacklist[word.friend].words[word.word]) {
        loadStorage();
        return;
      }
      
      delete blacklist[word.friend].words[word.word];
      if (!Object.keys(blacklist[word.friend].words).length) {
        delete blacklist[word.friend];
      }
      
      chrome.storage.sync.set({blacklist: blacklist}, function() {
        loadStorage();
        chrome.runtime.sendMessage({reload: true});
      });
    });
  };

  // Set up a listener to receive messages from extension.
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.reprocessPage) {
      loadStorage();
    }
  });

  loadStorage(function() {
    var urlfriend = $location.search().friend;
    if (!urlfriend) {
      return;
    }
    $rootScope.currentFriend = blacklist[urlfriend];
    if (!$rootScope.currentFriend) {
      $rootScope.currentFriend = {name: urlfriend};
    }
  });
}]);


})();
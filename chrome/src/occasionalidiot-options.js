// Occasional Idiot
// Source file for Chrome plugin options and settings page.
// Copyright (c) 2015 Mikhail Voloshin. All rights reserved.

(function() {

var occasionalIdiotApp = angular.module('occasionalidiot', []);

occasionalIdiotApp.run(['$rootScope', function($rootScope) {
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

    if (!$rootScope.currentFriend ||
        !blacklist[$rootScope.currentFriend.name]) {
      $rootScope.currentFriend = allFriend;
    }

    $rootScope.appFriends = friendObjList;
  };

  var updateWords = function() {
    var friends = [$rootScope.currentFriend];
    if (!$rootScope.currentFriend ||
        $rootScope.currentFriend === allFriend) {
      friends = $rootScope.appFriends;
    }

    var words = [];
    for (var iFriend in friends) {
      var friend = friends[iFriend];

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

  var loadStorage = function() {
    chrome.storage.sync.get('blacklist', function(response) {
      blacklist = response.blacklist;
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
    console.log(response);
    
      blacklist = response.blacklist;
        if (!blacklist[word.friend]
            || !blacklist[word.friend].words[word.word]) {
          return;
        }
        
        delete blacklist[word.friend].words[word.word];
        chrome.storage.sync.set({blacklist: blacklist}, function() {
          loadStorage();
        });
    });
  };

  loadStorage();
}]);


})();
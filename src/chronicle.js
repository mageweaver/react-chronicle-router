import url from 'url';

class chronicle {
  constructor(url) {
    this.url = "";
    this.parsedUrl = {};
    this.parsedUrlPathname = "";
    this.parsedUrlQuery = {};
    this.parsedUrlPathArray = [];

    this.linkOverride = this.overrideRoute.bind(this);
    this.backOverride = this.overrideBackButton.bind(this);

    if(typeof url !== 'undefined' && url !== null) {
      this.setUrl(url);
    }

    this.title = "";
    this.stateData = {};
    this.callback = function(){};
    this.backButtonCallback = function(){};
  }

  parseLocation() {
    this.parsedUrl		= url.parse(this.getLocation());
    this.parsedUrlPathname	= this.parsedUrl.pathname;
    this.parsedUrlQuery		= this.parsedUrl.query;
    this.parsedUrlPathArray	= this.parsedUrlPathname.split("/").splice(1);

    return this.parsedUrl; 
  }

  parseRoutePath(path) {
    return url.parse(path);
  }

  parseRoutePathArray(path) {
    return (url.parse(path)).pathname.split("/").splice(1);
  }

  getLocation() {
    if(typeof window !== 'undefined') {
      return window.location.pathname;
    }
    else {
      return this.url;
    }
  }

  mountHistory(stateData, title, callback, backButtonCallback) {
    this.stateData = stateData;
    this.title = title;
    this.callback = callback;
    this.backButtonCallback = backButtonCallback;

    // Add route override
    var navLinks = document.querySelectorAll('.override-route');
    for(var i=0;i<navLinks.length;i++) {
      navLinks[i].addEventListener('click', this.linkOverride);
    }

    // Add back button override
    window.addEventListener('popstate', this.backOverride); 
  }

  unmountHistory() {
    // Remove route override
    var navLinks = document.querySelectorAll('.override-route');
    for(var i=0;i<navLinks.length;i++) {
      navLinks[i].removeEventListener('click', this.linkOverride);
    }

    // Remove existing backbutton override
    window.removeEventListener('popstate', this.backOverride);
  }

  overrideRoute(event) {
    event.preventDefault();

    // Create a new history item.
    history.pushState(this.stateData, this.title, event.target.attributes['href'].value);

    // Update the title and content - dont specify pageURL - history detects it
    this.callback(event);
  }

  overrideBackButton(event) {
    // Create a new history item.
    history.replaceState(event.state, this.title, window.location.pathname);
    this.backButtonCallback(event);
  }

  saveHistory(state, title) {
    history.replaceState(state, title, window.location.pathname);
  }

  setUrl(url) {
    this.url = url;
  }
};

export default chronicle;

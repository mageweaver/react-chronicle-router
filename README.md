**To install npm i react-chronicle-router --save-dev**

This is a router implementation for ReactJS that fully supports HTML5 History API and Isomorphic applications.  The goal of this router was to full support React .14 as well as provide easy use of state exchange and property control.

**Usage:**

**Step 1 Create a routes.js file**
This file will contain your routes (for both the server and the client) as well as your rendering method on the client-side.
key is required and must be unique - this is required by ReactJS rendering engine.
path is your path
component is your component - you will need to import them into your route.js file.
Routes may be nested however your like, just follow the same settup with {this.props.children} as seen in the Application.jsx below anywhere you nest.
```
var routes = (
  <Route key="applicationKey" path="/" component={Application}>
    <Route key="page1Key" path="/page1" component={Page1}/>
    <Route key="page2Key" path="/page2" component={Page2}/>
    <Route key="page3Key" path="/page3" component={Page3}/>
  </Route>
);

/**
 * Client Rendering Function
 *
 * state is a json representation of your flux stores - this example demonstrates with AltJS
 * location is the path you would like to render - it can be null and the history module will then default to the browser
 * location bar.
 * container is the document.getElementById('content') node object of your div you intend to render to.
 * invalid page may be null or can be a page to display if things go terribly wrong.
 */
exports.renderClient = function(state, location, container, invalidPage) {
  if(typeof window !== 'undefined') {
    // We inflate our flux containers here from AltJS
    var jsonHandle = new jsonHandler(state);
    if(jsonHandle.countKeys()>0) {      // If 0 then there are no stores to inflate - basically a little routine to go through JSON keys.
      alt.bootstrap(state);
    }

    // Best practice to avoid memory leaks in React - unmount existing
    ReactDOM.unmountComponentAtNode(container);

    // This is the routing magic - This method builds our route table based on the criteria provided.
    /**
     * We pass JSON representing the criteria we want available to our routes.
     * routes is required, this is simply the routes we defined above.
     * location may be omitted - defined above
     * container is required - defined above
     * post may be omitted, If we have any query params in our post we would like to send - mostly useful for server-side
     * state may be omitted, This is defined above.
     */
    matchRoute({routes: routes, state:state, container:container, location:location}, (chronicle, routeStatus, routes) => {
      // Match results in a callback with an object representing our history, a routeStatus object and a reference to our routes
      // routeStatus has a lot of data in it - right now we will focus on status - 200 is HTTP for good to go - more on this on the server-side.
      if(routeStatus.status === 200) {
        if(React.isValidElement(routes)===false) { // Make sure routes elements are still valid
          if(typeof invalidPage !== 'undefined' && invalidPage !== null) {
            ReactDOM.render(invalidPage,routeStatus.container);
          }

          return false;
        }

        /**
         * Step 2: prepareRoutes
         *
         * This method simply applies the collected properties setup from
         * the result of matchRoutes and applies it to our route descriptors
         * essentially building a model representing our routing structure.
         */
        var preparedRoutes = prepareRoutes(routes, routeStatus);
        if(preparedRoutes === undefined) {
          if(typeof invalidPage !== 'undefined' && invalidPage !== null) { // Make sure our routes are still valid
            ReactDOM.render(invalidPage,routeStatus.container);
          }

          return false;
        }

        if(React.isValidElement(preparedRoutes)===false) { // Make sure our routes are still valid
          if(typeof invalidPage !== 'undefined' && invalidPage !== null) {
            ReactDOM.render(invalidPage,routeStatus.container);
          }

          return false;
        }
        
        /**
         * Optional Step 3: updateRoutes
         *
         * This method offers us an opportunity to update the properties of any
         * of our routes.  This is a great way to pass state or additional properties.
         * This method is completely optional.
         * For simplicity we wont call it today.
         * updateRoutes(routeStatus, components, props)
         */

        // Render our routes
        ReactDOM.render(preparedRoutes,routeStatus.container);
      }
    });
  }
};

export default routes;
```
Here is an example client.js file in an Isomorphic APP
```
main();

function main() {
  if(typeof window !== 'undefined') {
    window.onload = function() {
      Iso.bootstrap(function (state, container) { // I use ISO with AltJS for my flux transfer from the server - so nice
        renderClient(state, null, document.getElementById("content"), null);
      });
    };
  }
}
```
Here is my Application.jsx
```
class Application extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  componentDidMount() {
    // Make sure to mount our history - its easy as its assigned as a prop from our routing machine.
    /**
     * alt.takeSnapshot is AltJS being awesome and providing a simple method to create JSON from my FLUX stores.
     * cfg.application.title is the title of my application
     * this.onRoute is a callback I use for seemlessly overriding links to ensure lazy rendering occurs instead of
     * follow-up server requests for pages - more on this later - it also takes care of history for us.
     * this.onBackButton is a callback to handle the browser back and forward buttons
     */
    this.props.chronicle.mountHistory(alt.takeSnapshot(), cfg.application.title, this.onRoute, this.onBackButton);
  }

  componentWillUnmount() {
    // Clean up when you are done - if you don't those window events with history can get nasty!
    this.props.chronicle.unmountHistory();
  }

  componentDidUpdate(prevProps, prevState) {
  }

  onRoute = (e) => {
    // Look I am calling the same method from my routes.js file I called from the client.js
    renderClient(alt.takeSnapshot(), null, document.getElementById("content"), null);
  }

  onBackButton = (e) => {
    // Look I am calling the same method from my routes.js file I called from the client.js, one diff here - I am using the event state because I am going backward or forward!
    renderClient(e.state, null, document.getElementById("content"), null);
  }

  // Just add {this.props.children} and routing will do the rest for us.  Anything else you want to add to this component outside of that
  // Will be free from routing and persistant - maybe add a nice permanant navbar - check out react-bootstrap!
  render() {
    return (
      <div className="application">
        {this.props.children}
      </div>
    );
  }
};

Application.defaultProps = {
};

export default Application;
```
Now lets look at one of the components - Page1.jsx
```
import React from 'react';
import alt from '../../alt.js';
import PageStore from './PageStore';
import PageActions from './PageActions';

class Page1 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page             : PageStore.getState() // AltJS - I like to assign my FLUX stores individually so I can include multiple stores in a single component if I choose.
    };
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidMount() {
    // see AltJS
    PageStore.listen(this.onPageChange);
  }

  componentWillUnmount() {
    // see AltJS
    PageStore.unlisten(this.onPageChange);
  }

  onPageChange = (state) => {
    this.setState({page:state}); // see AltJS
    this.props.chronicle.saveHistory(alt.takeSnapshot(), "pages");  // When my FLUX container updates - lets update my browser history man!  This way when a user hits back its like he never left.
  }

  onChange = (e) => {
    // Simple action for my text box below to update my ALTJS flux container
    PageActions.setPageId(e.target.value);
  }
  
  // Now notice in my links below - I use override-route....This is important!
  //  Anywhere I want to override the links in my router to ensure the client intercepts the request and
  // the server never receives them I use this classname.  It also ensures history is insync.  Very easy.
  //  Many routing implementations make this way too hard....like wrapping and using nonstandard links - yuck!
  render() {
    return (
      <div className="page1">
        <h1>PAGE1: {this.state.page.pageId}</h1>
        <br/>
          <input type="text" onChange={this.onChange}/>
        <br/>
        <a href="/page2" className="override-route">Page 2</a>
        <br/>
        <a href="/page3" className="override-route">Page 3</a>
      </div>
    );
  }
};

Page1.defaultProps = {
}

export default Page1;
```
Now Lets look at Page2.jsx - same as Page1 so I will skip the comments! - If you want skip below to see the server-side code!!!
```
mport React from 'react';
import alt from '../../alt.js';
import PageStore from '../Page1/PageStore';
import PageActions from '../Page1/PageActions';

class Page2 extends React.Component {
  constructor(props) {
    super(props);

   this.state = {
      page             : PageStore.getState()
    };
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidMount() {
    PageStore.listen(this.onPageChange);
  }

  componentWillUnmount() {
    PageStore.unlisten(this.onPageChange);
  }

  onPageChange = (state) => {
    this.setState({page:state});
    this.props.chronicle.saveHistory(alt.takeSnapshot(), "pages");
  }

  onChange = (e) => {
    PageActions.setPageId(e.target.value);
  }
render() {
    return (
      <div className="page2">
        <h2>PAGE 2 {this.state.page.pageId}</h2>
        <br/>
          <input type="text" onChange={this.onChange}/>
        <br/>
        <a href="/page1" className="override-route">Page1</a>
      </div>
    );
  }
};

Page2.defaultProps = {
}

export default Page2;
```
This is a simple server.js file
```
'user strict';

import express from 'express';
const app = express();
import cfg from './cfg/server.config.json';
import log from './svr/log.js';
import setup from './svr/setup.js';
var setupEngine = setup(app, cfg);
import template from './svr/template.js';
var templateEngine = template(app, cfg);
import secure from './svr/secure.js';
var secureEngine = secure(app);
import register from './rst/register.js';
var registerEngine = register(app);
import signin from './rst/signin.js';
var signinService = signin(app, cfg, log);
// MAGIC HAPPENS HERE
// See these two lines and then go to the next file!!!!
import render from './svr/render.js';
var renderEngine = render(app, cfg, log);

var listener = app.listen(app.get('port'), () => {
  log.info("server is listening on port:" + listener.address().port);
});
```
Below is what is in my render.js file - remember it includes routes.js as well as react and react-dom/server
It may look scary but I have a lot of stuff in here including WEBPACK REACT HOT LOADING, ISO/ALTJS - I will explain!
```
export default function(app, cfg, log) {
  // Express rocks - I choose to use a middleware method here that I do not return from (no use of next)
  app.use(function(request, response, next) {
    // You may remember this method from our route.js file.  This one is tuned for server-side
    // we require location now - no browser location bar
    // also notice I added post here just incase!
    matchRoute({routes: routes, location: request.url, post: request.body}, (chronicle, routeStatus, routes) => {
      if(routeStatus.status === 500) {  // standard http internal error
        response.status(500).send(routeStatus.message);
      }
      else if(routeStatus.status === 302) {       // redirection capability
        //response.redirect(302, redirectLocation.pathname + redirectLocation.search);
      }
      else if(routeStatus.status === 200) {  // HTTP ALL IS GOOD SO LETS RENDER
        log.info('preparing routes:'+routes.props.path);
        // WE KNOW THIS GUY!
        var preparedRoutes = prepareRoutes(routes, routeStatus);
        if(preparedRoutes!==undefined) {
          log.info('our routes are defined');
          log.info('displayName:'+preparedRoutes.props.name);
        }

        // YES WE USE ISO HERE AND NEED TO GET IT READY IT MAKES DEALING WITH FLUX FROM ALTJS A SYNCH!
        var iso = new Iso();
        
        // LETS RENDER OUR REACT CODE TO A STRING - WE ARE SERVER SIDE - NO DOM HERE
        var appString = ReactDOMServer.renderToString(preparedRoutes);


        // DEAL WITH FLUX
        if(routeStatus.post.stores !== undefined) {
          alt.bootstrap(routeStatus.post.stores);
          iso.add(appString, alt.flush());
        }
        else {
          iso.add(appString);
        }

        // ARE WE USING WEBPACK HOT LOADING, IF WE ARE AND I HOPE YOU DO IT ROCKS!!!
        if(cfg.httpd.hot==true) {
          log.info('hot loading enabled');
          var hotLoadPort = cfg.httpd.hotPort;
          var hotLoadIp = cfg.httpd.hotHost;
          var scriptString = '<script src="http://'+cfg.httpd.hotHost+':' + cfg.httpd.hotPort + '/'+cfg.application.commonsBundle+'" ></script>' +
          '<script src="http://'+cfg.httpd.hotHost+':' + cfg.httpd.hotPort + '/'+cfg.application.mainBundle+'"></script>';
          // SEND THE RESPONSE AND INJECT THE MARKUP INTO OUR TEMPLATE - JADE, SWIG, or WEBPACK HTML PLUGIN all work great
          response.status(200).render(cfg.httpd.hotTemplate, {markup: iso.render(), script: scriptString});
        }
        else {
          log.info('cold loading enabled');
          // NOW DO THE SAME IN PRODUCTION WITHOUT HOT LOADING
          response.status(200).render(cfg.httpd.template, {markup: iso.render()});
        }
      }
      else if(routeStatus.status === 404) {
        // 404 ERROR
        response.status(404).send(routeStatus.message);
      }
    });
  });
}
        
```
Thats it easy and highly functional!!!!!

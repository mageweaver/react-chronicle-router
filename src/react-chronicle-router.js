import React from 'react';
import {chronicle} from './chronicle.js'

export class Route extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      path	: this.props.path,
      isActive	: this.props.isActive,
      component	: this.props.component,
      onMount	: this.props.onMount,
      onUnmount	: this.props.onUnmount
    };
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidMount() {
    if(this.state.onMount !== undefined) {
      this.state.onMount(this);
    }
  }

  componentWillUnmount() {
    if(this.state.onUnmount !== undefined) {
      this.state.onUnmount(this);
    }
  }

  render() {
    if(this.props.isActive) {
      return (<this.props.component {...this.props}>{this.props.children}</this.props.component>);
    }
    else {
      return false;
    }
  }
};

Route.propTypes = {
  history	: React.PropTypes.object,
  path		: React.PropTypes.string.isRequired,
  isActive	: React.PropTypes.bool,
  component	: React.PropTypes.func.isRequired,
  onMount	: React.PropTypes.func,
  onUnmount	: React.PropTypes.func
};

Route.defaultProps = {
  isActive	: false,
  properties	: {}
};

/**
 * Step 1: matchRoute
 *
 * This method builds our route table based on the criteria provided.
 *
 * criteria: (transport that describes our routes and state)
 *   1. routes          : routes.js decriptor file
 *   2. location        : request location - required on the server side
 *   3. post            : request paramters
 *   4. container       : reactjs container div
 */
export function matchRoute(criteria, callback) {
  var h;

  /**
   *  We need to let the chronicle module know what our selected location is
   *  if it exists otherwise we will default to attempting to get it from
   *  the browser.  In otherwords we must provide this server side.
   */
  if(typeof criteria.location !== 'undefined') {
    h = new chronicle(criteria.location);
  }

  /**
   * Parses the location into its parts.
   */
  h.parseLocation();

  /**
   * This deactivates all the routes listed in our route descriptor
   * file.  Almost like reseting the view.
   */
  var routes = inactivateRoutes(criteria.routes);

  /**
   * matches the route to our current location or returns an
   * HTTP error.
   */
  var routeStatus       = matchRoutes(h, routes, null, 0);

  /**
   * Now lets ensure the request parameters travel to the callback.
   */
  if(criteria.post !== undefined) {
    routeStatus.post    = criteria.post;
  }

  /**
   * Now lets ensure the state travels to the callback.
   */
  if(criteria.state !== undefined) {
    routeStatus.state   = criteria.state;
  }

  /**
   * Now lets ensure the container travels to the callback.
   */
  if(criteria.container !== undefined) {
    routeStatus.container = criteria.container;
  }

  /**
   * Invoke the callback with the chronicle, the route setup and status,
   * and the route descriptor.
   */
  callback(h, routeStatus, routes);
}

function matchRoutes(chronicle, route, parent, origin) {
  var routeStatus = {
    status              : 0,
    message             : "",
    routeProperties     : [
    ],
    setRouteStatus      : setRouteStatus
  };

  if(route===undefined) {
    return routeStatus.setRouteStatus(404,"'"+chronicle.parsedUrlPathname+"' not found.");
  }

  // Check on whether we have a perfect or partial match to our location from the route
  var matchIndices = comparePath(chronicle, route.props.path, origin);

  if(parent !== null && matchIndices[0] === -1) {       // No match found
    return routeStatus.setRouteStatus(404,"'"+chronicle.parsedUrlPathname+"' not found.");
  }

  if(matchIndices[0] !== -1 && matchIndices[1] === chronicle.parsedUrlPathArray.length) {       // Perfect Match
    routeStatus = routeStatus.setRouteStatus(200,"Ok.");
    routeStatus.routeProperties.push({path: route.props.path, chronicle: chronicle, isActive: true, name: route.props.component.name});
    return routeStatus;
  }

  if(parent === null || (matchIndices[0] !== -1 && matchIndices[1] < chronicle.parsedUrlPathArray.length)) {// Match, but now check children for perfect match
    if(React.Children.count(route.props.children)==0) {   // No children so match incomplete and therefore 404
      return routeStatus.setRouteStatus(404,"'"+chronicle.parsedUrlPathname+"' not found.");
    }

    var result;
    var children = React.Children.toArray(route.props.children);
    for(var x=0;x<children.length;x++) {
      var offset = (parent===null)?0:(matchIndices[1]-1);
      result = matchRoutes(chronicle, children[x], route, offset);
      if(result.status === 200) {
        result.routeProperties.unshift({path: route.props.path, chronicle: chronicle, isActive: true, name: route.props.component.name});
        break;
      }
    }

    return result;
  }

  return routeStatus.setRouteStatus(404,"'"+chronicle.parsedUrlPathname+"' not found.");
}

function comparePath(chronicle, routePath, origin) {
  var matchIndices = [-1, -1];
  var routePathArray = chronicle.parseRoutePathArray(routePath);

  if(routePath.toLowerCase() === chronicle.parsedUrlPathname.toLowerCase()) {   // Perfect match.
    matchIndices[0] = 0;
    matchIndices[1] = chronicle.parsedUrlPathArray.length;
    return matchIndices;
  }

  var x = 0;

  for(var i=origin;i<chronicle.parsedUrlPathArray.length;i++) {
    if(x === routePathArray.length) {
      break;
    }

    if(routePathArray[x].toLowerCase() === chronicle.parsedUrlPathArray[i].toLowerCase()) {     // At least a partial match.
      matchIndices[0] = i;
      matchIndices[1] = i+1;
      x++;
    }
  }

  return matchIndices;
}

function inactivateRoutes(routes) {
  var children = [];
  React.Children.map(routes.props.children, function (child) {
    children.push(inactivateRoutes(child));
  });

  return React.cloneElement(routes, {isActive: false}, children);
}

function setRouteStatus(status, message) {
  this.status = status;
  this.message = message;

  return this;
}

/**
 * Step 2: prepareRoutes
 *
 * This method simply applies the collected properties setup from
 * the result of matchRoutes and applies it to our route descriptors
 * essentially building a model representing our routing structure.
 */
export function prepareRoutes(routes, routeStatus) {
  var children = [];

  if(React.Children.count(routes.props.children)>0) {
    React.Children.map(routes.props.children, function (child) {
      children.push(prepareRoutes(child, routeStatus));
    });
  }

  for(var i=0;i<routeStatus.routeProperties.length;i++) {
    if(routeStatus.routeProperties[i].name === routes.props.component.name) {
      var properties = {};
      Object.keys(routeStatus.routeProperties[i]).forEach(function(k) {
        properties[k] = routeStatus.routeProperties[i][k];
      });
    }
  }

  return React.cloneElement(routes, properties, children);
}

/**
 * Optional Step 3: updateRoutes
 *
 * This method offers us an opportunity to update the properties of any
 * of our routes.  This is a great way to pass state or additional properties.
 * This method is completely optional.
 */
export function updateRoutes(routeStatus, components, props) {
  for(var i=0;i<routeStatus.routeProperties.length;i++) {
    for(var x=0;x<components.length;x++) {
      if(routeStatus.routeProperties[i].name.toLowerCase() === components[x].toLowerCase() ||
         routeStatus.routeProperties[i].path.toLowerCase() === components[x].toLowerCase()) {
        Object.keys(myVar).forEach(function(k) {
          routeStatus.routeProperties[i][k] = props[k];
        });
      }
    }
  }

  return routeStatus;
}

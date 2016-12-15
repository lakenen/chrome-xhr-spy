# chrome-xhr-spy

XHR spy for Chrome extensions. **Warning: super hacky. Use at your own risk.**


## Installation

```
npm install chrome-xhr-spy
```


## Usage

`var spy = injectXHRSpy(config)`

* **config**
  * **modify** - whether or not to allow modifying the request or response data (this blocks the request until the passed callback is called).
  * **filter** - filter options for the request
    * **request** - whether to spy the request
    * **response** - whether to spy the response
    * **url** - object with URL filter options
      * **pathname** - string pathname to match (exact)
      * **search** - object with search params to match
    * **method** - the type of request to match ('GET', 'PUT', 'POST', etc)
  * **callback** - callback function to call with the form `function (data, info[, callback])`

#### Returns

Object with `remove` method that disables removes the spy.


Example
```js
var injectXHRSpy = require('chrome-xhr-spy')

var requestSpy = injectXHRSpy({
  filter: { request: true, pathname: '/api/v1/blah' },
  callback: function (requestData) {
    // does not block the request
    console.log(requestData)
  }
})
var responseSpy = injectXHRSpy({
  modify: true
  filter: { response: true, pathname: '/api/v1/blah' },
  callback: function (responseData, info, callback) {
    // blocks any response handlers from running until callback is called
    console.log(responseData)
    callback({ lol: 'no data 4 u' })
  }
})

// some time in the future...
requestSpy.remove()
responseSpy.remove()

```


## License

([The MIT License](LICENSE))

Copyright 2016 Emburse, Inc

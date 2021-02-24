const memcached = require('memcached')

class Memcached {

  constructor(object) {
    this.memcached            = new memcached(object.server, object.options)
    this.memcached_update_mc  = object.update
    this.memcached_update_sec = this.memcached_update_mc / 1000 * 2
  }

}

module.exports = Memcached

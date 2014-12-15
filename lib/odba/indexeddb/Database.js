/**
 * An IndexedDB database.
 *
 * @class
 * @protected
 *
 * @property {IndexedDBConnection} connection The connection.
 * @property {String} name                    The database name.
 * @property {Number} version                 The database version.
 *
 * @param {IndexedDBConnection} cx  The connection.
 * @param {IDBDatabase} db          The native database.
 */
function IndexedDBDatabase(cx, db) {
  Object.defineProperty(this, "connection", {value: cx});
  Object.defineProperty(this, "name", {value: db.name, enumerable: true});
  Object.defineProperty(this, "version", {value: db.version, enumerable: true});
  Object.defineProperty(this, "native", {value: db});
  Object.defineProperty(this, "objectStoreNames", {value: []});

  for (var i = 0, stores = db.objectStoreNames; i < stores.length; ++i) {
    this.objectStoreNames.push(String(stores[i]));
  }
}

/**
 * Returns the native active transaction of the connection.
 *
 * @private
 */
IndexedDBDatabase.prototype.__defineGetter__("transaction", function() {
  return this.connection.transaction;
});

/**
 * @private
 *
 * @returns {Boolean}
 */
IndexedDBDatabase.prototype.containsObjectStore = function containsObjectStore(name) {
  return this.native.objectStoreNames.contains(name);
};

/**
 * @private
 *
 * @returns {Boolean}
 */
IndexedDBDatabase.prototype.containsObjectStores = function containsObjectStores(names) {
  var res;

  //(1) check
  res = true;

  for (var i = 0; i < names.length; ++i) {
    if (!this.containsObjectStore(names[i])) {
      res = false;
      break;
    }
  }

  //(2) return
  return res;
};

/**
 * Does the object store exist?
 *
 * @param {String} name       The object store name.
 * @param {Function} callback The function to call: fn(exists).
 *
 * @example
 * db.hasTable("user", function(error, exists) { ... });
 */
IndexedDBDatabase.prototype.hasTable = function hasTable(name, callback) {
  //(1) arguments
  if (arguments.length < 2) {
    throw new Error("Table name and callback expected.");
  }

  //(2) check
  callback(undefined, this.containsObjectStore(name));
};

/**
 * Do the object stores exist?
 *
 * @param {String[]} names    The object store names.
 * @param {Function} callback The function to call: fn(exist).
 *
 * @example
 * db.hasTables(["user", "session"], function(error, exist) { ... });
 */
IndexedDBDatabase.prototype.hasTables = function hasTables(names, callback) {
  var res;

  //(1) arguments
  if (arguments.length < 2) {
    throw new Error("Table names and callback expected.");
  }

  //(2) check
  if (names.length == 0) {
    res = false;
  } else {
    res = true;

    for (var i = 0; i < names.length; ++i) {
      if (!this.containsObjectStore(names[i])) {
        res = false;
        break;
      }
    }
  }

  //(3) return
  callback(undefined, res);
};

/**
 * Returns an object store synchronously.
 * Note: A transaction must be active.
 *
 * @private
 *
 * @param {String} name The object store name.
 *
 * @returns {IndexedDBTable}
 */
IndexedDBDatabase.prototype.getTable = function getTable(name) {
  return new IndexedDBTable(this, this.transaction.getObjectStore(name));
};

/**
 * Returns an object store.
 *
 * @param {String} name       The object store name.
 * @param {Function} callback The function to call: fn(error, store).
 *
 * @example
 * db.findTable("user", function(error, store) { ... });
 */
IndexedDBDatabase.prototype.findTable = function findTable(name, callback) {
  var table;

  //(1) arguments
  if (arguments.length < 2) {
    throw new Error("Table name and callback expected.");
  }

  //(2) check
  if (this.containsObjectStore(name)) {
    var tran;

    //get tran to know key path
    tran = this.connection.beginTransaction({
      error: function(e) { callback(e); }
    });

    //get object store
    table = new IndexedDBTable(this, tran.getObjectStore(name));
  }

  //(3) return
  callback(undefined, table);
};

/**
 * Creates a new object store.
 * Note: This operation must be run into a version change transaction.
 *
 * @param {String} name         The object store name.
 * @param {Object} [options]    The creation options: keyPath or id (String) and
 *                              autoIncrement (Boolean).
 * @param {Function} [callback] The function to call: fn(error, store).
 *
 * @example
 * db.createTable("user");
 * db.createTable("user", function(error, store) { ... });
 * db.createTable("user", {id: "userId", autoIncrement: true});
 * db.createTable("user", {id: "userId", autoIncrement: true}, function(error, store) { ... });
 */
IndexedDBDatabase.prototype.createTable = function createTable(name, options, callback) {
  var tran, util = odba.util;

  //(1) arguments
  if (arguments.length < 1) {
    throw new Error("Table name expected.");
  } else if (arguments.length == 2) {
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
      options = undefined;
    }
  }

  options = util._extend({}, options);

  if (options.hasOwnProperty("id") && !options.hasOwnProperty("keyPath")) {
    options.keyPath = options.id;
  }

  //(2) get transaction
  tran = this.transaction;

  if (!tran) {
    if (callback) callback(new Error("Database.createTable() only into Connection.createDatabase() or Connection.alterDatabase()."));
    return;
  }

  //(3) create
  if (this.native.objectStoreNames.contains(name)) {
    if (callback) callback(new Error("Object store '" + name + "' already exists."));
  } else {
    var store = this.native.createObjectStore(name, options);
    if (callback) callback(undefined, new IndexedDBTable(this, store));
  }
};

/**
 * Creates new object stores.
 * Note: This operation must be run into a version change transaction.
 *
 * @param {Object[]} stores     The object stores: name (String), keyPath (String) and autoIncrement (Boolean).
 * @param {Function} [callback] The function to call: fn(error, stores).
 *
 * @example
 * db.createTables([
 *   {name: "user", id: "userId", autoIncrement: true},
 *   {name: "session", id: "sessionId", autoIncrement: true}
 * ], function(error, stores) { ... });
 */
IndexedDBDatabase.prototype.createTables = function createTables(stores, callback) {
  var tran;
  var res = [];

  //(1) get tran
  tran = this.transaction;

  if (!tran) {
    if (callback) callback(new Error("Database.createTables() only into Connection.createDatabase() or Connection.alterDatabase()."));
    return;
  }

  //(2) create
  for (var i = 0; i < stores.length; ++i) {
    var store = stores[i];
    res.push(new IndexedDBTable(this, this.native.createObjectStore(store.name, store)));
  }

  //(3) callback
  if (callback) callback(undefined, res);
};

/**
 * Drops a object store.
 * Note: This operation must be run into a version change transaction.
 *
 * @param {String} name         The object store name.
 * @param {Function} [callback] The function to call: fn(error).
 */
IndexedDBDatabase.prototype.dropTable = function dropTable(name, callback) {
  var tran;

  //(1) get tran
  if (!this.connection.hasTransaction("versionchange")) {
    if (callback) callback(new Error("Database.dropTable() only into Connection.alterDatabase()."));
    return;
  }

  tran = this.connection.transaction;

  //(2) drop
  if (this.containsObjectStore(name)) {
    this.native.deleteObjectStore(name);
  }

  //(3) callback
  if (callback) callback();
};

/**
 * Returns an index.
 *
 * @param {String} table      The table name.
 * @param {String} index      The index name.
 * @param {Function} callback The function to call: fn(error, index).
 *
 * @example
 * db.findIndex("user", "ix_username", function(error, ix) { ... });
 */
IndexedDBDatabase.prototype.findIndex = function findIndex(table, index, callback) {
  var tran, store, ix;

  //(1) arguments
  if (arguments.length < 3) {
    throw new Error("Table name, index name and callback expected.");
  }

  //(2) get index
  if (this.containsObjectStore(table)) {
    //get transaction
    tran = (this.activeTransaction || this.native.transaction([table], "readonly"));

    //get store
    store = tran.objectStore(table);

    //get index
    if (store.indexNames.contains(index)) {
      var tab = new IndexedDBTable(this, store);
      ix = tab.indexes[index];
    }
  }

  //(3) return index
  callback(undefined, ix);
};

/**
 * Checks whether a table has a specified index.
 *
 * @param {String} table      The object store name.
 * @param {String} ix         The index name.
 * @param {Function} callback The function to call: fn(error, exist).
 */
IndexedDBDatabase.prototype.hasIndex = function hasIndex(table, ix, callback) {
  var tran, res;

  //(1) arguments
  if (arguments.length < 3) {
    throw new Error("Table name, index name and callback expected.");
  }

  //(2) check object store
  if (!this.containsObjectStore(table)) {
    res = false;
  } else {
    tran = this.connection.beginTransaction(undefined, table);
    tran.on("error", function(e) { callback(e); });

    var store = tran.getObjectStore(table);
    res = store.indexNames.contains(ix);
  }

  //(3) check
  callback(undefined, res);
};

/**
 * Creates an index.
 * Note: This method must be run into a version change transaction.
 *
 * @param {String} table        The object store name.
 * @param {String} index        The index name.
 * @param {String} col          The indexing column.
 * @param {Object} [options]    The index options: unique (boolean).
 * @param {Function} [callback] The function to call: fn(error).
 *
 * @example
 * db.createIndex("user", "ix_username", "username");
 * db.createIndex("user", "ix_username", "username", function(error) { ... });
 * db.createIndex("user", "ix_username", "username", {unique: true});
 * db.createIndex("user", "ix_username", "username", {unique: true}, function(error) { ... });
 */
IndexedDBDatabase.prototype.createIndex = function createIndex(table, index, col, options, callback) {
  var tran, store;

  //(1) arguments
  if (arguments.length < 3) {
    throw new Error("Table name, index name and indexing column name expected.");
  } else if (arguments.length == 4) {
    if (arguments[3] instanceof Function) {
      callback = arguments[3];
      options = undefined;
    }
  }

  //(2) create
  if (!this.connection.hasTransaction("versionchange")) {
    if (callback) callback(new Error("Database.createIndex() only into Connection.createDatabase() or Connection.alterDatabase()."));
  } else {
    tran = this.transaction;

    if (!this.containsObjectStore(table)) {
      if (callback) callback(new Error("Object store '" + table + "' doesn't exist."));
    } else {
      store = tran.getObjectStore(table);

      if (store.indexNames.contains(index)) {
        if (callback) callback(new Error("Index '" + index + "' on '" + table + "' already exists."));
      } else {
        store.createIndex(index, col, options);
        if (callback) callback();
      }
    }
  }
};

/**
 * Drops an index.
 *
 * @param {String} table        The object store name.
 * @param {String} index        The index name.
 * @param {Function} [callback] The function to call: fn(error).
 *
 * @example
 * db.dropIndex("user", "ix_username");
 * db.dropIndex("user", "ix_username", function(error) { ... });
 */
IndexedDBDatabase.prototype.dropIndex = function dropIndex(table, index, callback) {
  var tran, store;

  //(1) arguments
  if (arguments.length < 2) {
    throw new Error("Table name and index name expected.");
  }

  //(2) drop
  if (!this.connection.hasTransaction("versionchange")) {
    if (callback) callback(new Error("Database.dropIndex() only into Connection.alterDatabase()."));
  } else {
    tran = this.transaction;

    if (this.containsObjectStore(table)) {
      store = tran.getObjectStore(table);
      if (store.indexNames.contains(index)) store.deleteIndex(index);
    }

    if (callback) callback();
  }
};
/**
 * An IndexedDB driver.
 *
 * @class
 * @extends Driver
 * @protected
 */
function IndexedDBDriver() {
  IndexedDBDriver.super_.call(this, "IndexedDB");
}

odba.util.inherits(IndexedDBDriver, odba.Driver);

/**
 * Creates a connection object to the IndexedDB engine.
 *
 * @param {Object} config The connection configuration: database (String).
 * @returns {IndexedDBConnection}
 *
 * @example
 * cx = drv.createConnection({database: "mydb"});
 */
IndexedDBDriver.prototype.createConnection = function createConnection(config) {
  //(1) pre
  if (!config || !config.database) throw new Error("Database name expected.");

  //(2) return connection
  return new IndexedDBConnection(config);
};
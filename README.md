# odba-indexeddb

`ODBA` (Open Database API) is an asynchronous API for the JavaScript language
that programmers can use to access data such as databases.
The ODBA philosophy is similar to the `Node.js` API's.

`odba-indexeddb` is the `IndexedDB` driver to use with the browsers.

The unit testing is performed using `Should.js` and `Mocha` on:

  - Chrome.
  - Firefox.


## Terminology

IndexedDB is a document-oriented database and it uses its own terminology:

- Database = Database
- Object store = Table (SQL) or Collection (MongoDB or CouchDB)
- Record = Row (SQL) or Document (MongoDB or CouchDB)
- Key path = Primary key (SQL) or Id (MongoDB or CouchDB)
- Index = Index

## Getting the driver

First of all, we have to get the IndexedDB driver:

  ```
  var drv = Driver.getDriver("IndexedDB");
  ```

## Getting the connection

Once we have the driver, the next thing is getting a connection:

  ```
  var cx = drv.createConnection({database: "dbName"});
  ```

## Creating a database

To create a database, we must use the method `Connection.createDatabase()`, with a closed
connection.

### Creating an empty database

To create an empty database:

  ```
  cx.createDatabase();
  cx.createDatabase(null, function(error) { ... });
  ```

### Creating a non-empty database

To create a database with tables:

  ```
  cx.createDatabase(function(db) { ... });
  cx.createDatabase(function(db) { ... }, function(error) { ... });
  ```

## Creating tables (object stores)

To create a table, we use the methods `Database.createTable()` into a `createDatabase()`
or `alterDatabase()`.

During the database creation:

  ```
  //(1) create connection
  var cx = drv.createConnection({database: "mydb"});

  //(2) create database
  cx.createDatabase(function(db) {
    db.createTable("user", {keyPath: "userId"});
    db.createTable("session", {keyPath: "sessionId"});
  }, function(error) {
    //...
  });
  ```

After the database creation:

  ```
  //(1) create connection
  var cx= drv.createConnection({database: "mydb"});

  //(2) alter database
  cx.alterDatabase(function(db) {
    db.createTable("user", {keyPath: "userId"});
    db.createTable("session", {keyPath: "sessionId"});
  }, function(error) {
    //...
  });
  ```

## Dropping tables (object stores)

Dropping a table is easy, we have to use the `Database.dropTable()` into a
`Connection.alterDatabase()` method:

  ```
  cx.alterDatabase(function(db) {
    db.dropTable("store");
    db.dropTable("store", function(error) { ... });
  }, function(error) {
    //...
  });
  ```

## Creating indexes

Similar to creating tables (object stores).

During the database creation:

  ```
  cx.createDatabase(function(db) {
    db.createTable("user", {keyPath: "userId"}, function(error) {
      if (!error) db.createIndex("user", "ix_username", "username", {unique: true});
    });
  });
  ```

After the database creation:

  ```
  cx.alterDatabase(function(db) {
    db.createIndex("user", "ix_username", "username", {unique: true});
  });
  ```

## Dropping indexes

Similar to tables:

  ```
  cx.alterDatabase(function(db) {
    db.dropIndex("store", "index");
    db.dropIndex("store", "index", function(error) { ... });
  });
  ```

## Opening the connection

`Connection.open()` opens the connection:

  ```
  cx.open();
  cx.open(function(error, db) { ... });
  ```

**Important** The connection to create and to alter databases must be closed.
Only the R/W connections must be opened.

## Closing the connection

We have to call the method `Connection.close()`:

  ```
  cx.close();
  cx.close(function(error) { ... });
  ```

## Finding data

First of all, we have to find its table (or object store):

  ```
  db.findTable("user", function(error, table) {
    //...
  });
  ```

Next, we can use `Table.find()`, `Table.findOne()` and `Table.findAll()`:

  ```
  table.find({userId: 1}, function(error, result) {
    //result is an array
  });

  table.findOne({userId: 1}, function(error, record) {
    //record is an object
  });

  table.findAll(function(error, result) {
    //result is an array
  });
  ```

## Inserting data

Similar to find, but using `Table.insert()`:

  ```
  db.findTable("user", function(error, table) {
    table.insert(
      {userId: 1, username: "user01", password: "pwd01"},
      function(error) { ...  }
    );
  });
  ```

To insert several objects:

  ```
  table.insert([
    {userId: 1, username: "user01", password: "pwd01"},
    {userId: 2, username: "user02", password: "pwd02"}
  ], function(error) {
    //...
  });
  ```

## Updating data

Using `Table.save()`:

  ```
  table.save({userId: 1, username: "user01", password: "PwD01"}, function(error) { ... });
  ```

## Deleting data

We can use `Table.remove()`:

  ```
  //truncate
  table.remove();
  table.remove(function(error) { ... });

  //delete
  table.remove({userId: 1});
  table.remove({userId: 1}, function(error) { ... });
  ```
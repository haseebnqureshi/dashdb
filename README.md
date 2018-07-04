Quick, simple, durable JSON document DB for quick alpha rollouts, complete with AWS S3 backups with customizable chron scheduling.

# DashDB

![npm monthly downloads](https://img.shields.io/npm/dm/dashdb.svg)
![github license](https://img.shields.io/github/license/haseebnqureshi/dashdb.svg)

### npm install dashdb --save

### Purpose & Features
For (1) quickly spinning up alpha projects, (2) without worry about database drivers, connection strings, and separate databases, (3) non-relational or relational style JSON document storing, (4) complete with backups and custom scheduling onto AWS S3, (5) with document hashing, (6) atomic file writing, (7) UUID like id generation, (8) primary key overrides, and (9) created and modified timestamps and generation (with modifiable keys).

### Getting Started - Easy Start
```
var users = require('dashdb')('users');

// view all available methods on the users collection
console.log(users);
```

### Options - Intermediate / Advanced Start
```
var options = {
	pk: 'id', /* primary key */
	pkEntropy: 32, /* primary key entropy */
	hk: 'hash', /* hash key */
	ck: 'created', /* created key */
	mk: 'modified' /* modified key */,
	uid: null, /* user id for any temporary writes, user permissions */
	gid: null, /* group id for any temporary writes, group permissions */
	autoWrite: true, /* whether data is automatically written to filesystem on any change, except for empty() */
	backupSchedule: '* 0 * * *', /* chron schedule for every midnight, @see https://www.npmjs.com/package/node-schedule */
	s3BucketName: '', /* bucket where data backups will be uploaded onto */
	s3BucketPath: 'dashdb/', /* defaulting to uploading any s3 files into a folder, in the bucket */
	s3AccessKey: '', /* aws access key for s3 put object permissions */
	s3SecretAccessKey: '', /* aws secret access key for s3 put object permissions */
	s3FileKey: `moment().format('YYYY/MM') + '/' + moment().format() + '-' + path.basename(filepath)` /* js eval to create file key onto s3 */
};

var users = require('dashdb')('users', options);
```

### AWS S3 Backups - Configuration
To keep things simple yet flexible, our DashDB's AWS backups work on a collection by collection basis. That way, you can set them all to the same bucket, same backup schedule, same folder - or not!

Every backup is timestamped and fully customizable. For ease and convenience, here are the relevant options you'd need to initialize any collection for easy and automatic backups.

Please note: this is not a typical chron, but stays alive with the node application. In other words, if your app goes down, so will this backup protocol. While this might seem like a weakness, this can be a strenth in prototyping quickly. If you use any keep-alive script to maintain your app, or even Elastic Beanstalk, your data backups should work well.

```
var options = {
	backupSchedule: '* 0 * * *', /* chron schedule for every midnight, @see https://www.npmjs.com/package/node-schedule */
	s3BucketName: '', /* bucket where data backups will be uploaded onto */
	s3BucketPath: 'dashdb/', /* defaulting to uploading any s3 files into a folder, in the bucket */
	s3AccessKey: '', /* aws access key for s3 put object permissions */
	s3SecretAccessKey: '', /* aws secret access key for s3 put object permissions */
	s3FileKey: `moment().format('YYYY/MM') + '/' + moment().format() + '-' + path.basename(filepath)` /* js eval to create file key onto s3 */
};

var users = require('dashdb')('users', options);
```

### AWS S3 Backups - Run or Scheduling
To prevent any scenario with duplciative data backups onto S3, from say having multiple instances of any collection loaded for a number of users, use either the ```s3()``` or ```scheduleS3()``` methods on any collection with the main script for your app.

```require('dashdb')('users').s3()``` starts backing up your collection data onto S3 without delay

```require('dashdb')('users').scheduleS3()``` initiates the backup schedule for your data, according to the ```backupSchedule``` you've specified, or the default timing for once every day at midnight

For example, okay use: After defining your ExpressJS app, calling ```scheduleS3()``` onto each collection.

For example, not okay use: Calling ```scheduleS3()``` whenever a request is made and completing a query against any collection.

### Primary Key
By default, the primary key is simply ```id``` and DashDB auto-generates that identifier for each row (or JSON document). Alternatively, you have the option of overriding the auto-generated identifier by simply passing your own value for the ```id```.

Additionally, you can override the default ```id``` naming convention with the following option, along with the entropy involved in generating the UUID like value, if you're relying on DashDB to generate that primary key:

```
var options = {
	pk: 'id', /* primary key */
	pkEntropy: 32, /* primary key entropy */
};

var users = require('dashdb')('users', options);
```

### Document Hashing
To help with enforcing uniqueness of data records througout your application, DashDB creates and stores a document hash. This is generated by taking hashing the entire record, minus its primary key, created key, modified key, or its resulting hash key.

You can override the default ```hash``` naming convention with the following option, or completely disable the hashing mechanism by passing an empty string:

```
var options = {
	hk: 'hash' /* hash key */
};

var users = require('dashdb')('users', options);
```

### Auto Write - Syncing or Committing
By default, any manipulations onto your collection data will be persisted to the saved version on your filesystem. By passing a boolean of ```false``` to option ```autoWrite```, you can disable this and manually call either ```sync()``` or ```commit()``` on any collection and save any manipulations to your collection data.

```
var options = {
	autoWrite: true /* whether data is automatically written to filesystem on any change, except for empty() */
};

var users = require('dashdb')('users', options);
```

```require('dashdb')('users').commit()``` persists any collection data manipulation or additions onto the filesystem

```require('dashdb')('users').sync()``` is an alias of ```commit()```

### Atomic File Writes
For accomodating potentially heavy and or concurrent file writes between multiple users, DashDB leverages the work from ```write-file-atomic``` and exposes two parameters (both require integers) that can help ensure the intregity of data during race conditions or high concurrency:

```
var options = {
	uid: null, /* user id for any temporary writes, user permissions */
	gid: null /* group id for any temporary writes, group permissions */
};

var users = require('dashdb')('users', options);
```

### Query Methods
```require('dashdb')('users').all()``` retrieves all the records for that collection

```require('dashdb')('users').append(item1, item2, ...)``` inserts any number of items into your collection

```require('dashdb')('users').add(item1, item2, ...)``` is an alias of ```append()```

```require('dashdb')('users').create(item1, item2, ...)``` is an alias of ```append()```

```require('dashdb')('users').delete(predicate)``` removes any records matching that ```predicate``` object

```require('dashdb')('users').empty()``` completely removes all records from the collection and should be used with caution

```require('dashdb')('users').update(predicate, values)``` updates any records matching the ```predicate``` object with the ```values``` object

```require('dashdb')('users').where(predicate)``` retrieves all records matching the ```predicate``` object

```require('dashdb')('users').filepath``` returns the data path to where the collection json is stored on disk

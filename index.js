'use strict';

var _ = require('underscore');
var fs = require('fs-extra');
var path = require('path');
var generate = require('nanoid/generate');
var hash = require('object-hash');
var moment = require('moment');
var aws = require('aws-sdk');
var scheduler = require('node-schedule');

var defaults = {
	pk: 'id', /* primary key */
	pkEntropy: 32, /* primary key entropy */
	hk: 'hash', /* hash key */
	// hkUniq: false, /* makes all entries unique by object hash */
	ck: 'created', /* created key */
	mk: 'modified' /* modified key */,
	backupSchedule: '* 0 * * *', /* chron schedule for every midnight, @see https://www.npmjs.com/package/node-schedule */
	s3BucketName: '', /* bucket where data backups will be uploaded onto */
	s3BucketPath: 'dashdb/', /* defaulting to uploading any s3 files into a folder, in the bucket */
	s3AccessKey: '', /* aws access key for s3 put object permissions */
	s3SecretAccessKey: '', /* aws secret access key for s3 put object permissions */
	s3FileKey: `moment().format('YYYY/MM') + '/' + moment().format() + '-' + path.basename(filepath)` /* js eval to create file key onto s3 */
};

var data = {};

var lib = {

	append: function(dataType, d) {
		var line = this.dataToLine(dataType, d);
		fs.appendFileSync(this.filepath(dataType), line);
		data[dataType].push(line);
	},

	dataToLine: function(dataType, d) {
		var line = _.isObject(d) ? JSON.stringify(d) : d.toString();
		if (data[dataType].length > 0) {
			line = "\n" + line;
		}
		return line;
	},

	ensureFile: function(dataType) {
		fs.ensureFileSync(this.filepath(dataType));
	},

	filepath: function(dataType) {
		return `${__dirname}/data/${dataType}.json`;
	},

	hash: function(item) {
		var blacklist = [defaults.pk];
		if (defaults.ck !== '') {
			blacklist.push(defaults.ck);
		}
		if (defaults.mk !== '') {
			blacklist.push(defaults.mk);
		}
		return hash(_.omit(item, blacklist));
	},

	id: function(entropy) {
		return generate('1234567890qwertyuiopasdfghjklzxcvbnm', entropy || defaults.pkEntropy);
	},

	loadFile: function(dataType) {
		var contents = fs.readFileSync(this.filepath(dataType), 'utf8');
		data[dataType] = contents ? _.map(contents.split("\n"), JSON.parse) : [];
	},

	s3: function() {
		aws.config.update({ 
			accessKeyId: defaults.s3AccessKey,
			secretAccessKey: defaults.s3SecretAccessKey
		});
		return new aws.S3();
	},

	s3File: function(dataType) {
		var filepath = this.filepath(dataType);
		var contents = fs.readFileSync(filepath, 'utf8');
		var body = new Buffer(contents, 'binary');
		var key = defaults.s3BucketPath + eval(defaults.s3FileKey);
		// console.log({ key });
		var s3 = this.s3();
		s3.putObject({
			Bucket: defaults.s3BucketName,
			Key: key,
			Body: body,
			ACL: 'private'
		}, function(err, data) {
			// console.log({ err, data });
		});
	},

	saveFile: function(dataType) {
		var contents = _.map(data[dataType], JSON.stringify).join("\n");
		fs.writeFileSync(this.filepath(dataType), contents, 'utf8');
	}

};


var api = function(dataType) {

	var filepath = lib.filepath(dataType);

	if (defaults.s3BucketName !== ''
		&& defaults.s3AccessKey !== ''
		&& defaults.s3SecretAccessKey !== ''
		&& defaults.backupSchedule) {
		scheduler.scheduleJob(defaults.backupSchedule, function() {
			lib.s3File(dataType);
		});
	}

	return {

		dataType,

		filepath,

		all: function() {
			return data[dataType];
		},

		add: function(item1, item2, item3) {
			this.append(...arguments);
		},

		append: function(item1, item2, item3) {
			var items = _.map(arguments, function(item) {
				if (defaults.pk !== '') {
					if (!item[defaults.pk]) {
						item[defaults.pk] = lib.id();
					}
				}
				if (defaults.hk !== '') { 
					item[defaults.hk] = lib.hash(item);
				}
				if (defaults.ck !== '') { 
					item[defaults.ck] = moment().format();
				}
				if (defaults.mk !== '') { 
					item[defaults.mk] = item[defaults.ck];
				}
				return item;
			});
			data[dataType] = data[dataType].concat(_.values(items));
		},

		create: function(item1, item2, item3) {
			this.append(...arguments);
		},

		commit: function() {
			lib.saveFile(dataType);
		},

		delete: function(predicate) {
			var rows = _.filter(data[dataType], predicate);
			data[dataType] = _.difference(data[dataType], rows);			
		},

		empty: function() {
			data[dataType] = [];
		},

		reload: function() {
			lib.loadFile(dataType);
		},

		update: function(predicate, values) {
			data[dataType] = _.map(data[dataType], function(row) {
				if (!_.findWhere([row], predicate)) { return row; }
				row = _.extend(row, values);
				if (defaults.hk !== '') {
					row[defaults.hk] = lib.hash(row);
				}
				if (defaults.mk !== '') { 
					item[defaults.mk] = moment().format();
				}
				return row;
			});
		},

		where: function(predicate) {
			return _.where(data[dataType], predicate);
		},

		sync: function() {
			this.commit();
		}

	}

};


module.exports = function(dataType, options) {

	/*
	options.pk = 'id' | string | null
		can set the primary key of documents and how they're retrieved
	options.uniq = 'document' | 'pk' | null 
		each row can be non-unique, or unique by the row or its primary key
	*/

	defaults = _.extend(defaults, options || {});

	//ensure we have our json file
	lib.ensureFile(dataType);

	//register our data type into our data dictionary
	lib.loadFile(dataType);

	return api(dataType);

};



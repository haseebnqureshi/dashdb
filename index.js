'use strict';

var _ = require('underscore');
var fs = require('fs-extra');
var generate = require('nanoid/generate');
var hash = require('object-hash');
var moment = require('moment');

var defaults = {
	pk: 'id', /* primary key */
	pkEntropy: 32, /* primary key entropy */
	hk: 'hash', /* hash key */
	// hkUniq: false, /* makes all entries unique by object hash */
	ck: 'created', /* created key */
	mk: 'modified' /* modified key */
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
		return hash(_.omit(item, [defaults.pk, defaults.ck, defaults.mk]));
	},

	id: function(entropy) {
		return generate('1234567890qwertyuiopasdfghjklzxcvbnm', entropy || defaults.pkEntropy);
	},

	loadFile: function(dataType) {
		var contents = fs.readFileSync(this.filepath(dataType), 'utf8');
		data[dataType] = contents ? _.map(contents.split("\n"), JSON.parse) : [];
	},

	saveFile: function(dataType) {
		var contents = _.map(data[dataType], JSON.stringify).join("\n");
		fs.writeFileSync(this.filepath(dataType), contents, 'utf8');
	}

};


var api = function(dataType) {

	return {

		dataType,

		filepath: lib.filepath(dataType),

		all: function() {
			return data[dataType];
		},

		add: function(item1, item2, item3) {
			this.append(...arguments);
		},

		append: function(item1, item2, item3) {
			var items = _.map(arguments, function(item) {
				item[defaults.pk] = lib.id();
				item[defaults.hk] = lib.hash(item);
				item[defaults.ck] = moment().format();
				item[defaults.mk] = item[defaults.ck];
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
				row[defaults.hk] = lib.hash(row);
				row[defaults.mk] = moment().format();
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



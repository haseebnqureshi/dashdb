'use strict';

var moment = require('moment');

var fs = require('fs');

var items = require('./index.js')('items');

var tests = [10, 100, 1000, 10000, 100000, 1000000];

var _ = require('underscore');

_.each(tests, function(total) {

	items.empty();

	var i = 0;

	var start = moment();

	while (i < total) {
		items.create({ name: 'New Item' });
		i++;
	}

	items.commit();

	var done = moment();

	var ms = done.diff(start);

	var size = fs.statSync(items.filepath).size;

	var msPer = ms / total;

	console.log({ ms, size, total, msPer });

});


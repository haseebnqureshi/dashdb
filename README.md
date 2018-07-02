Beautifully straight forward NoSQL JSON document DB.

# DashDB

![npm monthly downloads](https://img.shields.io/npm/dm/dashdb.svg)
![github release](https://img.shields.io/github/release/haseebnqureshi/dashdb.svg)
![github license](https://img.shields.io/github/license/haseebnqureshi/dashdb.svg)

### npm install dashdb --save

### Background
This project came from wanting the flexibility in a DashDB syntax, but without the bloat of having an extra database service starting in the background. Sometimes, you just want to store JSON data in a local file, and have intuitive methods that help you store and retrive that data. This's exactly what DashDB does.

### Getting Started
Super straightforward. Here are the few steps:
1. Bring DashDB into your project with ```npm install dashdb --save```
2. Create any new data collection with ```var users = require('dashdb')('users')```
3. Run your node app. That's it!

### API 
With each new data collection, you get a series of helpers that easily get your data in and out from local storage. So for clarity, if you ```var users = require('dashdb')('users')```, these methods are called on your ```users``` object.

### Primary Key
By default, the primary key is simply ```id``` and DashDB auto-generates that identifier for each row (or JSON document). Alternatively, you have the option of overriding the auto-generated identifier. Simply pass your own value for the ```id``` parameter in any document save or update method.

### Document Hashing
By default, DashDB auto-generates that identifier as a unique hash to that object. This way, you can easily enforce uniqueness amongst your records.

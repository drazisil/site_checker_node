var JsonDB = require('node-json-db')
//The second argument is used to tell the DB to save after each push 
//If you put false, you'll have to call the save() method. 
//The third argument is to ask JsonDB to save the database in an human readable format. (default false) 
var db = new JsonDB("myDataBase1", true, true)

//You can also push directly objects 
db.push("/test3", {test:"test", json: {test:["test"]}});
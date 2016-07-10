    //prefixes of implementation that we want to test
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    //prefixes of window.IDB objects
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.")
    }
    var db;
    var request = window.indexedDB.open("KeyValueDB", 1);

    request.onerror = function(event) {
        console.log("error: ");
    };

    request.onsuccess = function(event) {
        db = request.result;
        console.log("success: " + db);
    };

    request.onupgradeneeded = function(event) {
        var db = event.target.result;

        //Create store
        if (!db.objectStoreNames.contains("KeyValue")) {
            console.log("I need to make the KeyValue objectstore");
            //var objectStore = db.createObjectStore("KeyValue", { keyPath: "id", autoIncrement:true });  
            //objectStore.createIndex("title", "title", { unique: false });
            var objectStore = db.createObjectStore("KeyValue", {
                keyPath: ["key", "time"]
            });
            objectStore.createIndex("time", "time", {
                unique: false
            });
        }
    }

    function read() {
        var transaction = db.transaction(["KeyValue"]);
        var objectStore = transaction.objectStore("KeyValue");
        var keyValue = document.getElementById('txtKey').value;
        var timeValue = document.getElementById('txtTime').value;

        if (!keyValue) {
            alert("Please enter at least the key to be searched for.");
            return;
        }
        //var request = objectStore.get(keyValue);
        var request = objectStore.openCursor();

        request.onerror = function(event) {
            alert("Unable to retrieve data from database!");
        };

        request.onsuccess = function(event) {
            var cursor = event.target.result;
            // Do something with the request.result!
            if (cursor) {
                if (!timeValue) { // No time value, return latest
                    var index = objectStore.index('time');
                    var openCursorRequest = index.openCursor(null, 'prev');
                    var maxRevisionObject = null;

                    openCursorRequest.onsuccess = function(event) {
                        var cursor = event.target.result;
                        if (cursor) {
                            if (cursor.value.key == keyValue) {
                                alert("Key: " + cursor.value.key + ", Value: " + cursor.value.value);
                            } else {
                                cursor.continue();
                            }
                        } else {
                            alert(keyValue + " couldn't be found in your database!");
                            return;
                        }
                    };
                } else {
                    var index = objectStore.index('time');
                    var openCursorRequest = index.openCursor(null, 'prev');
                    var latestResult = [];
                    openCursorRequest.onsuccess = function(event) {
                        var cursor = event.target.result;

                        if (cursor) {
                            if (cursor.value.key == keyValue && !latestResult.value)
                                latestResult = cursor.value;

                            if (cursor.value.key == keyValue && cursor.value.time <= new Date(timeValue).getTime()) {
                                alert("Key: " + cursor.value.key + ", Value: " + cursor.value.value);
                                return;
                            } else if (cursor.value.key == keyValue && cursor.value.time > new Date(timeValue).getTime()) {
                                cursor.continue();
                            } else {
                                cursor.continue();
                            }
                        } else { // all traversed
                            if (latestResult.key)
                                alert("Key: " + latestResult.key + ", Value: " + latestResult.value);
                            else
                                alert(keyValue + " couldn't be found in your database!");
                        }

                    };
                }
            } else {
                alert(keyValue + " couldn't be found in your database!");
            }
        };
    }

    function readAll() {
        var objectStore = db.transaction("KeyValue").objectStore("KeyValue");

        objectStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;

            if (cursor) {
                alert("Name for id " + cursor.key + " is " + cursor.value.key + ", Value: " + cursor.value.value + ", Time: " + cursor.value.time);
                cursor.continue();
            } else {
                alert("No more entries!");
            }
        };
    }

    function add() {
        var keyValue = document.getElementById('txtKey').value;
        var valValue = document.getElementById('txtVal').value;
        var timeValue = new Date(new Date().setSeconds(0, 0)).getTime();

        if (!keyValue || !valValue) {
            alert("Please enter both key and value to be added to the database.");
            return;
        }

        var request = db.transaction(["KeyValue"], "readwrite")
            .objectStore("KeyValue")
            .put({
                key: keyValue,
                value: valValue,
                time: timeValue
            });

        request.onsuccess = function(event) {
            alert(keyValue + " has been added to your database.");
        };

        request.onerror = function(event) {
            alert("Unable to add data\r\n" + keyValue + " already exists in your database! ");
        }
    }

    function removeAll() {
        var request = db.transaction(["KeyValue"], "readwrite")
            .objectStore("KeyValue")
            .clear();

        request.onsuccess = function(event) {
            alert("All entries have been removed from your database.");
        };
    }
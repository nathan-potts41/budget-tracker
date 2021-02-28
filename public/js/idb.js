// create variable to hold DB connection
let db;
// establish a connection to IndexedDB database and give a version of 1
const request = indexedDB.open('bank_action', 1);

// event will emit if and when the database version changes
request.onupgradeneeded = function (event) {
    // save a reference to the database
    const db = event.target.result;
    //create an object store called 'action', set to autoincrement
    db.createObjectStore('action', { autoIncrement: true });
};

// successful
request.onsuccess = function (event) {
    //save a reference to global variable
    db = event.target.result;

    //check if app is online, if yes run uploadAction() and send all local db data to api
    if (navigator.online) {
        uploadAction();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

//function saves an action if no internet
function saveRecord(record) {
    // open a new transaction with the db with read and write permissions
    const transaction = db.transaction(['action'], 'readwrite');

    //access the object store for 'action'
    const actionObjectStore = transaction.objectStore('action');

    //add record to store
    actionObjectStore.add(record);
};

function uploadAction() {
    // open a transaction on your db
    const transaction = db.transaction(['action'], 'readwrite');

    // access your object store
    const actionObjectStore = transaction.objectStore('action');

    // get all records from store and set to a variable
    const getAll = actionObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['action'], 'readwrite');
                    // access the new_pizza object store
                    const actionObjectStore = transaction.objectStore('action');
                    // clear all items in your store
                    actionObjectStore.clear();

                    alert('All saved actions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

// listen for app coming back online
window.addEventListener('online', uploadAction);
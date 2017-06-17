// @flow
/* eslint-disable no-case-declarations, no-fallthrough */

import idb from 'idb'
import people from './people'

const DB = idb.open('test-db', 3, function(upgradeDb) {
  // NOTE: `upgradeDB.oldVersion` is how you deal with multiple versions
  switch(upgradeDb.oldVersion) {
    case 0:
      const kvStore = upgradeDb.createObjectStore('keyval')
      kvStore.put('world', 'hello')
    case 1:
      upgradeDb.createObjectStore('people', {keyPath: 'name'})
    case 2:
      const peopleStore = upgradeDb.transaction.objectStore('people')
      peopleStore.createIndex('animal', 'favoriteAnimal')
  }
})

// Reading from the DB
DB.then(db => {
  const tx = db.transaction('keyval')
  const store = tx.objectStore('keyval')
  return store.get('hello')
}).then(function(val) {
  console.log(`store['hello'] -> ${val}`)
})

// Writing to the DB
DB.then(db => {
  const tx = db.transaction('keyval', 'readwrite')
  const store = tx.objectStore('keyval')
  store.put('bar', 'foo')
  return tx.complete
}).then(function() {
  console.log("Added foo:bar to 'keyval' store")
})

// Save favorite animal
DB.then(db => {
  const tx = db.transaction('keyval', 'readwrite')
  const store = tx.objectStore('keyval')
  store.put('donkey', 'favoriteAnimal')
  return tx.complete
}).then(() => console.log("Added favoriteAnimal:donkey to 'keyval' store"))

// Add people to "people" store
DB.then(db => {
  const tx = db.transaction('people', 'readwrite')
  const store = tx.objectStore('people')
  people.forEach(p => store.put(p))

  return tx.complete
}).then(() => console.log('People added'))

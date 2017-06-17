// @flow
/* eslint-disable no-case-declarations, no-fallthrough */

import idb from 'idb'
import people from './people'

const DB = idb.open('test-db', 4, function(upgradeDb) {
  // NOTE: `upgradeDB.oldVersion` is how you deal with multiple versions
  switch(upgradeDb.oldVersion) {
    case 0:
      const store1 = upgradeDb.createObjectStore('keyval')
      store1.put('world', 'hello')
    case 1:
      upgradeDb.createObjectStore('people', {keyPath: 'name'})
    case 2:
      const store2 = upgradeDb.transaction.objectStore('people')
      store2.createIndex('animal', 'favoriteAnimal')
    case 3:
      const store3 = upgradeDb.transaction.objectStore('people')
      store3.createIndex('age', 'age')
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


// List all cat people
DB.then(db => {
  const tx = db.transaction('people')
  const store = tx.objectStore('people')
  const animalIndex = store.index('animal')

  return animalIndex.getAll('cat')
}).then(people => console.log('Cat people:', people))


// List all people, ordered by age
DB.then(db => {
  const tx = db.transaction('people')
  const store = tx.objectStore('people')
  const ageIndex = store.index('age')

  return ageIndex.getAll()
}).then(people => console.log('People by age:', people))


// Iterating through a store, using cursor
DB.then(db => {
  const tx = db.transaction('people')
  const store = tx.objectStore('people')
  const ageIndex = store.index('age')

  return ageIndex.openCursor()
}).then(function logPerson(cursor) {
  if (!cursor) return
  console.log(`Cursored at: ${cursor.value.name}`)
  // cursor.update(newValue)
  // cursor.delete()
  return cursor.continue().then(logPerson)
}).then(() => {
  console.log('Done cursoring')
})

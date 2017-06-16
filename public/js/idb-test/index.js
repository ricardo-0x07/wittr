import idb from 'idb'

const DB = idb.open('test-db', 1, function(upgradeDb) {
  const kvStore = upgradeDb.createObjectStore('keyval')
  kvStore.put('world', 'hello')
})

// Reading from the DB
DB.then(db => {
  const tx = db.transaction('keyval')
  const kvStore = tx.objectStore('keyval')
  return kvStore.get('hello')
}).then(function(val) {
  console.log(`store['hello'] -> ${val}`)
})

// Writing to the DB
DB.then(db => {
  const tx = db.transaction('keyval', 'readwrite')
  const kvStore = tx.objectStore('keyval')
  kvStore.put('bar', 'foo')
  return tx.complete
}).then(function() {
  console.log("Added foo:bar to 'keyval' store")
})

// Save favorite animal
DB.then(db => {
  const tx = db.transaction('keyval', 'readwrite')
  const store = tx.objectStore('keyval')
  store.put('donkey', 'favoriteAnimal')
}).then(() => console.log("Added favoriteAnimal:donkey to 'keyval' store"))

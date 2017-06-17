// @flow

export type Person = {
  name: string,
  age: number,
  favoriteAnimal: string,
}

const people: Person[] = [
  { name: 'Sam Munoz', age: 25, favoriteAnimal: 'dog' },
  { name: 'Susan Keller', age: 34, favoriteAnimal: 'cat' },
  { name: 'Lillie Wolfe', age: 28, favoriteAnimal: 'dog' },
  { name: 'Marc Stone', age: 39, favoriteAnimal: 'cat' },
]

export default people

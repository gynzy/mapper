/* eslint-disable max-classes-per-file */

import { Mapper } from '../src';

class User {
    constructor(
        public readonly firstName: string,
        public readonly lastName: string,
        private readonly email: string,
    ) { }
}

class Person {
    constructor(
        public readonly firstName: string,
        public readonly lastName: string,
    ) { }
}

// Creates a mapping between User -> Person.
Mapper.createMap(User, Person);

// Maps user to person by instantiating a new Person object.
const sourceUser = new User('John', 'Denver', 'john@email.com');
let person = Mapper.map(sourceUser, Person);
console.log(person);
// Prints:
//  Person { firstName: 'John', lastName: 'Denver' }

// Mapping to an existing object overwrites the fields.
// The object emma itself is modified and also returned.
const emma = new Person('Emma', 'Watson');
person = Mapper.map(sourceUser, emma);
console.log(person);
// Prints:
//  Person { firstName: 'John', lastName: 'Denver' }

// Maps to existing object by explicitly specifying the type of destination object.
// The type of object remains anonymous (we can't actually change the type) but it is mapped with
// the fields Person.
const john = { firstName: 'John' } as any;
person = Mapper.map(sourceUser, john, Person);
console.log(person);
// Prints:
//  { firstName: 'John', lastName: 'Denver' }

// If source object is array, each element is mapped and an array is returned.
const persons = Mapper.map([
    new User('John', 'Denver', 'john@email.com'),
    new User('Emma', 'Watson', 'emma@watson.com'),
], Person);

console.log(persons);
// Prints:
//  [
//     Person { firstName: 'John', lastName: 'Denver' },
//     Person { firstName: 'Emma', lastName: 'Watson' }
//  ]

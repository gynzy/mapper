# mapper

[![Build Status](https://travis-ci.org/gynzy/mapper.svg?branch=master)](https://travis-ci.org/gynzy/mapper)
[![Coverage Status](https://coveralls.io/repos/github/gynzy/mapper/badge.svg?branch=master)](https://coveralls.io/github/gynzy/mapper?branch=master)

mapper is a zero-dependency nodejs library solving one of the most tedious developer tasks - mapping an object to another type of object. Object mapping works by transforming a source object of one type to another type. Often objects have similar fields and it's tedious and error-prone to copy each individually. With mapper these fields will be copied without any configuration.

## How to use

After adding the library, you first need to create a mapping between the source and destination type with `Mapper.createMap`. This method returns a `MappingBuilder` allowing customizing the mapping (see below). Mapping objects can be done by one of the overloads of `Mapper.map`.

For more samples, check out the tests `mapper.spec.ts`. Below a summary is given, full runnable
samples can be found in the `/samples` directory (run with `ts-node samples/01-simple.ts`).

```ts
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
```

## Custom configuration

With the return object of `Mapper.createMap`, you can create a custom mapping behavior for each field. For instance, you can skip certain fields, map a field from a different field or use a custom factory to supply the value.

```ts
class Record {
    constructor(
        public readonly organizationId: number,
        public readonly userId: number,
        public readonly name: string,
        public readonly lastName: string,
    ) { }
}

class User {
    constructor(
        public readonly id: number,
        public readonly fullName: string,
        public readonly organization: Organization,
    ) { }
}

class Organization {
    constructor(
        public readonly id: number,
        public readonly name: string,
    ) { }
}

Mapper.createMap(Record, User)
    // map from different field
    .for('id').mapFrom('userId')
    // custom factory to construct value
    .for('organization').mapFrom((src) => Mapper.map(src, Organization))
    // factory supplies source and destination object
    .for('fullName').mapFrom((src, dst) => dst.fullName ?? `${src.name} ${src.lastName}`);

Mapper.createMap(Record, Organization)
    // map from different field
    .for('id').mapFrom('organizationId')
    // name refers to User
    .for('name').ignore();

const record = new Record(1, 1, 'John', 'Denver');

const user = Mapper.map(record, User);
console.log(user);
// Prints:
//  User {
//    id: 1,
//    fullName: 'John Denver',
//    organization: Organization { id: 1, name: undefined }
//  }

const organization = Mapper.map(record, Organization);
console.log(organization);
// Prints:
//  Organization { id: 1, name: undefined }

const existingUser = new User(1, 'Emma Watson', null);
Mapper.map(record, existingUser);
console.log(existingUser);
// Prints:
//  User {
//    id: 1,
//    fullName: 'Emma Watson',
//    organization: Organization { id: 1, name: undefined }
//  }
```

### forAll

Sometimes you have many fields for which you want to have the same configuration. For instance, when updating an object with fields from another object which uses the same names.

```ts
Mapper.createMap(Record, Organization)
    // Ignore all fields
    .forAll().ignore()
    // But do map id from organizationId
    .for('id').mapFrom('organizationId');
```

## How it works

Mapping is done by listing all fields after instantiating a new instance of destination type. For each destination field, the value is resolved from the source, depending on the applied configuration. These include (see also examples above):

* No configuration, value is copied from source object with same field name.
* `ignore()` - destination value is untouched. Meaning, if an existing destination object is given, the value remains. If a new instance is created, the value is `undefined.`
* `constant(value: unknown)` - provide constant value.
* `mapFrom(sourceMember: M)` - map value from other source field (i.e. different name).
* `mapFrom(factory: (source, destination) => unknown)` - resolve value with a custom factory. Source refers to the source object and destination to the destination object. Note: currently, no order of mapping execution is guaranteed, mapping based on a destination field, may give unexpected results.

Note: all expected fields must be set after instantiating the destination object, otherwise it is impossible to know which fields to map. See below for valid examples.

```ts
class Person {
    // All fields are set in the constructor
    constructor(
        public readonly firstName: string,
        public readonly lastName: string,
    ) { }
}

class Person {
    // Alternative, provide value if field is set as property
    public readonly firstName: string = undefined;
    public readonly lastName: string = undefined;

    // This field won't be mapped since no default value is set on instantion.
    public readonly unmapped: string;
}
```

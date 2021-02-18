/* eslint-disable max-classes-per-file */

import { Mapper } from '../src';

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

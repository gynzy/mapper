/* eslint-disable max-classes-per-file */

import { Mapper } from './mapper';

describe(`${Mapper.name} no custom configuration`, () => {
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

    it('throws when mapping is not created yet', () => {
        expect(() => Mapper.map(new User('John', 'Denver', 'john@email.com'), Person)).toThrow();
    });

    it('should copy fields for anonymous source objects', () => {
        const result = Mapper.map({ firstName: 'John', lastName: 'Denver', email: 'john@email.com' }, Person);
        expect(result).toEqual(new Person('John', 'Denver'));
    });

    it('should copy only fields of destination model to destination object (i.e. ignore additional source fields)', () => {
        // First create mapping
        Mapper.createMap(User, Person);

        const result = Mapper.map(new User('John', 'Denver', 'john@email.com'), Person);
        expect(result).toEqual(new Person('John', 'Denver'));
    });

    it('should copy fields from source to existing destination object (i.e. original destination is modified)', () => {
        const emma = new Person('Emma', 'Watson');
        const result = Mapper.map(new User('John', 'Denver', 'john@email.com'), emma);

        expect(result).toEqual(new Person('John', 'Denver'));
        expect(emma).toEqual(new Person('John', 'Denver'));
    });

    it('should copy fields from source to existing destination object, without instantiating destination type, based on explicit type', () => {
        const john = { firstName: 'John' } as any;
        const result = Mapper.map(new User('John', 'Denver', 'john@email.com'), john, Person);

        expect(result).toEqual(new Person('John', 'Denver'));
        expect(result).not.toBeInstanceOf(Person);
        expect(john).toEqual({ firstName: 'John', lastName: 'Denver' });
        expect(john).not.toBeInstanceOf(Person);
    });

    it('throws when destination type cannot be determined (i.e. no real destination object is given and explicit type is omitted)', () => {
        expect(() => Mapper.map(new User('John', 'Denver', 'john@email.com'), {} as Person)).toThrow();
    });
});

describe(`${Mapper.name} with custom configuration`, () => {
    class UserCompleteRow {
        constructor(
            public readonly userId: number,
            public readonly brin: string,
            public readonly firstName: string,
            public readonly lastName: string,
            public readonly schoolId: number,
        ) { }
    }

    class Teacher {
        constructor(
            public readonly id: number,
            public readonly fullName: string,
            public readonly school: School,
        ) { }
    }

    class School {
        constructor(
            public readonly id: number,
            public readonly brin: string,
        ) { }
    }

    const rows: UserCompleteRow[] = [
        new UserCompleteRow(1, 'GYNZY', 'Emma', 'Watson', 42),
        new UserCompleteRow(2, 'GYNZY', 'John', 'Denver', 42),
    ];

    beforeAll(() => {
        Mapper.createMap(UserCompleteRow, Teacher)
            .for('school').mapFrom((src) => Mapper.map(src, School))
            .for('fullName').mapFrom((src) => `${src.firstName} ${src.lastName}`)
            .for('id').mapFrom('userId');

        Mapper.createMap(UserCompleteRow, School)
            .for('id').mapFrom('schoolId');
    });

    it('should create destination object for single element', () => {
        const result = Mapper.map(rows[0], Teacher);
        expect(result).toEqual(new Teacher(1, 'Emma Watson', new School(42, 'GYNZY')));
    });

    it('should create destination object for each element', () => {
        const result = Mapper.map(rows, Teacher);
        expect(result).toEqual([
            new Teacher(1, 'Emma Watson', new School(42, 'GYNZY')),
            new Teacher(2, 'John Denver', new School(42, 'GYNZY')),
        ]);
    });

    it('throws when configuration already exists between mapping types', () => {
        expect(() => Mapper.createMap(UserCompleteRow, Teacher)).toThrow();
    });
});

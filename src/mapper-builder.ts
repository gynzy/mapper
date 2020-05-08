// Both classes should be in single file, otherwise we create circular dependency
/* eslint-disable max-classes-per-file */

import { MappingConfiguration } from './mapping-configuration';

/**
 * [INTERNAL] Describe how destination field is mapped.
 */
export class FieldMapping<TSource, TDestination> {
    constructor(
        private readonly builder: MappingBuilder<TSource, TDestination>,
        private readonly destinationField: string,
    ) {}

    /**
     * Ignores `destinationMember` from mapping. If destination object is instantiated, the
     * `destinationMember` will hold value `undefined`. For existing destination objects, the
     * current value will be kept.
     *
     * @example
     * Mapper.createMap(Teacher, Person)
     *  .for('id').ignore()
     *
     * @param destinationMember field which will be ignored.
     */
    public ignore(): MappingBuilder<TSource, TDestination> {
        this.builder.configuration.ignoredFields.add(this.destinationField);
        return this.builder;
    }

    /**
     * Creates custom mapping to resolve the value for `destinationMember` using a `sourceMember`.
     *
     * @example
     * Mapper.createMap(Teacher, Person)
     *  .for('id').mapFrom('personId')
     *
     * @param destinationMember field which will be set.
     * @param sourceMember field to use as source.
     */
    public mapFrom<M extends keyof TSource>(sourceMember: M & string): MappingBuilder<TSource, TDestination>;

    /**
     * Creates custom mapping to resolve the value for `destinationMember` using a `factory`.
     *
     * @example
     * Mapper.createMap(Teacher, Person)
     *  .for('email').mapFrom(src => src.person.email)
     *
     * @param destinationMember field which will be set.
     * @param factory custom factory to resolve value, first parameter is the source object, second
     * value is the to be destination object.
     */
    public mapFrom(
        factory: (source: TSource, destination: TDestination) => unknown,
    ): MappingBuilder<TSource, TDestination>;

    public mapFrom<M extends keyof TSource>(
        sourceOrFactory: (M & string) | ((source: TSource, destination: TDestination) => unknown),
    ): MappingBuilder<TSource, TDestination> {
        // sourceMember overload is used, just call this function again with a factory.
        if (typeof sourceOrFactory === 'string') {
            return this.mapFrom((src) => src[sourceOrFactory]);
        }

        this.builder.configuration.factoryFields.set(
            this.destinationField,
            sourceOrFactory as (source: TSource, destination: TDestination) => unknown,
        );
        return this.builder;
    }

    /**
     * Set `destinationMember` to constant value (it's a shortcut for `mapFrom`).
     * @param destinationMember field which will be set.
     */
    public constant(value: unknown): MappingBuilder<TSource, TDestination> {
        return this.mapFrom(() => value);
    }
}

/**
 * [INTERNAL] Construct mapping for a destination field.
 */
export class MappingBuilder<TSource, TDestination> {
    private readonly mappings = new Map<string, FieldMapping<TSource, TDestination>>();

    /**
     * Holds custom mapping configuration, only for internal usage.
     */
    public readonly configuration: MappingConfiguration<TSource, TDestination> = {
        ignoredFields: new Set<string>(),
        factoryFields: new Map<string, (source: TSource, destination: TDestination) => unknown>(),
    };

    public for<M extends keyof TDestination>(destinationField: M & string): FieldMapping<TSource, TDestination> {
        if (this.mappings.has(destinationField)) {
            throw new Error(`Mapping already configured for field '${destinationField}'`);
        }

        const mapping = new FieldMapping(this, destinationField);
        this.mappings.set(destinationField, mapping);

        return mapping;
    }
}

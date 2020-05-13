/* eslint-disable new-cap */
/* eslint-disable no-param-reassign */

import { MappingConfiguration } from './mapping-configuration';
import { MappingBuilder } from './mapper-builder';

/**
 * Type of model to be used as parameter.
 */
export type ClassType<T> = new (...args: unknown[]) => T;

/**
 * Mapper can be used to automatically map one object to another object. It is inspired by the most
 * awesome and used library in C#: AutoMapper (see description below for ideology).
 *
 * * Call `map` to map a source object to destinationType.
 * * Call `createMap` to create custom mapping configuration between source and destination type.
 *
 * > AutoMapper is an object-object mapper. Object-object mapping works by transforming an input object
 * > of one type into an output object of a different type. What makes AutoMapper interesting is that
 * > it provides some interesting conventions to take the dirty work out of figuring out how to map
 * > type A to type B. As long as type B follows AutoMapper’s established convention, almost zero
 * > configuration is needed to map two types.
 */
export class Mapper {
    /**
     * Array of custom configurations created by calling `createMap`.
     * TODO: somehow make this indexable / hashable to improve performance / semantics. This isn't
     * trivial since sourceType is not indexable (must be string/number).
     */
    private static configurations: { sourceType; destinationType; builder: MappingBuilder<unknown, unknown> }[] = [];

    /**
     * Maps objects from source to destinationType.
     * - While mapping, destination object will be instantiated from given type.
     * - Custom mapping can be created by `Mapper.createMap`.
     * - New instance is always returned.
     *
     * @param sources source objects containing data.
     * @param destinationType destinationType to instantiate.
     */
    public static map<TSource, TDestination>(
        sources: TSource[],
        destinationType: ClassType<TDestination>,
    ): TDestination[];

    /**
     * Maps objects from source to new destination.
     * - Original destination object stays untouched, new instance is always returned.
     * - Custom mapping can be created by `Mapper.createMap`.
     * - Used to enrich a destination object, with additional fields.
     *
     * @param sources source objects containing data.
     * @param destination destination object which already contains data.
     */
    public static map<TSource, TDestination>(sources: TSource[], destination: TDestination): TDestination[];

    /**
     * Maps objects from source to new destination with specified destinationType.
     * - Original destination object stays untouched, new instance is always returned from `destinationType`.
     * - Custom mapping can be created by `Mapper.createMap`.
     * - Used to enrich a destination object, with additional fields.
     *
     * @param sources source objects containing data.
     * @param destination destination object which already contains data.
     * @param destinationType type of the destination object.
     */
    public static map<TSource, TDestination>(
        sources: TSource[],
        destination: TDestination,
        destinationType: ClassType<TDestination>,
    ): TDestination[];

    /**
     * Maps object from source to destinationType.
     * - While mapping, destination object will be instantiated from given type.
     * - Custom mapping can be created by `Mapper.createMap`.
     * - New instance is always returned.
     *
     * @param source source object containing data.
     * @param destinationType destinationType to instantiate.
     */
    public static map<TSource, TDestination>(source: TSource, destinationType: ClassType<TDestination>): TDestination;

    /**
     * Maps object from source to new destination.
     * - Original destination object stays untouched, new instance is always returned.
     * - Custom mapping can be created by `Mapper.createMap`.
     * - Used to enrich a destination object, with additional fields.
     *
     * @param source source object containing data.
     * @param destination destination object which already contains data.
     */
    public static map<TSource, TDestination>(source: TSource, destination: TDestination): TDestination;

    /**
     * Maps object from source to new destination with specified destinationType.
     * - Original destination object stays untouched, new instance is always returned from `destinationType`.
     * - Custom mapping can be created by `Mapper.createMap`.
     * - Used to enrich a destination object, with additional fields.
     *
     * @param source source object containing data.
     * @param destination destination object which already contains data.
     * @param destinationType type of the destination object.
     */
    public static map<TSource, TDestination>(
        source: TSource,
        destination: TDestination,
        destinationType: ClassType<TDestination>,
    ): TDestination;

    public static map<TSource, TDestination>(
        source: TSource | TSource[],
        destinationOrType: ClassType<TDestination> | TDestination,
        destinationType?: ClassType<TDestination>,
    ): TDestination | TDestination[] {
        if (Array.isArray(source)) {
            return source.map((item) => Mapper.map(item, destinationOrType, destinationType)) as TDestination[];
        }

        // 1. First we derive actual destinationType from potential overloads.
        // We need to know the destinationType in order to construct the destination object. This ensures
        // it is always an actual instance (i.e. not type casted).
        let destination: TDestination;

        // Probable usage: map(source, DestinationClass)
        if (typeof destinationOrType === 'function') {
            destinationType = destinationOrType as ClassType<TDestination>;
            destination = new destinationType();
        } else if (!destinationType) {
            // Probable usage: Mapper.map(source, {} as Destination);
            // In this scenario we can't know the destination type and thus throw exception.
            if (Object.getPrototypeOf(destinationOrType) === Object.getPrototypeOf({})) {
                throw new Error(
                    'Unable to determine destination type. Supply destination as real model (class) or supply third parameter to explicity set destination type.',
                );
            }

            // Probable usage: Mapper.map(source, destinationInstance);
            destinationType = Object.getPrototypeOf(destinationOrType).constructor;
            destination = destinationOrType;
        } else {
            // Probable usage: Mapper.map(source, destinationInstance, DestinationClass);
            destination = destinationOrType;
        }

        // 2. Find the correct mapping configuration for combination of source and destination type
        const sourceType = Object.getPrototypeOf(source).constructor;
        const sourceTypeIsAnonymous = Object.getPrototypeOf(source) === Object.getPrototypeOf({});

        const configuration = Mapper.configurations.find(
            (config) => config.sourceType === sourceType && config.destinationType === destinationType,
        )?.builder?.configuration;

        if (!configuration && !sourceTypeIsAnonymous) {
            throw new Error(
                `Mapping missing for ${sourceType} -> ${destinationType} but required unless sourceType is anonymous. Create with Mapper.createMap(...)`,
            );
        }

        // 3. Copy all (other) fields from source to destination
        const allProperties = Object.getOwnPropertyNames(new destinationType());
        for (const key of allProperties) {
            Mapper.mapField(source, destination, key, configuration);
        }

        // 4. Return object :)
        return destination;
    }

    /**
     * Creates a custom mapping between types from `sourceType` to  `destinationType`. Use fluent
     * syntax to build the custom mapping configuration
     *
     * @example
     * Mapper.createMap(Teacher, Person)
     *  .ignoreMember('id')
     *  .mapFrom('email', src => src.person.email)
     *
     * @param sourceType sourceType e.g. Teacher
     * @param destinationType sourceType e.g. Person
     */
    public static createMap<TSource, TDestination>(
        sourceType: ClassType<TSource>,
        destinationType: ClassType<TDestination>,
    ): MappingBuilder<TSource, TDestination> {
        const configuration = Mapper.configurations.find(
            (config) => config.sourceType === sourceType && config.destinationType === destinationType,
        )?.builder?.configuration;

        if (configuration) {
            throw new Error(`Configuration already exists for mapping ${sourceType} -> ${destinationType}`);
        }

        const builder = new MappingBuilder<TSource, TDestination>();
        Mapper.configurations.push({ sourceType, destinationType, builder });

        return builder;
    }

    /**
     * Uses `MappingConfiguration` to map field from `source` object to `destination` object.
     * @param source source object.
     * @param destination destination object.
     * @param key key of the field which we are mapping.
     * @param configuration configuration used for mapping between types.
     */
    private static mapField<TSource, TDestination>(
        source: TSource,
        destination: TDestination,
        key: string,
        configuration: MappingConfiguration<TSource, TDestination>,
    ): void {
        // Don't modify properties which are ignored
        if (configuration?.ignoredFields.has(key)) {
            return;
        }

        // Get the new value using factory or otherwise default copy
        const factory = configuration?.factoryFields.get(key);
        destination[key] = factory ? factory(source, destination) : source[key];
    }
}

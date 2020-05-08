/**
 * [INTERNAL] Contains configuration which is build with `MappingBuilder`.
 */
export interface MappingConfiguration<TSource, TDestination> {
    /**
     * Members to be ignored (if destination has value, value is kept otherwise it says undefined).
     */
    ignoredFields: Set<string>;

    /**
     * Provide value by custom mapping.
     */
    factoryFields: Map<string, (source: TSource, destination: TDestination) => any>;
}

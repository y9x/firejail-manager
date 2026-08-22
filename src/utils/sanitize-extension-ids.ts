const ID_REGEX = /^[\w-]+\.[\w-]+$/;

/**
 * Drop anything that is not a well-formed `publisher.name` extension id.
 * The ids are interpolated into the generated bash install script, so a
 * malformed id (whitespace, shell metacharacters) would break the script or
 * inject commands inside the jail.
 */
export function sanitizeExtensionIds(ids: string[]): string[] {
    return ids.filter((id) => ID_REGEX.test(id));
}

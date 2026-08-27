/**
 * SmartScript — build-time typography substitution.
 *
 * Replaces the ASCII shorthand authors type with the real glyph:
 *   (tm) / (TM) → ™
 *   (r)  / (R)  → ®
 *   (c)  / (C)  → ©
 *
 * Runs at build time only — in the markdown-it plugin (for prose) and in the
 * data loaders (for Pocketbase content) — so the rendered HTML already contains
 * the glyphs. This replaces the old client-side SmartScriptProcessor, which
 * mutated the live DOM after paint and broke screen-reader focus
 * (saf-site-vitepress-iqz).
 */

export interface SmartScriptOptions {
  trademark?: boolean
  registered?: boolean
  copyright?: boolean
}

const TRADEMARK_REGEX = /\(tm\)/gi
const REGISTERED_REGEX = /\(r\)/gi
const COPYRIGHT_REGEX = /\(c\)/gi

/**
 * Substitute trademark/registered/copyright shorthand in a string.
 * Returns the input unchanged when it contains no shorthand.
 */
export function smartScript(text: string, options: SmartScriptOptions = {}): string {
  if (typeof text !== 'string' || !text.includes('('))
    return text

  let result = text
  if (options.trademark !== false)
    result = result.replace(TRADEMARK_REGEX, '™')
  if (options.registered !== false)
    result = result.replace(REGISTERED_REGEX, '®')
  if (options.copyright !== false)
    result = result.replace(COPYRIGHT_REGEX, '©')
  return result
}

/**
 * Recursively apply {@link smartScript} to every string within a value (objects
 * and arrays included). Used to run loader output through the substitution in
 * one call instead of touching each text field by hand. Strings without a "("
 * (URLs, slugs, ids) short-circuit untouched.
 */
export function smartScriptDeep<T>(value: T, options: SmartScriptOptions = {}): T {
  if (typeof value === 'string')
    return smartScript(value, options) as T
  if (Array.isArray(value))
    return value.map(item => smartScriptDeep(item, options)) as T
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, smartScriptDeep(val, options)]),
    ) as T
  }
  return value
}

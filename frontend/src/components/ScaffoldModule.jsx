// Renders a scaffolding module from a definition + frozen colour set.
// The module's `build(colors)` returns JSX of its primitives.
export function ScaffoldModule({ module: mod, colors }) {
  return mod.build(colors)
}

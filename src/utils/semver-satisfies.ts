function verCmp(a: string, b: string): number {
  const getComponents = (v: string): number[] =>
    v
      .split(/[-+]/)[0]
      .split('.')
      .map((i) => +i);

  const aComponents = getComponents(a);
  const bComponents = getComponents(b);

  const base = Math.max(...aComponents, ...bComponents) + 1;
  const componentsToNumber = (components: number[]): number =>
    components.reverse().reduce((acc, n, idx) => acc + n * base ** idx, 0);

  return componentsToNumber(aComponents) - componentsToNumber(bComponents);
}

export default function semverSatisfies(
  version: string,
  geVersion: string,
  ltVersion?: string,
): boolean {
  return verCmp(version, geVersion) >= 0 && (ltVersion == null || verCmp(version, ltVersion) < 0);
}

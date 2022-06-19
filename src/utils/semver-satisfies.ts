export default function semverSatisfies(
  version: string,
  geVersion: string,
  ltVersion: string,
): boolean {
  const getComponents = (v: string): number[] => v
    .split(/[-+]/)[0].split('.').map((i) => +i);

  const versionComponents = getComponents(version);
  const geComponents = getComponents(geVersion);
  const ltComponents = getComponents(ltVersion);

  const base = Math.max(...versionComponents, ...geComponents, ...ltComponents) + 1;
  const componentsToNumber = (components: number[]): number => components.reverse()
    .reduce((acc, n, idx) => acc + n * base ** idx, 0);

  const vNumber = componentsToNumber(versionComponents);
  const geNumber = componentsToNumber(geComponents);
  const ltNumber = componentsToNumber(ltComponents);
  return vNumber >= geNumber && vNumber < ltNumber;
}

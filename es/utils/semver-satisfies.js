export default function (version, geVersion, ltVersion) {
  const versionComponents = version.split('-')[0].split('.')
  const geComponents = geVersion.split('-')[0].split('.')
  const ltComponents = ltVersion.split('-')[0].split('.')
  const base = Math.max(...versionComponents, ...geComponents, ...ltComponents) + 1
  const toNumber = (components, sliceLength) => components.slice(0, sliceLength).reverse()
    .reduce((acc, n, idx) => acc + n * Math.pow(base, idx), 0)

  const componentsMinAmount = Math.min(versionComponents.length, geComponents.length, ltComponents.length);
  const vNumber = toNumber(versionComponents, componentsMinAmount)
  const geNumber = toNumber(geComponents, componentsMinAmount)
  const ltNumber = toNumber(ltComponents, componentsMinAmount)
  return vNumber >= geNumber && vNumber < ltNumber
}

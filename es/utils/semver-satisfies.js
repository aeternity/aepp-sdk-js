export default function (version, geVersion, ltVersion) {
  const versionComponents = version.split('.')
  const geComponents = geVersion.split('.')
  const ltComponents = ltVersion.split('.')
  const base = Math.max(...versionComponents, ...geComponents, ...ltComponents) + 1
  const toNumber = components => components.reverse()
    .reduce((acc, n, idx) => acc + n * Math.pow(base, idx), 0)

  const vNumber = toNumber(versionComponents)
  const geNumber = toNumber(geComponents)
  const ltNumber = toNumber(ltComponents)
  return vNumber >= geNumber && vNumber < ltNumber
}

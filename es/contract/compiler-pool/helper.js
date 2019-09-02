export const prepareCompilerObject = (name, compiler) => ({
  name,
  instance: compiler,
  url: compiler.compilerUrl,
  version: compiler.compilerVersion,
})

export const COMPILER_METHODS = [
  'contractEncodeCallDataAPI',
  'contractDecodeDataAPI',
  'compileContractAPI',
  'contractGetACI',
  'contractDecodeCallDataByCodeAPI',
  'contractDecodeCallDataBySourceAPI',
  'contractDecodeCallResultAPI',
  'getCompilerVersion',
  'setCompilerUrl'
]

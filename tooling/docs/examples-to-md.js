const path = require('path')
const fs = require('fs')

function splitCodeIntoBlocks (text) {
  const content = []
  while (text) {
    const commentIndex = text.search(/\n *\//)
    switch (commentIndex) {
      case -1:
        content.push({ type: 'code', content: text })
        return content
      case 0:
        text = text.slice(commentIndex).trimLeft().slice(1)
        break
      default:
        content.push({ type: 'code', content: text.slice(0, commentIndex) })
        text = text.slice(commentIndex).trimLeft().slice(1)
        break
    }
    switch (text[0]) {
      case '/':
        content.push({ type: 'comment', content: text.slice(1, text.indexOf('\n')) })
        text = text.slice(text.indexOf('\n'))
        break
      case '*':
        content.push({ type: 'comment', content: text.slice(1, text.indexOf('*/')) })
        text = text.slice(text.indexOf('*/') + 2)
        break
      default:
        throw new Error(`Parsing failed, unknown char: ${text[0]}`)
    }
  }
  return content
}

process.argv.slice(2).forEach(fileName => {
  const inputFilePath = path.resolve(process.cwd(), fileName)
  const text = fs.readFileSync(inputFilePath).toString()

  const textMd = splitCodeIntoBlocks(text)
    .map(({ type, content }) => ({
      type,
      content: type === 'code' ? content.replace(/^\n+|\n+$/g, '') : content.trimLeft()
    }))
    .filter(({ type, content }) => type !== 'code' || content)
    .filter(({ content }) => !content.includes('License'))
    .filter(({ content }) => !content.includes('#!/'))
    .map(({ type, content }) => type === 'code' ? `\`\`\`js\n${content}\n\`\`\`` : content)
    .join('\n')

  const fileParsedPath = path.parse(path.resolve(process.cwd(), 'docs', fileName))
  fs.mkdirSync(fileParsedPath.dir, { recursive: true })

  const outputFilePath = path.format({ ...fileParsedPath, base: undefined, ext: '.md' })
  fs.writeFileSync(outputFilePath, Buffer.from(textMd))
  console.log(`${inputFilePath} -> ${outputFilePath}`)
})

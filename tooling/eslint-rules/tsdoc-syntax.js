/**
 * Remove after fixing https://github.com/microsoft/tsdoc/issues/220
 */

const plugin = require('eslint-plugin-tsdoc');

const { create } = plugin.rules.syntax;

plugin.rules.syntax.create = (context) => create(new Proxy({}, {
  get(target, name) {
    if (name !== 'report') return context[name];
    return (data) => {
      if (data.messageId === 'tsdoc-param-tag-with-invalid-name') return;
      context.report(data);
    };
  },
}));

module.exports = plugin.rules.syntax;

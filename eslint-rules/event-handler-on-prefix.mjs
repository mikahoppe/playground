const ON_PREFIX = /^on[A-Z0-9]/;

/**
 * Resolve the binding name and reportable node for a function-like node.
 */
function named(node) {
  if (node.type === "FunctionDeclaration" && node.id) {
    return { name: node.id.name, idNode: node.id };
  }

  const parent = node.parent;
  if (
    parent?.type === "VariableDeclarator" &&
    parent.id.type === "Identifier"
  ) {
    return { name: parent.id.name, idNode: parent.id };
  }

  return null;
}

/**
 * Custom rule: functions that act as event handlers must be named with an
 * "on" prefix.
 */
export const eventHandlerOnPrefix = {
  meta: {
    type: "suggestion",
    docs: {
      description: 'Event handler functions must be named with an "on" prefix.',
    },
    messages: {
      badName:
        'Event handler "{{name}}" must be named with an "on" prefix (e.g. onClick).',
    },
    schema: [],
  },
  create(context) {
    const declByName = new Map();
    const handlerNames = new Set();
    const reported = new Set();

    function report(name, node) {
      if (!name || ON_PREFIX.test(name) || reported.has(name)) {
        return;
      }

      reported.add(name);
      context.report({ node, messageId: "badName", data: { name } });
    }

    function visitFn(node) {
      const info = named(node);
      if (!info) {
        return;
      }

      if (!declByName.has(info.name)) {
        declByName.set(info.name, info.idNode);
      }
    }

    return {
      FunctionDeclaration: visitFn,
      FunctionExpression: visitFn,
      ArrowFunctionExpression: visitFn,
      JSXAttribute(node) {
        if (
          node.name?.type !== "JSXIdentifier" ||
          !/^on/.test(node.name.name)
        ) {
          return;
        }
        const value = node.value;
        if (
          value?.type === "JSXExpressionContainer" &&
          value.expression.type === "Identifier"
        ) {
          handlerNames.add(value.expression.name);
        }
      },
      "Program:exit"() {
        for (const name of handlerNames) {
          const idNode = declByName.get(name);
          if (idNode) {
            report(name, idNode);
          }
        }
      },
    };
  },
};

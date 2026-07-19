import ts from "typescript";

const IS_PREFIX = /^is[A-Z0-9]/;

/**
 * Returns whether a resolved TS type is boolean.
 */
function isBooleanType(type) {
  if (!type) {
    return false;
  }

  if (type.flags & ts.TypeFlags.BooleanLike) {
    return true;
  }

  if (typeof type.isUnion === "function" && type.isUnion()) {
    return (
      type.types.length > 0 &&
      type.types.every((t) => t.flags & ts.TypeFlags.BooleanLike)
    );
  }

  return false;
}

/**
 * Collect every bound Identifier node in a (possibly destructured) pattern.
 */
function collectIds(pattern, out) {
  if (!pattern) {
    return;
  }

  switch (pattern.type) {
    case "Identifier":
      out.push(pattern);
      break;
    case "ArrayPattern":
      for (const el of pattern.elements) {
        collectIds(el, out);
      }
      break;
    case "ObjectPattern":
      for (const prop of pattern.properties) {
        collectIds(
          prop.type === "RestElement" ? prop.argument : prop.value,
          out,
        );
      }
      break;
    case "RestElement":
      collectIds(pattern.argument, out);
      break;
    case "AssignmentPattern":
      collectIds(pattern.left, out);
      break;
  }
}

/**
 * Custom rule: boolean variables must be named with an "is" prefix. Uses TS
 * type information, so it catches inferred booleans.
 */
export const booleanIsPrefix = {
  meta: {
    type: "suggestion",
    docs: {
      description: 'Boolean variables must be named with an "is" prefix.',
    },
    messages: {
      badName:
        'Boolean variable "{{name}}" must be named with an "is" prefix (e.g. isOpen).',
    },
    schema: [],
  },
  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services?.program || !services.esTreeNodeToTSNodeMap) {
      return {};
    }
    const checker = services.program.getTypeChecker();

    /**
     * Resolve the TS type of an ESTree node via the parser services.
     */
    function typeOf(node) {
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      return tsNode ? checker.getTypeAtLocation(tsNode) : null;
    }

    return {
      VariableDeclarator(node) {
        const ids = [];
        collectIds(node.id, ids);
        for (const id of ids) {
          if (isBooleanType(typeOf(id)) && !IS_PREFIX.test(id.name)) {
            context.report({
              node: id,
              messageId: "badName",
              data: { name: id.name },
            });
          }
        }
      },
    };
  },
};

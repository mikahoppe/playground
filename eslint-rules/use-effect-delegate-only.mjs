/**
 * Custom rule: a useEffect callback must only delegate to named function(s).
 */
export const useEffectDelegateOnly = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "useEffect callbacks must delegate to a separate named function.",
    },
    messages: {
      notDelegate:
        "useEffect callback must only call named function(s); move this logic into a separate named function.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "useEffect"
        ) {
          return;
        }
        const cb = node.arguments[0];
        if (
          !cb ||
          (cb.type !== "ArrowFunctionExpression" &&
            cb.type !== "FunctionExpression")
        ) {
          return;
        }
        if (cb.body.type !== "BlockStatement") {
          if (cb.body.type !== "CallExpression") {
            context.report({ node: cb.body, messageId: "notDelegate" });
          }
          return;
        }
        for (const stmt of cb.body.body) {
          const isDelegatingCall =
            stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "CallExpression";
          if (!isDelegatingCall && stmt.type !== "ReturnStatement") {
            context.report({ node: stmt, messageId: "notDelegate" });
          }
        }
      },
    };
  },
};

export default function text(ctx, node) {
  return {
    type: "core/franklin/components/text/v1/text",
    text: node.value,
  };
}
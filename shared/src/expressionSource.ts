import {parseExpression} from './expr';
/** Serialize the parsed arithmetic tree without substituting symbols by string replacement. */
export function expressionSource(node:ReturnType<typeof parseExpression>):string {
 if(node.t==='num')return String(node.v);if(node.t==='var')return node.name;if(node.t==='neg')return `(-${expressionSource(node.a)})`;
 if(node.t==='call')return `${node.fn}(${expressionSource(node.a)})`;return `(${expressionSource(node.a)}${node.op}${expressionSource(node.b)})`;
}

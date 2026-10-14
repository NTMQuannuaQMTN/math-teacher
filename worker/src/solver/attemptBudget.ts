import type { JsonModel } from './llm';
import { withinSignal } from './deadline';

/** Reserve time for a fallback even when the primary ignores cancellation. */
export class AttemptBudgetJsonModel implements JsonModel {
  readonly name: string;
  readonly grammarConstrained?: boolean;
  constructor(private readonly inner: JsonModel, private readonly milliseconds: number) {
    this.name=inner.name;this.grammarConstrained=inner.grammarConstrained;
  }
  get model():string { return this.inner.model; }
  complete(input:Parameters<JsonModel['complete']>[0]):Promise<string> {
    const signal=AbortSignal.any([input.signal,AbortSignal.timeout(this.milliseconds)]);
    return withinSignal(signal,()=>this.inner.complete({...input,signal}));
  }
}

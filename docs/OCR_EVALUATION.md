# OCR evaluation

The OCR contract is constrained JSON with raw text, display text, numbered problems, language, coarse provider confidence, and issue flags. `normalizeOcrOutput` derives plain text from validated display text, rejects malformed/degenerate output, preserves uncertainty flags, and retries malformed provider output once. Provider fallback is limited to transient provider failures.

The fixture suite covers arithmetic, fractions, roots, inequalities, systems, functions, geometry, Vietnamese/English word problems, handwriting, blur, multi-question exam pages, and prompt-injection text. Run `npm run ocr:eval` when provider configuration is available; run `npm test --prefix worker -- ocrTextFormat normalize ocrFallback` for deterministic normalization tests.

Current limitation: fixture expectations validate format and normalization, not full character-level truth against human-proofread transcriptions. Therefore no CER or symbol-accuracy claim is made until gold transcriptions are added. Material ambiguity must remain in `issues`/low-quality status rather than being silently corrected by the solver.

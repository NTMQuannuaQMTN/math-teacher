/** Policy extracted after offline tabular Q-learning, seed 42, 2167 episodes.
 * Optimistic heuristic initialization already yields this optimal policy;
 * this experiment does not establish an improvement caused by learning.
 * No exact-search demonstrations or language-model weight updates.
 * Proven independently by exhaustive coordinate-path checking and a second
 * backward universal-predecessor search (minimum 6 turns on the 2x9 board).
 * Source: tools/specialist-training/game-theory-02/rl-4-42.json.
 * No training/inference runs during a request; every returned plan is rechecked.
 */
export const LEARNED_TWO_BY_NINE_FOUR:readonly (readonly number[])[]=[
 [0,2,10,12],[3,5,13,15],[1,6,8,16],[0,2,10,12],[3,5,13,15],[0,6,8,16],
];

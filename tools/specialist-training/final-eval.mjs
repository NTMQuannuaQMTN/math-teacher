import {spawnSync} from 'node:child_process';
import {assertFrozen} from './freeze.mjs';
assertFrozen();
for(const split of ['held_out','development']){
 const r=spawnSync(process.execPath,['tools/specialist-training/application-eval.mjs','frozen-'+split,split],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status??1);
 assertFrozen();
}

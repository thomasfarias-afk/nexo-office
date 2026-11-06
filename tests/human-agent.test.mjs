import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createHumanAgent} from '../src/agent-lab/human.ts';

test('human has grounded, human-scale proportions and the requested facial and hand details',()=>{
 const human=createHumanAgent();human.root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(human.root);
 assert(Math.abs(bounds.min.y)<.003);assert(bounds.max.y>1.85&&bounds.max.y<2.1);
 const counts={};human.root.traverse(o=>{counts[o.name]=(counts[o.name]||0)+1;if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.array.length;i++)assert(Number.isFinite(p.array[i]));}});
 assert.equal(counts.Finger_proximal,8);assert.equal(counts.Thumb_tip,2);assert.equal(counts.Fingernail,8);assert.equal(counts.Thumbnail,2);
 assert.equal(counts.Iris,2);assert.equal(counts.Upper_eyelid,2);assert.equal(counts.Ear_helix,2);assert.equal(counts.Hair_strand,42);
 assert(counts.Jacket_lapel===2&&counts.Shoelace===10);human.dispose();
});
test('appearance, expression and articulated poses can change without rebuilding the character',()=>{
 const human=createHumanAgent();human.setAppearance({skin:'#85563e',jacket:'#303d59',hair:'#a6a8aa',glasses:false});
 assert.equal(human.root.getObjectByName('Face_contour').material.color.getHexString(),'85563e');
 assert.equal(human.root.getObjectByName('Glasses').visible,false);
 human.setExpression(.8);assert(human.root.getObjectByName('Teeth'));
 human.update(1.2,'wave',true);assert(human.arms[1].shoulder.rotation.z>2);
 human.update(1.2,'walk',true);assert(Math.abs(human.legs[0].hip.rotation.x)>.01);
 human.update(0,'idle',false);assert.equal(human.legs[0].hip.rotation.x,0);assert.equal(human.root.position.y,0);
 human.dispose();
});

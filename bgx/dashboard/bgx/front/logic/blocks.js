// Copyright 2018 NTRlab
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// -----------------------------------------------------------------------------

import { trimHash, decode } from '../helpers/helper';
import cloneDeep from 'lodash/cloneDeep';

export function convertBlocks(data) {
  let d= data.map((d) => {
    const prev = data.find(dd => dd.header_signature == d.header.previous_block_id);

    d.block_num = d.header.block_num;
    d.signer_public_key = d.header.signer_public_key;
    d.name = trimHash(d.header_signature);
    d.IP = d.header_signature;
    d.tooltip = {
      1: d.header_signature,
      '№': d.block_num
    };
    d.depends = prev == undefined ? [] : [prev.header_signature];
    d.dependedOnBy = data.filter((dd) => {
        return dd.header.previous_block_id == d.header_signature;
      }).map((dd) => {return dd.header_signature});
    d.isHidden = false;
    d.depth = 0;

    return d;
  })
  return d;
  // return compactBlocks(d);
}


function calcNesting(el, data, depth) {
  if (el.depends.length > 0){
    const parent = data.find(e => e.IP == el.depends[0]);
    return calcNesting(parent, data, depth+1)
  }
  else
    return depth;
}

export function compactBlocks(o_data, dagNest={}) {
  if (o_data == undefined) return

  let data = cloneDeep(o_data);
  data = data.reverse();
  let result = [];
  data.forEach((d,i) => {
    if (d.dependedOnBy.length == 1 && d.depends.length == 1 && !Object.keys(dagNest).includes(d.IP)){
      //find container
      let thread = result.find(r => {
        return 'hidden' in r && r.hidden.includes(d.depends[0])
      })
      let isNew =  thread == undefined;

      // else create container

      if (isNew){
        thread = {
          depends: d.depends,
          dependedOnBy: [d.IP],
          hidden: [],
          header:{batch_ids: []},
          tooltip: [],
          name: '+',
          IP: `sum${i}`,
          isHidden: false,
          lastDependedOnBy: [d.IP],
          preLastDependedOnBy: [d.IP],
          firstDependedOnBy: [d.IP],
          depth: 0,
        }
        d.depends=[thread.IP]
      }
      thread.hidden.push(d.IP);
      thread.lastDependedOnBy = d.dependedOnBy;
      thread.preLastDependedOnBy = [d.IP];
      thread.tooltip.push(d.tooltip['1'])

      if (isNew)
        result.push(thread)
    }

    result.push(d)
  });

  result = result.map(d => {
    if ('hidden' in d && d.hidden.length == 1){
      //cut one block
      let next = result.find(r => r.IP == d.dependedOnBy[0]);
      let prev = result.find(r => r.IP == d.depends[0]);

      next.depends = [prev.IP];
      prev.dependedOnBy = [next.IP];

      return;
    }

      // return d.hidden[0]
    else
      return d;
  }).filter(r => r != undefined);

  result.forEach(dd => {
    dd.depth = calcNesting(dd, result, 1);
  })

  return result;
}

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

export function convertBlocks(data) {
  let d= data.map((d) => {
    const prev = data.find(dd => dd.header_signature == d.header.previous_block_id);

    d.block_num = d.header.block_num;
    d.signer_public_key = d.header.signer_public_key;
    d.name = trimHash(d.header_signature);
    d.IP = d.header_signature;
    d.tooltip = {
      1: d.header_signature,
    };
    d.depends = prev == undefined ? [] : [prev.header_signature];
    d.dependedOnBy = data.filter((dd) => {
        return dd.header.previous_block_id == d.header_signature;
      }).map((dd) => {return dd.header_signature});

    return d;
  })
  // return d;
  return compactBlocks(d);
}

function compactBlocks(data) {
  data = data.reverse();
  let result = [];
  data.forEach(d => {
    if (d.dependedOnBy.length == 1 && d.depends.length == 1){
      //find container
      let thread = result.find(r => {
        return 'hidden' in r && d.IP == r.dependedOnBy[0]
      })
      let isNew =  thread == undefined;

      // else create container

      if (isNew)
        thread = {
          depends: d.depends,
          hidden: [],
          header:{batch_ids: []},
          tooltip: [],
          name: '  .  .  .  ',
        }
      thread.hidden.push(d);
      thread.dependedOnBy = d.dependedOnBy;
      thread.IP = d.IP;
      thread.tooltip.push(d.tooltip['1'])

      if (isNew)
        result.push(thread)
    }
    else {
      result.push(d)
    }
  });

  result = result.map(d => {
    if ('hidden' in d && d.hidden.length == 1)
      return d.hidden[0];
    else
      return d;
  });
  return result;
}

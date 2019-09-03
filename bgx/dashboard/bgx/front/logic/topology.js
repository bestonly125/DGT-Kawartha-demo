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
import colorbrewer from 'colorbrewer';

export function convertTopology(data) {
  let c = {};
  getColors(data, c)
  //getChildren(data.children, keys);

  let colors = colorbrewer.Set3[Object.keys(c).length+3];

  Object.keys(c).map((key,i) => {
    c[key]['color'] = colors[i]
  })

  return c;
}

function getColors(data, out) {
  if ('name' in data) {
    let arr = []
    Object.keys(data.children).map((key) =>
      {
        if ('cluster' in data.children[key]){
          arr.push(key);
          getColors(data.children[key].cluster, out);
        }
        else {
          arr.push(key);
        }
      }
    );
    out[data.name] = {ids: arr};
  }
}

function getChildren(node, colors) {
  console.log('node', node);
  if (node.cluster)
    return getChildren(node.cluster.children, colors)
  else
    Object.keys(node).forEach(key => {
        console.log('t', node[key]);
      if ('cluster' in node[key]) getChildren(node[key].cluster.children, colors)
      colors.push(key)
    });
}

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

import colorbrewer from 'colorbrewer';
import { trimHash } from '../helpers/helper';

export function convertPeers(data) {
  let r = [];
  convertNode(r, data );
  return {
    data: r,
    filters: [], //convertFilters(data.data.groups, r),
  }
}

function convertFilters(filters, d){
  let f = filters.map((f) => {
    f.list = []
    d.forEach((i) => {
      if ( !f.list.includes(i[f.field]) ){
        f.list.push(i[f.field])
      }
    });
    return f;
  })

  let count =0;
  let ff = [];

  f.forEach((f) => {
    count += f.list.length;
    ff = ff.concat(f.list);
  })
  let colors = colorbrewer.Set3[count+5];

  console.log('color', colors)

  colors[1] = '#8dd3c7';
  colors[0] = '#ffffb3';

  console.log('color2', colors)

  let r = 0;

  f.forEach((f) => {
    let arr = {};
    f.list.forEach((i) => {
      return arr[i] = colors[r++];
    })
    f.list = arr;
  })

  let i={};
  ff.map((f) => { i[f] = colors[r++]; return i});

  return { filters: f, };
}

function convertNode(r, node, parent_node = null){
  let children = {};

  if (typeof node.cluster !== 'undefined') children = node.cluster.children;
  else if (typeof node.children !== 'undefined') children = node.children;

  let IP = typeof node.key == 'undefined' ? 'Genesis' : node.key;
  node = {...node, IP: IP};

  let ch = Object.keys(children).map(key => {return {...children[key], key:key };});

  ch.forEach(child => convertNode(r, child, node) );

  let n = node.endpoint;
  if (n == undefined) n = node.key;
  if (n == undefined) n = 'Genesis';

  let legend = [];

  legend.push({"Main": {
    'Public Key': IP,
    'Address': n,
    'State': node.node_state,
    'Type': node.node_type,
    'Date Created': '15.04.2018',
    'Date Updated': '17.08.2018',
    'KYCKey': '0ABD7E',
    'SLA': 'blocked',
    'Cluster': 'eea98-0ABD7E-ff7ea-0BCDA',
    'Transactions Count' : 42,
  }})

  let keys_for_legend = Object.keys(node).filter((k) => {
  return !['IP', 'name', 'topology', 'port', 'node_type', 'node_type_desc', 'node_state', 'public_key', 'type', 'key', 'delegates', 'endpoint',
            'children'].includes(k) })

  keys_for_legend.forEach((k) => {
    let r = {};
    r[k] = node[k];
    legend.push( r );
    })

  let tooltip = {'name': n};

  if (typeof node.type != 'undefined') tooltip.type = node.type;
  if (typeof node.node_state != 'undefined') tooltip.node_state = node.node_state;

  r.push({
      name: trimHash(n),
      IP: node.IP,
      port: node.port,
      node_state: node.node_state,
      node_type: node.node_type,
      public_key:  node.public_key,
      type: node.name,
      dependedOnBy:  ch.map(j => j.IP),
      depends: parent_node != null ? [parent_node.IP] : [],
      legend: legend,
      tooltip: tooltip,
      filtered: false,
      raw_data: node,
    });
  return r;
}

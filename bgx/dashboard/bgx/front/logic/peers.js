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
import cloneDeep from 'lodash/cloneDeep';

export function convertPeers(data) {
  let r = [];
  let depth = 1;
  convertNode(r, data, depth);
  let groups =[{
    "field": "node_state",
    "list": [],
    "name": "Activity"
  },{
    "field": "type",
    "list": [],
    "name": "Type"
  },{
    "field": "role",
    "list": [],
    "name": "Role"
  }];
  let rr = data.topology !== 'static' ?  hideInactive(r) : r;
  return {
    data: rr,
    filters: convertFilters(groups, rr),
    topology: data.topology,
    identity: data.Identity,
    Network: data.Network,
  }
}

function hideInactive(data){
  let dd = cloneDeep(data)


  dd = dd.map(d => {
    if (d.node_state == 'inactive' && d.type != 'cluster') {
      d.dependedOnBy.map(ip => {
        let parent = dd.find(d=> d.IP == ip);
        let parentIndex= parent.depends.indexOf(ip);
        parent.depends.splice(parentIndex, 1);
        parent.depends.concat(d.depends);
      })

      d.depends.map(ip => {
        let child = dd.find(d => d.IP == ip);
        child.dependedOnBy = d.dependedOnBy;
      })
      return null;
    }
    return d;
  });
  return dd.filter(d => d != null);
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

  let colors = colorbrewer.Set3[12];

  // colors[1] = '#8dd3c7';
  // colors[0] = '#ffffb3';

  let r = 0;

  f.forEach((f) => {
    let arr = {};
    f.list.sort().forEach((i) => {
      return arr[i] = colors[r++];
    })
    f.list = arr;
  })

  let i={};


  ff.map((f) => { i[f] = colors[r++]; return i});

  return  f;
}

function convertNode(r, node, depth, parent_node = null){
  let children = {};

  // if (typeof node.cluster !== 'undefined') children = node.cluster.children;
  if (typeof node.children !== 'undefined') children = node.children;

  let IP = typeof node.key == 'undefined' ? node.name : node.key;
  node = {...node, IP: IP};


  if (typeof node.cluster !== 'undefined')
    convertNode(r, node.cluster, depth+1, node);


  let ch = Object.keys(children).map(key => {return {...children[key], key:key };});

  ch.forEach(child => convertNode(r, child, depth+1, node) );
  let n = undefined
  try {
    n = node.endpoint.match(/:\/\/([^:]*)/)[1];
  }
  catch {
    n = node.endpoint;
  }
  if (n == undefined) n = trimHash(node.key);
  if (n == '') n = node.name;

  let main = {
    'Name': n,
    // 'Date Created': '15.04.2018',
    // 'Date Updated': '17.08.2018',
    // 'KYCKey': '0ABD7E',
    // 'SLA': 'blocked',
    // 'Cluster': 'eea98-0ABD7E-ff7ea-0BCDA',
    // 'Transactions Count' : 42,
  }
  if (typeof node.endpoint !== 'undefined') main.Address = node.endpoint;
  if (typeof node.node_state !== 'undefined') main.State = node.node_state;
  if (typeof node.type !== 'undefined') main.Type = node.type;
  if (typeof node.key !== 'undefined') main.PublicKey = node.key;
  if (typeof node.role !== 'undefined') main.Role = node.role;
  if (typeof node.component !== 'undefined') main['zzz'] = node.component;
  // let keys_for_legend = Object.keys(node).filter((k) => {
  // return !['IP', 'name', 'topology', 'port', 'node_type', 'node_type_desc', 'node_state', 'public_key', 'type', 'key', 'delegates', 'endpoint',
  //           'children'].includes(k) })

  // keys_for_legend.forEach((k) => {
  //   let r = {};
  //   r[k] = node[k];
  //   legend.push( r );
  //   })

  let tooltip = {'name': n};

  if (typeof node.type != 'undefined') tooltip.type = node.type;
  if (typeof node.node_state != 'undefined') tooltip.node_state = node.node_state;

  r.push({
      name: n,
      IP: node.IP,
      port: node.port,
      node_state: typeof node.node_state !== 'undefined' ? node.node_state : 'inactive',
      node_type: typeof node.type !== 'undefined' ? node.type : 'cluster',
      type: node.type,
      role: typeof node.role !== 'undefined' ? node.role : 'child',
      public_key:  node.public_key,
      dependedOnBy:  ch.map(j => j.IP),
      depends: parent_node != null ? [parent_node.IP] : [],
      legend: [{"Main": main}],
      tooltip: tooltip,
      filtered: false,
      raw_data: node,
      component: node.component,
      depth: 0 //depth //fro nesting
    });
  return r;
}

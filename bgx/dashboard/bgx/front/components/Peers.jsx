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

import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames/bind';

import humanize from '../helpers/humanize';

import Graph from './Graph';
import Legend from './Legend';
import Filters from './Filters';
import Card from './Card';

import Hash from './Hash';

import ReactTable from 'react-table';

import { showModal, getTopology, changeDashboard, PRINT_TOPOLOGY} from '../actions/actions';

class Peers extends React.Component {
  constructor(props){
    super(props);
    this.state= {
      selectedIP: null,
      selectedFilters: {},
      legend: [],
    };

    this.update = this.update.bind(this)
  }

  update(){
    store.dispatch(getTopology());
  }

  selectPeer(ip) {
    this.setState({selectedIP: ip,
      legend: this.legendFor(ip)});
  }

  legendFor(ip) {
    const { data } = this.props;

    if (data == undefined){
      return [];
    }
    let f = data.find(p => {return  p.IP == ip} );

    if (f == undefined)
      return [];
    else
      return data.find(p => {return  p.IP == ip} ).legend;
  }

  filterPeer(filters) {
    this.setState({selectedFilters: filters});
  }

  render() {
    const { data, filters, columns, loading, topologyType, onChangeDashboard, onPrint } = this.props;
    const { selectedIP, selectedFilters, legend } = this.state;

    return (
      <div>
        <div className='row'>
          <div className='col-9'>
            <Graph data={data}
              btns={[{name: 'Print', handler: onPrint},
                     {name: 'Back', handler: onChangeDashboard},
                     {name: 'Update', handler: this.update},
                     ]}
              filters={filters}
              selectedPeerIP={selectedIP}
              selectedFilters={selectedFilters}
              id='peers_graph'
              title={`Node [${topologyType}]`}
              onSelect={(e) => this.selectPeer(e)}
              onFilter={(e) => this.filterPeer(e)}
              loading={loading}/>
          </div>
          <div className='col-3'>
            <Legend legend= {legend}/>
          </div>
        </div>
        <Filters
          filters={filters}
          selectedFilters={selectedFilters}
          onFilter={(e) => this.filterPeer(e)}/>

        <div className='tab-offset'>
        <Card id='node-data' title='Node Data'
                  btns={[{name: 'Update', handler: onChangeDashboard}]}
                  loading={loading}>
          <ReactTable data={data}
              defaultPageSize={10}
              columns={columns}
              minRows={0}
              className='-striped'
              getTrProps={(state, rowInfo) => {
                if (rowInfo && rowInfo.row) {
                  return {
                    onClick: () => {
                      this.selectPeer(rowInfo.original.IP)
                      delete rowInfo.original.raw_data.IP;
                      store.dispatch(showModal({title: 'Node raw data',
                        json: rowInfo.original.raw_data
                      }))
                    },
                    style: {
                      background: rowInfo.original.IP === this.state.selectedIP ? '#b8daff' :
                       rowInfo.viewIndex%2 == 0 ? 'rgba(0,0,0,.05)' : 'white',
                    }
                  }
                }else{
                  return {}
                }
              }}/>
          </Card>

        </div>
      </div>
    )
  }
}

Peers.defaultProps = {
  data: [],
  loading: false,
  filters: [],
  columns: [
    {
      id: 'name',
      Header: 'Name',
      accessor: t => t.name,
      width: 180,
    },
    { id: 'node_state',
      Header: humanize('node_state'),
      accessor: t => humanize(t.node_state),
      width: 100,
    },
    {
      id: 'node_type',
      Header: humanize('node_type'),
      accessor: t => humanize(t.node_type),
      width: 100,
    },
    { id: 'IP',
      Header: 'Public Key',
      accessor: t => <Hash hash={t.IP} length={40}/>,
    },
  ],
};

export default connect (
  state => ({
    data: state.blocksReducer.nodes.data,
    topologyType: state.blocksReducer.nodes.topology,
    loading: state.blocksReducer.loading,
    filters:  state.blocksReducer.nodes.filters,
  }),
  dispatch => ({
      onChangeDashboard: () => changeDashboard(dispatch),
      onPrint: () => dispatch({type: PRINT_TOPOLOGY} ),

  }))(Peers);

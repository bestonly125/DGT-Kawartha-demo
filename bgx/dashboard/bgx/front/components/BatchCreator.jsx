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

import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames/bind'
import JSONPretty from 'react-json-pretty';
import Hash from './Hash'

import humanize from '../helpers/humanize';

import { showModal2, getReceipt, getBatches, getBatchDetails, run, refreshLink } from '../actions/actions';
import BatchDetails from './BatchDetails';

import ReactTable from 'react-table'
import Card from './Card'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class BatchCreator extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      family: 0,
      command: 0,
      params: {},
      url: 0
    }
  }

  componentDidMount(){
    store.dispatch(getBatches());
  }


  familySelector() {
    const {tfamilies} = this.props;
    return (
    <div class="form-group">
      <label for="familyInput">Family</label>
      <select class="form-control" id="familyInput" onChange={(e) => this.setState({family: e.target.value, command: 0, params: {} })}>
      <option value="0" selected>Choose</option>
      {Object.keys(tfamilies).map(k => {
        return <option value={k}>{k}</option>
      })}
      </select>
    </div>);
  }

  urlSelector() {
    const {urls} = this.props;
    return (
    <div class="form-group">
      <label for="urlInput">Url</label>
      <select class="form-control" id="urlInput" onChange={(e) => this.setState({url: e.target.value })}>
      <option value="0" selected>Choose</option>
      {urls.map(k => {
        return <option value={k}>{k}</option>
      })}
      </select>
    </div>);
  }

  commandSelector() {
    const {tfamilies} = this.props;
    const {family} = this.state;

    if (family == 0)
      return null

    const commands = Object.keys(tfamilies[family].commands)
    return (
      <div class="form-group">
        <label for="commandInput">Command</label>
        <select class="form-control" id="commandInput" onChange={(e) => this.setState({command: e.target.value, params: {}})}>
        <option value="0" selected>Choose</option>
        {commands.map(k => {
          return <option value={k}>{k}</option>
        })}
        </select>
      </div>);
  }

  paramInputs() {
    const {tfamilies} = this.props;
    const {family, command} = this.state;

    if (family == 0 || command == 0)
      return null

    const params = tfamilies[family].commands[command];

    return (
      <fieldset class="form-group form-row">
        {params.map(k => {
          return <div class="form-group col">
            <label for={`param${k}`}>{k}</label>
            <input
            type="text"
            className="form-control"
            id={`param${k}`}
            value={this.state.params[k]}
            onChange={(e) => this.setState({params: {...this.state.params, [k]: e.target.value} })} />
          </div>
        })}
      </fieldset>
    )
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.onRun({
      url: this.state.url,
      cmd: this.state.command,
      params: this.state.params,
    });
  }

  render() {
    const {batches, link, onRefresh, receipt, columns, loading, onShowModal, onGetReceipt, onGetBatches, onGetBatchDetails, tfamilies} = this.props
    return (
      <div>

        <Card id='batch_create' title='Create Batch'>
          <form onSubmit={(e) => this.handleSubmit(e)}>
            {this.familySelector()}
            {this.urlSelector()}
            {this.commandSelector()}
            {this.paramInputs()}
            <button type="submit" class="btn btn-secondary">Execute</button>
          </form>

          {link}
          <br/>
          <a className='btn btn-secondary' onClick={() => onRefresh(this.props.link)}>Refresh</a>
          <br/>
          <JSONPretty json={receipt}/>
        </Card>
      </div>
    )
  }
}

BatchCreator.defaultProps = {
  batches: [],
  loading: false,
  columns: [
  { id: 'header_signature',
    Header: 'Batch ID',
    filterable: false,
    accessor: d => {
      return <Hash hash={d.header_signature}/>
    },
  },
  { id: 'transactions',
    Header: 'Transactions',
    filterable: false,
    accessor: d => {
      return d.header.transaction_ids.map(i => {return <Hash hash={i}/>})
    },
  },
  { id: 'transaction_count',
    Header: 'Transaction Count',
    filterable: false,
    accessor: d => {
      return d.header.transaction_ids.length
    },
  },
  {
    id: 'signer_public_key',
    Header: 'Signer Public Key',
    filterable: false,
    accessor: d => {
      return <Hash hash={d.header.signer_public_key}/>
    },
  },
]
};

export default connect (
  state => ({
    link: state.batchesReducer.link,
    receipt: state.batchesReducer.batch_link,
    urls: [state.blocksReducer.nodes.identity.IP].concat(state.blocksReducer.nodes.data.map(d => d.component).filter(dd => {return dd != null})),
    tfamilies: {
      bgt: {
        commands: {
          set: ['vallet', 'amount'],
          dec: ['vallet', 'amount'],
          inc: ['vallet', 'amount'],
          show: ['vallet'],
        }
      },
     bgx2: {
        commands: {
          create: ['arg1', 'arg2'],
          drop: ['arg1', 'arg2', 'arg3']
        }
      }
    }
  }),
  dispatch => ({
    onRun: params => run(dispatch, params),
    onRefresh: (link) => refreshLink(dispatch, link)
  })
  )(BatchCreator);

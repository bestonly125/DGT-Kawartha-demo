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
import JSONPretty from 'react-json-pretty';


import { getBatchDetails } from '../actions/actions';


import ReactTable from 'react-table'
import Card from './Card'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class BatchDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {batchId: this.props.id}
  }

  render() {
    const {receipt, onGetBatchDetails} = this.props;
    return (
    <Card id='batch_details' title='Search Batch'>
      <div className='input-group mb-2'>
        <div className="input-group-prepend">
          <div className="input-group-text">
            <FontAwesomeIcon icon="search" />
          </div>
        </div>
        <input type="text"
          class="form-control"
          placeholder="BatchId"
          aria-label="Username"
          aria-describedby="basic-addon1"
          value={this.state.batchId}
          onChange={(e) => this.setState({batchId: e.target.value})}
         />
        <div class="input-group-append">
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => {
              onGetBatchDetails(this.state.batchId)
              }
            }>Search</button>
        </div>
      </div>
      <JSONPretty json={receipt}/>
    </Card>);
  }
}

export default connect (
  state => ({
    receipt: state.batchesReducer.batch,
    receiptLoading: state.batchesReducer.batchLoading,
  }),
  dispatch => ({
    onGetBatchDetails: id => getBatchDetails(dispatch, id),
  })
  )(BatchDetails);
